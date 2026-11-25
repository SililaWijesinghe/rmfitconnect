import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Users, Clock, Lock, CheckCircle2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useBookSlot } from "@/lib/bookings.functions";
import {
  GuideButton,
  SpotlightTour,
  useFirstVisitGuide,
  type GuideStep,
} from "@/components/SpotlightTour";

export const Route = createFileRoute("/_authenticated/book")({
  component: BookPage,
});

const MORNING = ["06:30", "07:30", "08:30", "09:30"];
const EVENING = ["15:30", "16:30", "17:30", "18:30", "19:30", "20:30", "21:30"];

type SlotInfo = { start: string; count: number; cap: number; period: "morning" | "evening"; mine: boolean };

const BOOK_GUIDE: GuideStep[] = [
  {
    target: "book-dates",
    title: "Start with the day",
    body: "Scroll this strip for the next 14 days. Today is selected for you.",
  },
  {
    target: "book-morning",
    title: "Morning sessions",
    body: "06:30 to 09:30, two clients per hour. Tap an open slot to take it.",
  },
  {
    target: "book-evening",
    title: "Evening sessions",
    body: "15:30 to 21:30, four clients per hour. Full slots lock themselves.",
  },
  {
    target: "book-sessions-link",
    title: "Your bookings live here",
    body: "My sessions lists everything you've booked — and lets you cancel.",
  },
];

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
  const [confirmed, setConfirmed] = useState<{ start: string; period: string } | null>(null);
  const guide = useFirstVisitGuide("rm.guide.book.v1");

  useEffect(() => setConfirmed(null), [selected]);

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

  const bookSlotFn = useBookSlot();
  async function book(slot: SlotInfo) {
    if (status !== "active") {
      toast.error("Your account isn't active yet.");
      return;
    }
    setPending(slot.start);
    try {
      await bookSlotFn({ data: { date: fmtDateKey(selected), start: slot.start } });
      toast.success("Booked!");
      setConfirmed({ start: slot.start, period: slot.period });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Booking failed";
      toast.error(msg.includes("Slot full") ? "That slot just filled" : msg);
    } finally {
      setPending(null);
      refresh();
    }
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
    setConfirmed(null);
    toast.success("Session cancelled");
    refresh();
  }

  return (
    <div className="space-y-5 pt-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Sessions</p>
          <h1 className="mt-1 font-display text-3xl font-bold">Book a slot</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            1-hour sessions. Morning caps at 2, evening caps at 4.
          </p>
        </div>
        <GuideButton onClick={() => guide.setOpen(true)} />
      </div>

      {status === "pending" && (
        <div className="glass border-l-2 border-[color:var(--neon-magenta)] p-4 text-sm">
          You can browse but not book yet — your account is pending trainer approval.
        </div>
      )}

      {confirmed && (
        <div className="rm-pop glass-strong border border-white/25 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                Booking confirmed
              </p>
              <p className="rm-tabular mt-2 font-display text-3xl tracking-wide">
                {selected.toLocaleDateString(undefined, {
                  weekday: "long",
                  day: "numeric",
                  month: "short",
                })}{" "}
                · {confirmed.start}
              </p>
              <p className="mt-1 text-xs capitalize text-muted-foreground">
                {confirmed.period} session · 1 hour
              </p>
            </div>
            <CheckCircle2 className="size-6 shrink-0" aria-hidden="true" />
          </div>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {[
              "Arrive 10 minutes early to warm up",
              "Bring water, a towel and trainers",
              "Tap this slot again to cancel",
              "Cancel the day before if plans change",
            ].map((step) => (
              <li key={step} className="flex items-start gap-2 text-sm">
                <CheckCircle2
                  className="mt-0.5 size-4 shrink-0 text-[color:var(--neon-cyan)]"
                  aria-hidden="true"
                />
                <span className="text-pretty">{step}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link
              to="/my-bookings"
              className="text-xs text-[color:var(--neon-cyan)] underline underline-offset-4"
            >
              See it in My sessions →
            </Link>
            <button
              type="button"
              onClick={() => setConfirmed(null)}
              className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="-mx-4 overflow-x-auto px-4" data-tour="book-dates">
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
        tourId="book-morning"
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
        tourId="book-evening"
      />

      <Link
        to="/my-bookings"
        data-tour="book-sessions-link"
        className="glass block rounded-md p-4 text-center text-sm hover:bg-white/[0.08]"
      >
        View my sessions →
      </Link>

      <SpotlightTour
        steps={BOOK_GUIDE}
        open={guide.open}
        onOpenChange={guide.setOpen}
        onComplete={guide.markSeen}
      />
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
  tourId,
}: {
  title: string;
  cap: number;
  slots: SlotInfo[];
  loading: boolean;
  pending: string | null;
  onBook: (s: SlotInfo) => void;
  onCancel: (s: SlotInfo) => void;
  canBook: boolean;
  tourId?: string;
}) {
  return (
    <div data-tour={tourId}>
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
