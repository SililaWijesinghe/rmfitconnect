import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Dumbbell,
  ShieldCheck,
  Zap,
  CalendarClock,
  Loader2,
  Users,
  Clock,
  Lock,
  CheckCircle2,
  HeartPulse,
  ShieldPlus,
  Save,
  LogOut,
  UserCog,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import heroImg from "@/assets/hero-athlete.jpg";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "RM Personal Training — Train Harder. Look Sharper." },
      {
        name: "description",
        content:
          "Book 1-hour personal training sessions with RM. Monochrome, high-energy client hub for booking, health tracking and elite coaching.",
      },
    ],
  }),
});

type SessionUser = { id: string; email: string | null };
type Status = "pending" | "active" | "denied";

function Home() {
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined);
  const [status, setStatus] = useState<Status | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [fullName, setFullName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    async function load() {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      const u = data.user;
      if (!u) {
        setUser(null);
        return;
      }
      setUser({ id: u.id, email: u.email ?? null });
      const [{ data: p }, { data: r }] = await Promise.all([
        supabase.from("profiles").select("status,full_name").eq("id", u.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", u.id).eq("role", "admin").maybeSingle(),
      ]);
      if (!mounted) return;
      setStatus((p?.status as Status) ?? "pending");
      setFullName(p?.full_name ?? "");
      setIsAdmin(!!r);
    }
    load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => load());
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setStatus(null);
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen">
      <SiteHeader user={user} isAdmin={isAdmin} onSignOut={signOut} />
      <main className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        {user === undefined ? (
          <div className="flex items-center justify-center py-40">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : !user ? (
          <LandingHero />
        ) : (
          <MemberHome
            userId={user.id}
            email={user.email}
            name={fullName}
            status={status ?? "pending"}
            isAdmin={isAdmin}
          />
        )}
      </main>
      <footer className="border-t border-border/40 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} RM Personal Training · Train harder. Look sharper.
      </footer>
    </div>
  );
}

/* ---------------- Header ---------------- */

function SiteHeader({
  user,
  isAdmin,
  onSignOut,
}: {
  user: SessionUser | null | undefined;
  isAdmin: boolean;
  onSignOut: () => void;
}) {
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
      <Link to="/" className="flex items-center gap-2">
        <div className="btn-neon flex h-9 w-9 items-center justify-center rounded-lg">
          <Dumbbell className="h-5 w-5" />
        </div>
        <span className="font-display text-xl tracking-widest">RM.TRAINING</span>
      </Link>
      <nav className="flex items-center gap-2">
        {!user ? (
          <>
            <Link to="/auth" className="rounded-md px-4 py-2 text-sm hover:bg-white/5">
              Sign in
            </Link>
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="btn-neon hover:btn-neon-hover rounded-md px-4 py-2 text-sm"
            >
              Join now
            </Link>
          </>
        ) : (
          <>
            {isAdmin && (
              <Link
                to="/admin"
                className="glass inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs"
              >
                <UserCog className="h-3.5 w-3.5" /> Admin
              </Link>
            )}
            <Link
              to="/my-bookings"
              className="glass inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs"
            >
              My sessions
            </Link>
            <button
              onClick={onSignOut}
              className="glass inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </>
        )}
      </nav>
    </header>
  );
}

/* ---------------- Landing (logged-out) ---------------- */

function LandingHero() {
  return (
    <>
      <section className="relative grid gap-10 pt-10 sm:pt-16 lg:grid-cols-2 lg:items-center">
        <div>
          <div className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            <Zap className="h-3 w-3" /> Elite personal training
          </div>
          <h1 className="mt-6 font-display text-6xl leading-[0.9] tracking-tight sm:text-8xl">
            Train <span className="text-gradient-neon">harder.</span>
            <br />
            Look <span className="text-gradient-neon">sharper.</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg text-muted-foreground">
            Private 1-on-few coaching with RM. Reserve your slot, log your body, and show up
            ready to break records.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="btn-neon hover:btn-neon-hover rounded-md px-6 py-3 text-sm"
            >
              Create your account
            </Link>
            <Link
              to="/auth"
              className="glass rounded-md px-6 py-3 text-center text-sm hover:bg-white/[0.08]"
            >
              I already train with RM
            </Link>
          </div>
        </div>
        <div className="relative">
          <img
            src={heroImg}
            alt="Athlete lifting in a black-and-white gym"
            width={1536}
            height={1024}
            className="glow-ring rounded-2xl object-cover"
          />
          <div className="glass-strong absolute -bottom-6 -left-4 hidden items-center gap-3 rounded-xl p-4 sm:flex">
            <div className="btn-neon flex h-10 w-10 items-center justify-center rounded-lg">
              <CalendarClock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Next slot</p>
              <p className="font-display text-lg">Tomorrow · 06:30</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-28 grid gap-4 sm:grid-cols-3">
        {[
          {
            icon: ShieldCheck,
            title: "Trainer-approved access",
            body: "Every account is personally reviewed and activated by RM. No spam, no randoms.",
          },
          {
            icon: CalendarClock,
            title: "Strict capacity slots",
            body: "1-hour sessions. 2 clients morning, 4 evening. Full slots lock automatically.",
          },
          {
            icon: HeartPulse,
            title: "Health-first profile",
            body: "Log injuries and allergies so every session pushes safely — not blindly.",
          },
        ].map(({ icon: Icon, title, body }) => (
          <div key={title} className="glass p-6">
            <div className="btn-neon inline-flex h-10 w-10 items-center justify-center rounded-lg">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-display text-xl tracking-wide">{title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{body}</p>
          </div>
        ))}
      </section>
    </>
  );
}

/* ---------------- Member Home (logged-in) ---------------- */

function MemberHome({
  userId,
  email,
  name,
  status,
  isAdmin,
}: {
  userId: string;
  email: string | null;
  name: string;
  status: Status;
  isAdmin: boolean;
}) {
  return (
    <div className="space-y-8 pt-4">
      <div className="glass-strong overflow-hidden p-6 sm:p-8">
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          Welcome back
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-wide sm:text-5xl">
          {name?.split(" ")[0] || email?.split("@")[0] || "Athlete"}
        </h1>
        <div className="mt-4">
          <StatusPill status={status} />
        </div>
      </div>

      {isAdmin && (
        <Link
          to="/admin"
          className="glass flex items-center justify-between p-5 hover:bg-white/[0.08]"
        >
          <div className="flex items-center gap-3">
            <UserCog className="h-5 w-5" />
            <div>
              <p className="font-display text-lg tracking-wide">Trainer console</p>
              <p className="text-xs text-muted-foreground">
                Approve clients, view schedule, manage health profiles.
              </p>
            </div>
          </div>
          <span className="text-xs uppercase tracking-widest">Open →</span>
        </Link>
      )}

      {status === "pending" && <PendingCard />}
      {status === "denied" && <DeniedCard />}

      {status === "active" && (
        <>
          <BookingWidget userId={userId} />
          <HealthForm userId={userId} />
        </>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: Status }) {
  const map: Record<Status, { text: string; cls: string }> = {
    pending: { text: "Pending approval", cls: "bg-white/10 text-white/80" },
    active: { text: "Active member", cls: "bg-white text-black" },
    denied: { text: "Denied", cls: "bg-destructive/20 text-destructive" },
  };
  const s = map[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${s.cls}`}
    >
      <CheckCircle2 className="h-3.5 w-3.5" /> {s.text}
    </span>
  );
}

function PendingCard() {
  return (
    <div className="glass border-l-2 border-white/60 p-5 text-sm">
      <p className="font-display text-xl tracking-wide">Awaiting trainer approval</p>
      <p className="mt-2 text-muted-foreground">
        RM will review your profile and activate your account. Once you're active, your booking
        calendar and injury form will unlock right here on the home page.
      </p>
    </div>
  );
}

function DeniedCard() {
  return (
    <div className="glass border-l-2 border-destructive p-5 text-sm">
      <p className="font-display text-xl tracking-wide">Account not approved</p>
      <p className="mt-2 text-muted-foreground">Please contact RM directly for more information.</p>
    </div>
  );
}

/* ---------------- Booking widget ---------------- */

const MORNING = ["06:30", "07:30", "08:30", "09:30"];
const EVENING = ["15:30", "16:30", "17:30", "18:30", "19:30", "20:30", "21:30"];

type SlotInfo = {
  start: string;
  count: number;
  cap: number;
  period: "morning" | "evening";
  mine: boolean;
};

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

function BookingWidget({ userId }: { userId: string }) {
  const dates = useMemo(() => nextDates(14), []);
  const [selected, setSelected] = useState<Date>(dates[0]);
  const [rows, setRows] = useState<Array<{ user_id: string; slot_start: string; slot_date: string }>>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<string | null>(null);

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
          mine: at.some((r) => r.user_id === userId),
        };
      });
    return [...build(MORNING, 2, "morning"), ...build(EVENING, 4, "evening")];
  }, [rows, userId]);

  async function book(slot: SlotInfo) {
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
      .eq("user_id", userId)
      .eq("slot_date", fmtDateKey(selected))
      .eq("slot_start", slot.start);
    setPending(null);
    if (error) return toast.error(error.message);
    toast.success("Session cancelled");
    refresh();
  }

  return (
    <section className="glass-strong p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            Sessions
          </p>
          <h2 className="mt-1 font-display text-3xl tracking-wide">Book a slot</h2>
        </div>
        <CalendarClock className="h-6 w-6 opacity-60" />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        1-hour sessions. Morning caps at 2, evening at 4.
      </p>

      <div className="mt-5 -mx-2 overflow-x-auto px-2">
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
                <div className="font-display text-xl tracking-wide">{d.getDate()}</div>
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
      />
      <SlotSection
        title="Evening · 15:30 → 22:30"
        cap={4}
        slots={slots.filter((s) => s.period === "evening")}
        loading={loading}
        pending={pending}
        onBook={book}
        onCancel={cancel}
      />
    </section>
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
}: {
  title: string;
  cap: number;
  slots: SlotInfo[];
  loading: boolean;
  pending: string | null;
  onBook: (s: SlotInfo) => void;
  onCancel: (s: SlotInfo) => void;
}) {
  return (
    <div className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-sm tracking-[0.25em] text-muted-foreground">{title}</h3>
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
            const stateCls = s.mine
              ? "glow-ring"
              : full
                ? "opacity-50"
                : "";
            return (
              <button
                key={s.start}
                disabled={busy || (!s.mine && full)}
                onClick={() => (s.mine ? onCancel(s) : onBook(s))}
                className={`glass flex flex-col items-start gap-1 p-4 text-left transition hover:bg-white/[0.08] ${stateCls}`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="font-display text-xl tracking-wide">{s.start}</span>
                  {s.mine ? (
                    <CheckCircle2 className="h-4 w-4" />
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
                  {busy ? "…" : s.mine ? "Booked · tap to cancel" : full ? "Full" : "Available"}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------------- Health / Injury form ---------------- */

const healthSchema = z.object({
  injuries: z.string().trim().max(1000),
  allergies: z.string().trim().max(1000),
  notes: z.string().trim().max(1000),
});

function HealthForm({ userId }: { userId: string }) {
  const [form, setForm] = useState({ injuries: "", allergies: "", notes: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("health_profiles")
        .select("injuries,allergies,notes")
        .eq("user_id", userId)
        .maybeSingle();
      if (data)
        setForm({
          injuries: data.injuries ?? "",
          allergies: data.allergies ?? "",
          notes: data.notes ?? "",
        });
      setLoading(false);
    })();
  }, [userId]);

  async function save() {
    setSaving(true);
    try {
      const parsed = healthSchema.parse(form);
      const { error } = await supabase
        .from("health_profiles")
        .upsert({ user_id: userId, ...parsed, updated_at: new Date().toISOString() });
      if (error) throw error;
      toast.success("Health profile saved");
    } catch (err) {
      const msg = err instanceof z.ZodError ? err.issues[0]?.message : (err as Error).message;
      toast.error(msg ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="glass-strong p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Body</p>
          <h2 className="mt-1 font-display text-3xl tracking-wide">Injury & health form</h2>
        </div>
        <HeartPulse className="h-6 w-6 opacity-60" />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Keep this current so every session is safe and pushes the right way.
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          <Field
            icon={<HeartPulse className="h-4 w-4" />}
            title="Current injuries"
            hint="Aches, past surgeries, mobility limits."
            value={form.injuries}
            onChange={(v) => setForm({ ...form, injuries: v })}
          />
          <Field
            icon={<ShieldPlus className="h-4 w-4" />}
            title="Allergies"
            hint="Foods, medications, environmental triggers."
            value={form.allergies}
            onChange={(v) => setForm({ ...form, allergies: v })}
          />
          <Field
            icon={<HeartPulse className="h-4 w-4" />}
            title="Notes for RM"
            hint="Anything else the trainer should know."
            value={form.notes}
            onChange={(v) => setForm({ ...form, notes: v })}
          />
          <button
            onClick={save}
            disabled={saving}
            className="btn-neon hover:btn-neon-hover flex w-full items-center justify-center gap-2 rounded-md px-4 py-3 text-sm"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save profile
          </button>
        </div>
      )}
    </section>
  );
}

function Field({
  icon,
  title,
  hint,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="glass p-4">
      <div className="flex items-center gap-2">
        {icon}
        <h4 className="font-display text-base tracking-wide">{title}</h4>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        maxLength={1000}
        className="mt-3 w-full resize-none rounded-md border border-white/10 bg-black/40 p-3 text-sm outline-none focus:border-white focus:ring-2 focus:ring-white/30"
        placeholder="Type here…"
      />
      <div className="mt-1 text-right text-[10px] text-muted-foreground">{value.length}/1000</div>
    </div>
  );
}
