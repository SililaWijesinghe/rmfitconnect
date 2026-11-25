import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CalendarDays, Loader2, Trash2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import {
  GuideButton,
  SpotlightTour,
  useFirstVisitGuide,
  type GuideStep,
} from "@/components/SpotlightTour";

type Booking = { id: string; slot_date: string; slot_start: string; period: string };

const SESSIONS_GUIDE: GuideStep[] = [
  {
    target: "bookings-upcoming",
    title: "Your booked sessions",
    body: "Everything coming up. The bin icon cancels a session and frees the slot.",
  },
  {
    target: "bookings-past",
    title: "And your history",
    body: "Past sessions stay listed here so you can see how consistent you've been.",
  },
];

export const Route = createFileRoute("/_authenticated/my-bookings")({
  component: MyBookings,
});

function MyBookings() {
  const { user } = Route.useRouteContext();
  const [rows, setRows] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const guide = useFirstVisitGuide("rm.guide.sessions.v1");

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("bookings")
      .select("id,slot_date,slot_start,period")
      .eq("user_id", user.id)
      .order("slot_date", { ascending: true })
      .order("slot_start", { ascending: true });
    setRows((data as Booking[] | null) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  async function cancel(id: string) {
    const { error } = await supabase.from("bookings").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Cancelled");
    load();
  }

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = rows.filter((r) => r.slot_date >= today);
  const past = rows.filter((r) => r.slot_date < today);

  return (
    <div className="space-y-5 pt-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Your sessions</p>
          <h1 className="mt-1 font-display text-3xl font-bold">My bookings</h1>
        </div>
        <GuideButton onClick={() => guide.setOpen(true)} />
      </div>
      {loading ? (
        <div className="glass flex items-center justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : (
        <>
          <Group
            title="Upcoming"
            rows={upcoming}
            onCancel={cancel}
            empty="No upcoming sessions."
            tourId="bookings-upcoming"
          />
          <Group title="Past" rows={past} empty="No past sessions yet." tourId="bookings-past" />
        </>
      )}

      <SpotlightTour
        steps={SESSIONS_GUIDE}
        open={guide.open}
        onOpenChange={guide.setOpen}
        onComplete={guide.markSeen}
      />
    </div>
  );
}

function Group({
  title,
  rows,
  empty,
  onCancel,
  tourId,
}: {
  title: string;
  rows: Booking[];
  empty: string;
  onCancel?: (id: string) => void;
  tourId?: string;
}) {
  return (
    <div data-tour={tourId}>
      <h3 className="mb-2 font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </h3>
      {rows.length === 0 ? (
        <div className="glass p-5 text-sm text-muted-foreground">{empty}</div>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.id} className="glass flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="btn-neon flex h-10 w-10 items-center justify-center rounded-lg">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display text-base font-semibold">
                    {new Date(r.slot_date).toLocaleDateString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    · {r.slot_start.slice(0, 5)}
                  </p>
                  <p className="text-xs capitalize text-muted-foreground">{r.period}</p>
                </div>
              </div>
              {onCancel && (
                <button
                  onClick={() => onCancel(r.id)}
                  aria-label="Cancel this session"
                  className="rounded-md p-2 text-muted-foreground hover:bg-white/5 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
