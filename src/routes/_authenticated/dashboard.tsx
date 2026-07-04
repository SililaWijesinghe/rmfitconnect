import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CalendarPlus, HeartPulse, Clock, CheckCircle2, HelpCircle } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

type Profile = {
  full_name: string;
  status: "pending" | "active" | "denied";
  avatar_url: string | null;
};

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { user } = Route.useRouteContext();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [bookings, setBookings] = useState<number>(0);

  useEffect(() => {
    (async () => {
      const { data: p } = await supabase
        .from("profiles")
        .select("full_name,status,avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      setProfile((p as Profile | null) ?? null);
      const { count } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .gte("slot_date", new Date().toISOString().slice(0, 10));
      setBookings(count ?? 0);
    })();
  }, [user.id]);

  const status = profile?.status ?? "pending";

  return (
    <div className="space-y-6 pt-4">
      <div className="glass-strong overflow-hidden p-6">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Welcome</p>
        <h1 className="mt-1 font-display text-3xl font-bold">
          {profile?.full_name?.split(" ")[0] || "Athlete"}
        </h1>
        <div className="mt-4 flex items-center gap-2 text-sm">
          <StatusBadge status={status} />
        </div>
      </div>

      {status === "pending" && (
        <div className="glass border-l-2 border-[color:var(--neon-magenta)] p-5 text-sm">
          <div className="flex gap-3">
            <HelpCircle className="h-5 w-5 shrink-0 text-[color:var(--neon-magenta)]" />
            <div>
              <p className="font-semibold">Awaiting trainer approval</p>
              <p className="mt-1 text-muted-foreground">
                RM will review your profile and activate your account. You'll get a WhatsApp
                message with login details once approved.
              </p>
            </div>
          </div>
        </div>
      )}

      {status === "denied" && (
        <div className="glass border-l-2 border-destructive p-5 text-sm">
          <p className="font-semibold">Account not approved</p>
          <p className="mt-1 text-muted-foreground">
            Please contact RM directly for more information.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Link to="/book" className="glass block p-5 hover:bg-white/[0.08]">
          <CalendarPlus className="h-6 w-6 text-[color:var(--neon-cyan)]" />
          <p className="mt-3 text-sm font-semibold">Book a session</p>
          <p className="text-xs text-muted-foreground">Pick your slot</p>
        </Link>
        <Link to="/health" className="glass block p-5 hover:bg-white/[0.08]">
          <HeartPulse className="h-6 w-6 text-[color:var(--neon-magenta)]" />
          <p className="mt-3 text-sm font-semibold">Health profile</p>
          <p className="text-xs text-muted-foreground">Injuries & allergies</p>
        </Link>
      </div>

      <div className="glass p-5">
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-[color:var(--neon-cyan)]" />
          <div>
            <p className="text-sm font-semibold">Upcoming sessions</p>
            <p className="text-xs text-muted-foreground">
              You have {bookings} upcoming session{bookings === 1 ? "" : "s"}.
            </p>
          </div>
        </div>
        <Link
          to="/my-bookings"
          className="mt-3 inline-block text-xs text-[color:var(--neon-cyan)] underline underline-offset-4"
        >
          View all →
        </Link>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: "pending" | "active" | "denied" }) {
  const map = {
    pending: { text: "Pending approval", cls: "bg-[color:var(--neon-magenta)]/20 text-[color:var(--neon-magenta)]" },
    active: { text: "Active", cls: "bg-[color:var(--neon-cyan)]/20 text-[color:var(--neon-cyan)]" },
    denied: { text: "Denied", cls: "bg-destructive/20 text-destructive" },
  } as const;
  const s = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${s.cls}`}>
      <CheckCircle2 className="h-3.5 w-3.5" /> {s.text}
    </span>
  );
}
