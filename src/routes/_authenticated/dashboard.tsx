import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CalendarPlus, HeartPulse, Clock, CheckCircle2, HelpCircle, Activity } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Avatar } from "@/components/Avatar";
import {
  GuideButton,
  SpotlightTour,
  useFirstVisitGuide,
  type GuideStep,
} from "@/components/SpotlightTour";
import { calcBMI, bmiCategory } from "@/lib/health-utils";

type Profile = {
  full_name: string;
  status: "pending" | "active" | "denied";
  avatar_url: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  age: number | null;
};

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

const DASHBOARD_GUIDE: GuideStep[] = [
  {
    target: "dashboard-status",
    title: "Your status badge",
    body: "Pending until RM approves you, then Active. Booking stays locked until it says Active.",
  },
  {
    target: "dashboard-metrics",
    title: "Your starting numbers",
    body: "Age, height and weight feed the BMI card below. They come from your sign-up form.",
  },
  {
    target: "nav-book",
    title: "Tap Book to reserve a session",
    body: "Fourteen days of one-hour slots. Morning takes 2 clients, evening takes 4.",
  },
  {
    target: "nav-sessions",
    title: "Sessions keeps the list",
    body: "Every booking, upcoming and past, plus the cancel button for each.",
  },
  {
    target: "nav-health",
    title: "Tell RM about your body",
    body: "Injuries and allergies are programmed around, so keep this one current.",
  },
  {
    target: "dashboard-guide",
    title: "Lost later? Tap here",
    body: "This replays the same guide whenever you need it — nothing is hidden behind it.",
  },
];

function Dashboard() {
  const { user } = Route.useRouteContext();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [bookings, setBookings] = useState<number>(0);
  const guide = useFirstVisitGuide("rm.guide.dashboard.v1");

  useEffect(() => {
    (async () => {
      const { data: p } = await supabase
        .from("profiles")
        .select("full_name,status,avatar_url,height_cm,weight_kg,age")
        .eq("id", user.id)
        .maybeSingle();
      setProfile((p as Profile | null) ?? null);
      const { count } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("slot_date", new Date().toISOString().slice(0, 10));
      setBookings(count ?? 0);
    })();
  }, [user.id]);

  const status = profile?.status ?? "pending";
  const bmi = calcBMI(profile?.height_cm ?? null, profile?.weight_kg ?? null);
  const cat = bmiCategory(bmi);

  return (
    <div className="space-y-6 pt-4">
      <div className="glass-strong overflow-hidden p-6">
        <div className="flex items-center gap-4">
          <Avatar url={profile?.avatar_url} name={profile?.full_name ?? "A"} size={64} />
          <div className="flex-1">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Welcome</p>
            <h1 className="mt-1 font-display text-3xl font-bold">
              {profile?.full_name?.split(" ")[0] || "Athlete"}
            </h1>
          </div>
        </div>
        <div
          data-tour="dashboard-status"
          className="mt-4 flex flex-wrap items-center gap-2 rounded-lg text-sm"
        >
          <StatusBadge status={status} />
          <GuideButton tourId="dashboard-guide" onClick={() => guide.setOpen(true)} />
        </div>
      </div>

      <div data-tour="dashboard-metrics" className="grid grid-cols-3 gap-3 rounded-lg">
        <Metric label="Age" value={profile?.age ?? "–"} />
        <Metric label="Height" value={profile?.height_cm ? `${profile.height_cm}` : "–"} unit="cm" />
        <Metric label="Weight" value={profile?.weight_kg ? `${profile.weight_kg}` : "–"} unit="kg" />
      </div>

      <div className={`glass-strong p-5 border ${cat.cls.split(" ").filter(c => c.startsWith("border-")).join(" ")}`}>
        <div className="flex items-center gap-3">
          <Activity className={`h-6 w-6 ${cat.cls.split(" ").filter(c => c.startsWith("text-")).join(" ")}`} />
          <div className="flex-1">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Your BMI</p>
            <div className="flex items-end gap-2">
              <span className="font-display text-4xl font-bold">{bmi ?? "–"}</span>
              <span className={`mb-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${cat.cls}`}>
                {cat.label}
              </span>
            </div>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {bmi === null
            ? "Add height & weight in your profile to calculate."
            : "Healthy range: 18.5 – 24.9"}
        </p>
      </div>

      {status === "pending" && (
        <div className="glass border-l-2 border-amber-400 p-5 text-sm">
          <div className="flex gap-3">
            <HelpCircle className="h-5 w-5 shrink-0 text-amber-400" />
            <div>
              <p className="font-semibold text-amber-300">Awaiting trainer approval</p>
              <p className="mt-1 text-muted-foreground">
                RM will review your profile and activate your account. You'll get a WhatsApp
                message with login details once approved.
              </p>
            </div>
          </div>
        </div>
      )}

      {status === "denied" && (
        <div className="glass border-l-2 border-red-500 p-5 text-sm">
          <p className="font-semibold text-red-400">Account not approved</p>
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
              You have <span className={bookings > 0 ? "text-emerald-400 font-semibold" : "text-muted-foreground"}>{bookings}</span> upcoming session{bookings === 1 ? "" : "s"}.
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

      <SpotlightTour
        steps={DASHBOARD_GUIDE}
        open={guide.open}
        onOpenChange={guide.setOpen}
        onComplete={guide.markSeen}
      />
    </div>
  );
}

function Metric({ label, value, unit }: { label: string; value: string | number; unit?: string }) {
  return (
    <div className="glass p-3 text-center">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-2xl font-bold">
        {value}
        {unit && <span className="ml-0.5 text-xs text-muted-foreground">{unit}</span>}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: "pending" | "active" | "denied" }) {
  const map = {
    pending: { text: "Pending approval", cls: "bg-amber-500/15 text-amber-300 border border-amber-400/40" },
    active: { text: "Active", cls: "bg-emerald-500/15 text-emerald-400 border border-emerald-400/40" },
    denied: { text: "Denied", cls: "bg-red-500/15 text-red-400 border border-red-500/40" },
  } as const;
  const s = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${s.cls}`}>
      <CheckCircle2 className="h-3.5 w-3.5" /> {s.text}
    </span>
  );
}
