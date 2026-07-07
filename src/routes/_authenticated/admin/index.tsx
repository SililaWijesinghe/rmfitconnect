import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Users,
  UserCheck,
  Clock3,
  CalendarCheck,
  Activity,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { approveUser } from "@/lib/notifications.functions";
import { Avatar } from "@/components/Avatar";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { calcBMI, bmiCategory } from "@/lib/health-utils";

type Pending = {
  id: string;
  full_name: string;
  phone: string | null;
  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  avatar_url: string | null;
  status: "pending" | "active" | "denied";
  created_at: string;
};

type Stats = {
  total: number;
  active: number;
  pending: number;
  denied: number;
  todaySessions: number;
  weekSessions: number;
  avgBmi: number;
};

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminApprovals,
});

function AdminApprovals() {
  const [rows, setRows] = useState<Pending[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    active: 0,
    pending: 0,
    denied: 0,
    todaySessions: 0,
    weekSessions: 0,
    avgBmi: 0,
  });

  async function loadStats() {
    const { data: profs } = await supabase
      .from("profiles")
      .select("status,height_cm,weight_kg");
    const list = profs ?? [];
    const today = new Date().toISOString().slice(0, 10);
    const wkAhead = new Date();
    wkAhead.setDate(wkAhead.getDate() + 7);
    const wkKey = wkAhead.toISOString().slice(0, 10);
    const [{ count: tCount }, { count: wCount }] = await Promise.all([
      supabase.from("bookings").select("id", { count: "exact", head: true }).eq("slot_date", today),
      supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .gte("slot_date", today)
        .lte("slot_date", wkKey),
    ]);
    const bmis = list
      .map((p) => calcBMI(p.height_cm as number | null, p.weight_kg as number | null))
      .filter((n): n is number => n !== null);
    const avgBmi = bmis.length ? +(bmis.reduce((a, b) => a + b, 0) / bmis.length).toFixed(1) : 0;
    setStats({
      total: list.length,
      active: list.filter((p) => p.status === "active").length,
      pending: list.filter((p) => p.status === "pending").length,
      denied: list.filter((p) => p.status === "denied").length,
      todaySessions: tCount ?? 0,
      weekSessions: wCount ?? 0,
      avgBmi,
    });
  }

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("id,full_name,phone,age,height_cm,weight_kg,avatar_url,status,created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    setRows((data as Pending[] | null) ?? []);
    setLoading(false);
    loadStats();
  }

  useEffect(() => {
    load();
  }, []);

  async function approve(p: Pending) {
    setBusy(p.id);
    try {
      await approveUser({ data: { userId: p.id } });
      toast.success(`Approved ${p.full_name} — activation message sent.`);
      load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function deny(p: Pending) {
    setBusy(p.id);
    const { error } = await supabase.from("profiles").update({ status: "denied" }).eq("id", p.id);
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success("Denied");
    load();
  }

  return (
    <div className="space-y-5">
      {/* Animated stats dashboard */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Overview
        </p>
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard icon={<Users className="h-4 w-4" />} label="Total clients" value={stats.total} tone="neutral" />
          <StatCard icon={<UserCheck className="h-4 w-4" />} label="Active" value={stats.active} tone="good" />
          <StatCard icon={<Clock3 className="h-4 w-4" />} label="Pending" value={stats.pending} tone={stats.pending > 0 ? "warn" : "neutral"} pulse={stats.pending > 0} />
          <StatCard icon={<XCircle className="h-4 w-4" />} label="Denied" value={stats.denied} tone={stats.denied > 0 ? "bad" : "neutral"} />
          <StatCard icon={<CalendarCheck className="h-4 w-4" />} label="Today's sessions" value={stats.todaySessions} tone="accent" />
          <StatCard icon={<CalendarCheck className="h-4 w-4" />} label="Next 7 days" value={stats.weekSessions} tone="accent" />
          <StatCard icon={<Activity className="h-4 w-4" />} label="Avg BMI" value={stats.avgBmi} decimals tone={avgBmiTone(stats.avgBmi)} />
        </div>
      </div>

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Pending approvals
        </p>

        {loading ? (
          <div className="glass mt-2 flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <div className="glass mt-2 p-6 text-center text-sm text-emerald-400">
            No pending accounts. All caught up 🔥
          </div>
        ) : (
          <div className="mt-2 space-y-3">
            {rows.map((p) => {
              const bmi = calcBMI(p.height_cm, p.weight_kg);
              const cat = bmiCategory(bmi);
              return (
                <div key={p.id} className="glass-strong p-4">
                  <div className="flex items-start gap-3">
                    <Avatar url={p.avatar_url} name={p.full_name} size={52} />
                    <div className="flex-1">
                      <p className="font-display text-lg font-semibold">{p.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.phone ?? "no phone"} · age {p.age ?? "–"} · {p.height_cm ?? "–"}cm ·{" "}
                        {p.weight_kg ?? "–"}kg
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${cat.cls}`}>
                          BMI {bmi ?? "–"} · {cat.label}
                        </span>
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                          Signed up {new Date(p.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      disabled={busy === p.id}
                      onClick={() => approve(p)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-md border border-emerald-400/50 bg-emerald-500/15 py-2 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/25"
                    >
                      {busy === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      Approve & notify
                    </button>
                    <button
                      disabled={busy === p.id}
                      onClick={() => deny(p)}
                      className="flex items-center justify-center gap-2 rounded-md border border-red-500/50 bg-red-500/15 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/25"
                    >
                      <XCircle className="h-4 w-4" /> Deny
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function avgBmiTone(v: number): Tone {
  if (v === 0) return "neutral";
  if (v < 18.5 || v >= 30) return "bad";
  if (v < 25) return "good";
  return "warn";
}

type Tone = "neutral" | "good" | "warn" | "bad" | "accent";

function StatCard({
  icon,
  label,
  value,
  tone = "neutral",
  decimals = false,
  pulse = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone?: Tone;
  decimals?: boolean;
  pulse?: boolean;
}) {
  const toneCls: Record<Tone, string> = {
    neutral: "text-foreground border-white/10",
    good: "text-emerald-400 border-emerald-400/40",
    warn: "text-amber-300 border-amber-400/40",
    bad: "text-red-400 border-red-500/40",
    accent: "text-[color:var(--neon-cyan)] border-white/20",
  };
  return (
    <div className={`glass relative overflow-hidden border p-3 ${toneCls[tone]}`}>
      {pulse && (
        <span className="absolute right-2 top-2 flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400/60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
        </span>
      )}
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest opacity-80">
        {icon}
        {label}
      </div>
      <div className="mt-1 font-display text-3xl font-bold leading-none">
        {decimals ? (
          value.toFixed(1)
        ) : (
          <AnimatedNumber value={value} />
        )}
      </div>
    </div>
  );
}
