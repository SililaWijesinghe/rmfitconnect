import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Users, Clock, Lock, CheckCircle2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/book")({
  component: BookPage,
});

const MORNING = ["06:30", "07:30", "08:30", "09:30"];
const EVENING = ["15:30", "16:30", "17:30", "18:30", "19:30", "20:30", "21:30"];

type SlotInfo = { start: string; count: number; cap: number; period: "morning" | "evening"; mine: boolean };

function nextDates(n: number) {
  const arr: Date[] = [];
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  for (let i = 0; i < n; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    arr.push(d);
  }
  return arr;
}

function fmtDateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function BookPage() {
  const { user } = Route.useRouteContext();
  const [status, setStatus] = useState<"pending" | "active" | "denied" | "loading">("loading");
  const dates = useMemo(() => nextDates(14), []);
  const [selected, setSelected] = useState<Date>(dates[0]);
  const [rows, setRows] = useState<
    Array<{ user_id: string; slot_start: string; slot_date: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("status")
        .eq("id", user.id)
        .maybeSingle();
      setStatus((data?.status as "pending" | "active" | "denied") ?? "pending");
    })();
  }, [user.id]);

  async function refresh() {
    setLoading(true);
    const { data } = await supabase
      .from("bookings")
      .select("user_id,slot_start,slot_date")
      .eq("slot_date", fmtDateKey(selected));
    setRows(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const slots: SlotInfo[] = useMemo(() => {
    const build = (times: string[], cap: number, period: "morning" | "evening") =>
      times.map<SlotInfo>((start) => {
        const at = rows.filter((r) => r.slot_start.startsWith(start));
        return {
          start,
          count: at.length,
          cap,
          period,
          mine: at.some((r) => r.user_id === user.id),
        };
      });
    return [...build(MORNING, 2, "morning"), ...build(EVENING, 4, "evening")];
  }, [rows, user.id]);

  async function book(slot: SlotInfo) {
    if (status !== "active") {
      toast.error("Your account isn't active yet.");
      return;
    }
    setPending(slot.start);
    const { error } = await supabase.rpc("book_slot", {
      _date: fmtDateKey(selected),
      _start: slot.start,
    });
    setPending(null);
    if (error) {
      toast.error(error.message.includes("Slot full") ? "That slot just filled" : error.message);
      refresh();
      return;
    }
    toast.success("Booked!");
    refresh();
  }

  async function cancel(slot: SlotInfo) {
    setPending(slot.start);
    const { error } = await supabase
      .from("bookings")
      .delete()
      .eq("user_id", user.id)
      .eq("slot_date", fmtDateKey(selected))
      .eq("slot_start", slot.start);
    setPending(null);
    if (error) return toast.error(error.message);
    toast.success("Session cancelled");
    refresh();
  }

  return (
    <div className="space-y-5 pt-4">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Sessions</p>
        <h1 className="mt-1 font-display text-3xl font-bold">Book a slot</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          1-hour sessions. Morning caps at 2, evening caps at 4.
        </p>
      </div>

      {status === "pending" && (
        <div className="glass border-l-2 border-[color:var(--neon-magenta)] p-4 text-sm">
          You can browse but not book yet — your account is pending trainer approval.
        </div>
      )}

      <div className="-mx-4 overflow-x-auto px-4">
        <div className="flex gap-2">
          {dates.map((d) => {
            const active = fmtDateKey(d) === fmtDateKey(selected);
            return (
              <button
                key={d.toISOString()}
                onClick={() => setSelected(d)}
                className={`min-w-[64px] rounded-2xl px-3 py-3 text-center transition ${
                  active ? "btn-neon" : "glass"
                }`}
              >
                <div className="text-[10px] uppercase opacity-70">
                  {d.toLocaleDateString(undefined, { weekday: "short" })}
                </div>
                <div className="font-display text-lg font-bold">{d.getDate()}</div>
                <div className="text-[10px] opacity-70">
                  {d.toLocaleDateString(undefined, { month: "short" })}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <SlotSection
        title="Morning · 06:30 → 10:30"
        cap={2}
        slots={slots.filter((s) => s.period === "morning")}
        loading={loading}
        pending={pending}
        onBook={book}
        onCancel={cancel}
        canBook={status === "active"}
      />
      <SlotSection
        title="Evening · 15:30 → 22:30"
        cap={4}
        slots={slots.filter((s) => s.period === "evening")}
        loading={loading}
        pending={pending}
        onBook={book}
        onCancel={cancel}
        canBook={status === "active"}
      />

      <Link
        to="/my-bookings"
        className="glass block rounded-md p-4 text-center text-sm hover:bg-white/[0.08]"
      >
        View my sessions →
      </Link>
    </div>
  );
}

function SlotSection({
  title,
  cap,
  slots,
  loading,
  pending,
  onBook,
  onCancel,
  canBook,
}: {
  title: string;
  cap: number;
  slots: SlotInfo[];
  loading: boolean;
  pending: string | null;
  onBook: (s: SlotInfo) => void;
  onCancel: (s: SlotInfo) => void;
  canBook: boolean;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </h3>
        <span className="text-xs text-muted-foreground">Cap {cap}</span>
      </div>
      {loading ? (
        <div className="glass flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {slots.map((s) => {
            const full = s.count >= s.cap && !s.mine;
            const busy = pending === s.start;
            const ratio = s.count / s.cap;
            const stateCls = s.mine
              ? "border-[color:var(--neon-cyan)] shadow-[0_0_30px_-8px_var(--neon-cyan)]"
              : full
                ? "opacity-50"
                : ratio >= 0.5
                  ? "border-[color:var(--neon-magenta)]/60"
                  : "";
            return (
              <button
                key={s.start}
                disabled={busy || (!s.mine && (full || !canBook))}
                onClick={() => (s.mine ? onCancel(s) : onBook(s))}
                className={`glass flex flex-col items-start gap-1 p-4 text-left transition ${stateCls}`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="font-display text-lg font-bold">{s.start}</span>
                  {s.mine ? (
                    <CheckCircle2 className="h-4 w-4 text-[color:var(--neon-cyan)]" />
                  ) : full ? (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" /> {s.count}/{s.cap}
                </div>
                <div className="text-[10px] uppercase tracking-widest">
                  {busy ? "…" : s.mine ? "Booked (tap to cancel)" : full ? "Full" : "Available"}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
