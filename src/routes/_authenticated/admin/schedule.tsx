import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Loader2, User } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

type Row = {
  id: string;
  slot_date: string;
  slot_start: string;
  period: string;
  user_id: string;
  profile?: { full_name: string; phone: string | null };
};

export const Route = createFileRoute("/_authenticated/admin/schedule")({
  component: AdminSchedule,
});

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

function AdminSchedule() {
  const dates = useMemo(() => nextDates(7), []);
  const [selected, setSelected] = useState(dates[0]);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const key = selected.toISOString().slice(0, 10);
      const { data } = await supabase
        .from("bookings")
        .select("id,slot_date,slot_start,period,user_id")
        .eq("slot_date", key)
        .order("slot_start", { ascending: true });
      const bookings = (data as Row[] | null) ?? [];
      if (bookings.length) {
        const ids = [...new Set(bookings.map((b) => b.user_id))];
        const { data: profs } = await supabase
          .from("profiles")
          .select("id,full_name,phone")
          .in("id", ids);
        const map = new Map((profs ?? []).map((p) => [p.id, p]));
        for (const b of bookings) {
          const p = map.get(b.user_id);
          if (p) b.profile = { full_name: p.full_name, phone: p.phone };
        }
      }
      setRows(bookings);
      setLoading(false);
    })();
  }, [selected]);

  const grouped = useMemo(() => {
    const m = new Map<string, Row[]>();
    for (const r of rows) {
      const k = r.slot_start.slice(0, 5);
      (m.get(k) ?? m.set(k, []).get(k)!).push(r);
    }
    return Array.from(m.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [rows]);

  return (
    <div className="space-y-4">
      <div className="-mx-4 overflow-x-auto px-4">
        <div className="flex gap-2">
          {dates.map((d) => {
            const active = d.toDateString() === selected.toDateString();
            return (
              <button
                key={d.toISOString()}
                onClick={() => setSelected(d)}
                className={`min-w-[64px] rounded-2xl px-3 py-3 text-center ${
                  active ? "btn-neon" : "glass"
                }`}
              >
                <div className="text-[10px] uppercase opacity-70">
                  {d.toLocaleDateString(undefined, { weekday: "short" })}
                </div>
                <div className="font-display text-lg font-bold">{d.getDate()}</div>
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="glass flex items-center justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : grouped.length === 0 ? (
        <div className="glass p-6 text-center text-sm text-muted-foreground">
          No sessions booked for this day.
        </div>
      ) : (
        grouped.map(([time, list]) => (
          <div key={time} className="glass-strong p-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-[color:var(--neon-cyan)]" />
              <span className="font-display text-lg font-bold">{time}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {list.length}/{list[0].period === "morning" ? 2 : 4}
              </span>
            </div>
            <div className="mt-3 space-y-1.5">
              {list.map((r) => (
                <div key={r.id} className="flex items-center gap-2 text-sm">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{r.profile?.full_name ?? "Unknown"}</span>
                  {r.profile?.phone && (
                    <span className="text-xs text-muted-foreground">· {r.profile.phone}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
