import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  CalendarPlus,
  CheckCircle2,
  Clock,
  Dumbbell,
  HeartPulse,
  KeyRound,
  ListChecks,
  Loader2,
  Lock,
  LogOut,
  Mail,
  MousePointerClick,
  PartyPopper,
  PlayCircle,
  RefreshCw,
  Save,
  ShieldCheck,
  ShieldPlus,
  Sparkles,
  UserCog,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { AnimatedNumber } from "@/components/AnimatedNumber";
import { SpotlightTour, type GuideStep } from "@/components/SpotlightTour";
import { Reveal, useInView } from "@/components/Reveal";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useBookSlot } from "@/lib/bookings.functions";
import { cn } from "@/lib/utils";
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
    <div className="min-h-dvh">
      <SiteHeader user={user} isAdmin={isAdmin} onSignOut={signOut} />
      <main className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        {user === undefined ? (
          <div className="flex items-center justify-center py-40">
            <Loader2 className="size-6 animate-spin" />
          </div>
        ) : !user ? (
          <Landing />
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
    <header className="sticky top-0 z-30 border-b border-white/5 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="btn-neon flex size-9 items-center justify-center rounded-lg">
            <Dumbbell className="size-5" aria-hidden="true" />
          </div>
          <span className="font-display text-xl tracking-widest">RM.TRAINING</span>
        </Link>
        <nav className="flex items-center gap-1.5 sm:gap-2">
          {!user ? (
            <>
              <a
                href="#how-it-works"
                className="hidden rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground sm:inline-block"
              >
                How it works
              </a>
              <Link to="/auth" className="rounded-md px-3 py-2 text-sm hover:bg-white/5">
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
                  <UserCog className="size-3.5" aria-hidden="true" /> Admin
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
                <LogOut className="size-3.5" aria-hidden="true" /> Sign out
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

/* ---------------- Landing (logged-out) ---------------- */

const HOME_GUIDE: GuideStep[] = [
  {
    target: "home-join",
    title: "Start right here",
    body: "Create your account first — name, email, phone and three body numbers. It takes about a minute.",
  },
  {
    target: "home-journey",
    title: "Then follow these five steps",
    body: "Tap any step to see exactly what happens: sign-up, email confirmation, approval, booking.",
  },
  {
    target: "home-booking-demo",
    title: "Try booking before you sign up",
    body: "Tap a free slot to preview the confirmation and what you'd do next. Nothing is reserved.",
  },
  {
    target: "home-dashboard-preview",
    title: "What's waiting once you're in",
    body: "Four tabs: status and BMI on Home, 14 days of slots on Book, your bookings on Sessions, injuries on Health.",
  },
];

function Landing() {
  const [guideOpen, setGuideOpen] = useState(false);

  useEffect(() => {
    let seen = true;
    try {
      seen = !!window.localStorage.getItem("rm.guide.home.v1");
    } catch {
      // Storage blocked — skip the automatic start rather than nag.
    }
    if (seen) return;
    const timer = window.setTimeout(() => setGuideOpen(true), 1400);
    return () => window.clearTimeout(timer);
  }, []);

  const startGuide = () => setGuideOpen(true);

  return (
    <>
      <div className="space-y-24 sm:space-y-32">
        <Hero onStartTour={startGuide} />
        <Marquee />
        <section id="how-it-works" className="scroll-mt-24 rounded-xl">
          <Journey />
        </section>
        <BookingPreview />
        <DashboardPreview onStartTour={startGuide} />
        <Faq />
        <FinalCta />
      </div>
      <SpotlightTour
        steps={HOME_GUIDE}
        open={guideOpen}
        onOpenChange={setGuideOpen}
        storageKey="rm.guide.home.v1"
      />
    </>
  );
}

function Hero({ onStartTour }: { onStartTour: () => void }) {
  return (
    <section className="relative grid gap-12 pt-10 sm:pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
      <div>
        <div className="rm-fade-up glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          <Zap className="size-3" aria-hidden="true" /> Elite personal training
        </div>

        <h1
          className="rm-fade-up mt-6 font-display text-[clamp(3rem,9vw,5.75rem)] leading-[0.88] tracking-tight text-balance"
          style={{ animationDelay: "90ms" }}
        >
          Train <span className="text-gradient-neon">harder.</span>
          <br />
          Look <span className="text-gradient-neon">sharper.</span>
        </h1>

        <p
          className="rm-fade-up mt-6 max-w-xl text-pretty text-lg text-muted-foreground"
          style={{ animationDelay: "160ms" }}
        >
          Private one-hour coaching with RM. Two morning spots, four in the evening — reserved,
          never oversold. Create an account, confirm your email, and you'll be booked in before
          your first session.
        </p>

        <div
          className="rm-fade-up mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
          style={{ animationDelay: "230ms" }}
        >
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            data-tour="home-join"
            className="btn-neon hover:btn-neon-hover inline-flex items-center justify-center gap-2 rounded-md px-6 py-3 text-sm"
          >
            Create your account
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <button
            type="button"
            onClick={onStartTour}
            className="glass inline-flex items-center justify-center gap-2 rounded-md px-6 py-3 text-sm hover:bg-white/[0.08]"
          >
            <PlayCircle className="size-4" aria-hidden="true" />
            Show me around
          </button>
          <Link
            to="/auth"
            className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground sm:px-2"
          >
            I already train with RM
          </Link>
        </div>

        <dl
          className="rm-fade-up mt-10 grid max-w-lg grid-cols-3 gap-3"
          style={{ animationDelay: "300ms" }}
        >
          {[
            { label: "Session", value: 60, suffix: "min" },
            { label: "Morning spots", value: 2, suffix: "clients" },
            { label: "Evening spots", value: 4, suffix: "clients" },
          ].map((stat) => (
            <div key={stat.label} className="glass px-4 py-3">
              <dd className="rm-tabular font-display text-2xl tracking-wide">
                <AnimatedNumber value={stat.value} />
              </dd>
              <dt className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {stat.label}
              </dt>
              <p className="text-[10px] text-muted-foreground/80">{stat.suffix}</p>
            </div>
          ))}
        </dl>
      </div>

      <div className="rm-fade-up relative" style={{ animationDelay: "180ms" }}>
        <div className="group relative overflow-hidden rounded-2xl glow-ring">
          <img
            src={heroImg}
            alt="Athlete lifting in a black-and-white gym"
            width={1536}
            height={1024}
            className="aspect-4/3 w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          <div className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-3 rounded-xl bg-black/45 px-4 py-3 backdrop-blur-md">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-white/60">Next open slot</p>
              <p className="rm-tabular font-display text-lg tracking-wide">
                Tomorrow · 06:30 <span className="text-white/50">/ 2</span>
              </p>
            </div>
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="btn-neon hover:btn-neon-hover rounded-lg px-3 py-2 text-[11px]"
            >
              Claim it
            </Link>
          </div>
        </div>

        <div className="rm-float glass-strong absolute -left-4 -top-5 hidden items-center gap-3 rounded-xl p-3 sm:flex">
          <div className="relative flex size-9 items-center justify-center rounded-lg bg-white text-black">
            <CalendarClock className="size-4" aria-hidden="true" />
            <span className="rm-ring absolute inset-0 rounded-lg border border-white/60" aria-hidden="true" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Booking window
            </p>
            <p className="font-display text-base tracking-wide">14 days ahead</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Marquee() {
  const { ref, inView } = useInView<HTMLDivElement>();
  const items = [
    "1-hour sessions",
    "Morning cap 2",
    "Evening cap 4",
    "14-day booking window",
    "Trainer-approved access",
    "Health-first coaching",
  ];

  return (
    <div
      ref={ref}
      className="relative overflow-hidden border-y border-border/40 py-4"
      aria-hidden="true"
    >
      <div
        className="rm-marquee flex w-max gap-10 hover:[animation-play-state:paused]"
        style={{ animationPlayState: inView ? "running" : "paused" }}
      >
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 items-center gap-10">
            {items.map((item) => (
              <span
                key={item}
                className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-muted-foreground"
              >
                <span className="size-1 rounded-full bg-white/40" />
                {item}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Onboarding journey ---------------- */

const JOURNEY = [
  {
    id: "account",
    icon: UserPlus,
    label: "Create account",
    meta: "About 60 seconds",
    title: "Start with four details and three numbers",
    body: "Sign-up asks for your name, email, password, phone, plus age, height and weight. The numbers aren't paperwork — they seed your dashboard tiles and BMI card so RM knows your starting point.",
    points: [
      "Password needs at least 6 characters",
      "Phone in international format, e.g. +14155550100",
      "A profile photo is optional and can be added later",
    ],
    tip: "Use an email you actually check — the next step depends on it.",
    cta: { label: "Create your account", to: "/auth" as const },
  },
  {
    id: "verify",
    icon: Mail,
    label: "Verify email",
    meta: "One click",
    title: "Confirm your email before you can sign in",
    body: "Every account is email-verified. The moment you sign up, Supabase sends you a confirmation link. Click it and you're returned to the app. Until then, sign-in will be refused — that's the check working, not a bug.",
    points: [
      "Nothing in your inbox after a minute? Check spam and promotions",
      "Still nothing? Request the email again from the sign-up screen",
      "Wrong address? Sign up again with the right one",
    ],
    tip: "The link is single-use and tied to that email address.",
    cta: { label: "Open sign up", to: "/auth" as const },
  },
  {
    id: "signin",
    icon: KeyRound,
    label: "Sign in",
    meta: "Email + password",
    title: "Sign in and land on your dashboard",
    body: "Once confirmed, sign in with the same email and password. Your session is remembered, so you won't be asked every visit. Sign out from the header whenever you're on a shared device.",
    points: [
      "Admins land on the trainer console instead",
      "Your status badge is the first thing on the dashboard",
      "Nothing is bookable until that badge says Active",
    ],
    tip: "Forgot the password? Ask RM to reset it from the trainer console.",
    cta: { label: "Go to sign in", to: "/auth" as const },
  },
  {
    id: "approval",
    icon: BadgeCheck,
    label: "Get approved",
    meta: "Manual review",
    title: "RM reviews your profile personally",
    body: "New accounts start as Pending approval. RM reads your details, then activates you from the trainer console — no auto-approval, no bots. You'll get a WhatsApp message when you're in.",
    points: [
      "Pending: you can look around, but booking stays locked",
      "Active: booking and the health form unlock",
      "Denied: RM will contact you directly",
    ],
    tip: "Keep your phone number correct — that's how approval reaches you.",
    cta: { label: "Read the FAQ", to: "/" as const, hash: "#faq" },
  },
  {
    id: "book",
    icon: CalendarPlus,
    label: "Book a slot",
    meta: "Then it's done",
    title: "Pick a slot and you're booked",
    body: "The Book tab shows 14 days. Morning runs 06:30 to 09:30 with 2 clients per hour; evening runs 15:30 to 21:30 with 4. Tap any open slot and it's yours instantly — the counter updates and full slots lock themselves.",
    points: [
      "Tap your booked slot again to cancel it",
      "Full slots show a lock and can't be selected",
      "Bring water, arrive 10 minutes early",
    ],
    tip: "Book the evening before — morning slots go first.",
    cta: { label: "Sign in to book", to: "/auth" as const },
  },
];

function Journey() {
  const [step, setStep] = useState(JOURNEY[0].id);
  const index = Math.max(
    0,
    JOURNEY.findIndex((s) => s.id === step),
  );
  const progress = (index + 1) / JOURNEY.length;

  return (
    <div>
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              How it works
            </p>
            <h2 className="mt-3 font-display text-4xl tracking-tight text-balance sm:text-5xl">
              Five steps from stranger to first session
            </h2>
            <p className="mt-3 max-w-xl text-pretty text-muted-foreground">
              Nothing hidden, nothing to guess. This is the exact path every new client walks —
              tap a step to see what happens and what to have ready.
            </p>
          </div>
          <div className="glass px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Step</p>
            <p className="rm-tabular font-display text-2xl tracking-wide">
              {index + 1} <span className="text-muted-foreground">/ {JOURNEY.length}</span>
            </p>
          </div>
        </div>
      </Reveal>

      <Reveal delay={80} className="mt-6">
        <div className="h-1 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full origin-left rounded-full bg-white transition-transform duration-300 ease-out"
            style={{ transform: `scaleX(${progress})` }}
          />
        </div>
      </Reveal>

      <Reveal delay={120} className="mt-6">
        <Tabs
          value={step}
          onValueChange={setStep}
          orientation="vertical"
          data-tour="home-journey"
          className="glass-strong grid gap-6 p-4 sm:p-6 lg:grid-cols-[minmax(0,280px)_1fr]"
        >
          <TabsList className="flex h-auto w-full flex-col items-stretch justify-start gap-1 bg-transparent p-0">
            {JOURNEY.map((s, i) => {
              const Icon = s.icon;
              const done = i < index;
              const active = s.id === step;
              return (
                <TabsTrigger
                  key={s.id}
                  value={s.id}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm transition-colors duration-200",
                    "data-[state=active]:bg-white data-[state=active]:text-black",
                    "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-white/5",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold",
                      active
                        ? "border-black/20 bg-black/10 text-black"
                        : done
                          ? "border-white/30 bg-white/15 text-foreground"
                          : "border-white/15 text-muted-foreground",
                    )}
                    aria-hidden="true"
                  >
                    {done ? <CheckCircle2 className="size-3.5" /> : i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{s.label}</span>
                    <span
                      className={cn(
                        "block text-[10px] uppercase tracking-[0.15em]",
                        active ? "text-black/60" : "text-muted-foreground/70",
                      )}
                    >
                      {s.meta}
                    </span>
                  </span>
                  <Icon className="size-4 shrink-0 opacity-60" aria-hidden="true" />
                </TabsTrigger>
              );
            })}
          </TabsList>

          {JOURNEY.map((s) => {
            const Icon = s.icon;
            return (
              <TabsContent key={s.id} value={s.id} className="mt-0 focus-visible:outline-none">
                <div className="rm-pop">
                  <div className="btn-neon flex size-11 items-center justify-center rounded-xl">
                    <Icon className="size-5" aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 font-display text-2xl tracking-wide text-balance">
                    {s.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-pretty text-muted-foreground">
                    {s.body}
                  </p>
                  <ul className="mt-5 space-y-2">
                    {s.points.map((p) => (
                      <li key={p} className="flex items-start gap-2 text-sm">
                        <CheckCircle2
                          className="mt-0.5 size-4 shrink-0 text-foreground/70"
                          aria-hidden="true"
                        />
                        <span className="text-pretty">{p}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-pretty text-foreground/80">
                    <span className="font-semibold">Tip · </span>
                    {s.tip}
                  </p>
                  <Link
                    to={s.cta.to}
                    className="mt-5 inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.06em] text-black transition-transform duration-200 hover:-translate-y-px"
                  >
                    {s.cta.label}
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </Reveal>
    </div>
  );
}

/* ---------------- Interactive booking preview ---------------- */

const DEMO_SLOTS = {
  morning: [
    { start: "06:30", count: 1, cap: 2 },
    { start: "07:30", count: 2, cap: 2 },
    { start: "08:30", count: 0, cap: 2 },
    { start: "09:30", count: 0, cap: 2 },
  ],
  evening: [
    { start: "15:30", count: 0, cap: 4 },
    { start: "16:30", count: 2, cap: 4 },
    { start: "17:30", count: 4, cap: 4 },
    { start: "18:30", count: 1, cap: 4 },
  ],
} as const;

type DemoSlot = { start: string; count: number; cap: number; period: "morning" | "evening" };

function BookingPreview() {
  const [booked, setBooked] = useState<DemoSlot | null>(null);

  return (
    <section>
      <Reveal>
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          Booking, demystified
        </p>
        <h2 className="mt-3 font-display text-4xl tracking-tight text-balance sm:text-5xl">
          See exactly what booking feels like
        </h2>
        <p className="mt-3 max-w-xl text-pretty text-muted-foreground">
          A real slot grid with real capacities. Tap a free slot below and watch what a confirmed
          booking looks like — including what to do next. Nothing is reserved here.
        </p>
      </Reveal>

      <Reveal delay={100} className="mt-6">
        <div className="glass-strong p-4 sm:p-6" data-tour="home-booking-demo">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              <MousePointerClick className="size-3.5" aria-hidden="true" />
              Interactive preview — no real booking
            </p>
            {booked && (
              <button
                type="button"
                onClick={() => setBooked(null)}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
              >
                <RefreshCw className="size-3.5" aria-hidden="true" />
                Reset
              </button>
            )}
          </div>

          <div className="mt-5 grid gap-6 lg:grid-cols-2">
            {(["morning", "evening"] as const).map((period) => (
              <div key={period}>
                <div className="mb-3 flex items-baseline justify-between">
                  <h3 className="font-display text-sm tracking-[0.25em] text-muted-foreground">
                    {period === "morning" ? "Morning · 06:30 → 09:30" : "Evening · 15:30 → 18:30"}
                  </h3>
                  <span className="text-[10px] text-muted-foreground">
                    Cap {period === "morning" ? 2 : 4}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {DEMO_SLOTS[period].map((slot) => {
                    const full = slot.count >= slot.cap;
                    const mine = booked?.period === period && booked.start === slot.start;
                    return (
                      <button
                        key={slot.start}
                        type="button"
                        disabled={full && !mine}
                        aria-label={`${period} ${slot.start}, ${slot.count} of ${slot.cap} booked${full ? ", full" : ""}`}
                        onClick={() =>
                          setBooked(mine ? null : { ...slot, period })
                        }
                        className={cn(
                          "glass flex flex-col items-start gap-1 p-4 text-left transition-[transform,background-color] duration-200",
                          !full && !mine && "hover:-translate-y-0.5 hover:bg-white/[0.08]",
                          full && !mine && "opacity-45",
                          mine && "border-white/60 shadow-[0_0_30px_-6px_rgba(255,255,255,0.55)]",
                        )}
                      >
                        <div className="flex w-full items-center justify-between">
                          <span className="rm-tabular font-display text-xl tracking-wide">
                            {slot.start}
                          </span>
                          {mine ? (
                            <CheckCircle2 className="size-4" aria-hidden="true" />
                          ) : full ? (
                            <Lock className="size-4 text-muted-foreground" aria-hidden="true" />
                          ) : (
                            <Clock className="size-4 text-muted-foreground" aria-hidden="true" />
                          )}
                        </div>
                        <div className="rm-tabular flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="size-3" aria-hidden="true" /> {slot.count}/{slot.cap}
                        </div>
                        <div className="text-[10px] uppercase tracking-widest">
                          {mine ? "Booked · tap to cancel" : full ? "Full" : "Available"}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div aria-live="polite" className="mt-6">
            {booked ? (
              <div className="rm-pop rounded-xl border border-white/25 bg-white/[0.06] p-5">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-foreground/80">
                  <PartyPopper className="size-4" aria-hidden="true" />
                  Booked · {booked.period} session
                </div>
                <p className="rm-tabular mt-2 font-display text-3xl tracking-wide">
                  Tomorrow · {booked.start}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {booked.count + 1} of {booked.cap} spots now taken — the counter updates for
                  everyone instantly.
                </p>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {[
                    "Arrive 10 minutes early to warm up",
                    "Bring water, a towel and trainers",
                    "Tap the booked slot again to cancel",
                    "Cancel the day before if plans change",
                  ].map((step) => (
                    <li key={step} className="flex items-start gap-2 text-sm">
                      <CheckCircle2
                        className="mt-0.5 size-4 shrink-0 text-foreground/70"
                        aria-hidden="true"
                      />
                      <span className="text-pretty">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Tap any <span className="text-foreground">Available</span> slot to see the
                confirmation. Locked slots are at capacity.
              </p>
            )}
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ---------------- Dashboard tour preview ---------------- */

const DASHBOARD_CARDS = [
  { icon: ListChecks, label: "Home", text: "Status badge, body metrics and BMI in one glance." },
  { icon: CalendarPlus, label: "Book", text: "14-day strip — pick a slot, tap again to cancel." },
  { icon: Clock, label: "Sessions", text: "Everything upcoming and everything you've trained." },
  { icon: HeartPulse, label: "Health", text: "Injuries, allergies, notes — kept current for safety." },
];

function DashboardPreview({ onStartTour }: { onStartTour: () => void }) {
  return (
    <section data-tour="home-dashboard-preview" className="rounded-xl">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Your dashboard
            </p>
            <h2 className="mt-3 font-display text-4xl tracking-tight text-balance sm:text-5xl">
              Four tabs. No hunting.
            </h2>
            <p className="mt-3 max-w-xl text-pretty text-muted-foreground">
              Sign in and the dashboard tour walks you through each one, step by step. You can
              replay it whenever you like.
            </p>
          </div>
          <button
            type="button"
            onClick={onStartTour}
            className="glass inline-flex items-center gap-2 rounded-md px-5 py-3 text-sm hover:bg-white/[0.08]"
          >
            <PlayCircle className="size-4" aria-hidden="true" />
            Walk me through it
          </button>
        </div>
      </Reveal>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {DASHBOARD_CARDS.map((card, i) => {
          const Icon = card.icon;
          return (
            <Reveal key={card.label} delay={i * 70}>
              <div className="glass h-full p-5 transition-transform duration-200 hover:-translate-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Icon className="size-4" aria-hidden="true" />
                  <span className="text-[10px] uppercase tracking-[0.2em]">{card.label}</span>
                </div>
                <p className="mt-3 text-sm text-pretty">{card.text}</p>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

/* ---------------- FAQ ---------------- */

const FAQ = [
  {
    q: "I signed up but never got the verification email.",
    a: "Check spam and the promotions tab first, and give it a minute. If it still hasn't arrived, request it again from the sign-up screen. Verification is required — sign-in is refused until your email is confirmed.",
  },
  {
    q: "Can I book before my account is approved?",
    a: "No, and that's deliberate. You can explore the app while your status is Pending approval, but slot booking unlocks only once RM activates you. Approval is manual and usually happens the same day.",
  },
  {
    q: "How many people are in a session?",
    a: "Sessions are one hour. Mornings (06:30 to 09:30) cap at two clients per slot; evenings (15:30 to 21:30) cap at four. When a slot is full it locks automatically and shows a padlock.",
  },
  {
    q: "How do I cancel or change a booking?",
    a: "Open Book, find the slot you hold and tap it again — that cancels it and frees the space. There's no cancellation fee, but cancel as early as you can so someone else can take it.",
  },
  {
    q: "Why does my dashboard say Pending?",
    a: "Because RM hasn't reviewed your profile yet. The badge changes to Active the moment you're approved, and you'll get a WhatsApp message with the news.",
  },
  {
    q: "Where do I log injuries or allergies?",
    a: "Under Health on your dashboard. Keep it current — every session is programmed around those notes, so an out-of-date profile means the wrong kind of pressure.",
  },
];

function Faq() {
  return (
    <section id="faq" className="scroll-mt-24">
      <Reveal>
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          Before you ask
        </p>
        <h2 className="mt-3 font-display text-4xl tracking-tight text-balance sm:text-5xl">
          The questions everyone sends
        </h2>
      </Reveal>

      <Reveal delay={80} className="mt-6">
        <Accordion type="single" collapsible className="glass-strong divide-y divide-border/50 px-5">
          {FAQ.map((item, i) => (
            <AccordionItem key={item.q} value={`faq-${i}`} className="border-b-0">
              <AccordionTrigger className="py-4 text-left text-sm font-medium hover:no-underline">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="pb-4 text-sm leading-relaxed text-pretty text-muted-foreground">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Reveal>
    </section>
  );
}

function FinalCta() {
  return (
    <Reveal>
      <section className="relative overflow-hidden rounded-2xl border border-white/15 px-6 py-14 text-center sm:px-12">
        <div className="rm-grid absolute inset-0" aria-hidden="true" />
        <div className="relative">
          <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            <Sparkles className="size-3" aria-hidden="true" /> Two morning · four evening
          </span>
          <h2 className="mx-auto mt-5 max-w-2xl font-display text-4xl leading-[0.95] tracking-tight text-balance sm:text-6xl">
            Your first session is one sign-up away
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-pretty text-muted-foreground">
            Create the account, confirm your email, get approved, pick a slot. Most clients are
            training within 48 hours.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="btn-neon hover:btn-neon-hover inline-flex items-center gap-2 rounded-md px-7 py-3 text-sm"
            >
              Create your account
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link
              to="/auth"
              className="glass inline-flex items-center gap-2 rounded-md px-7 py-3 text-sm hover:bg-white/[0.08]"
            >
              <ShieldCheck className="size-4" aria-hidden="true" />
              Sign in
            </Link>
          </div>
        </div>
      </section>
    </Reveal>
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
    <div className="space-y-8 pt-6">
      <div className="glass-strong overflow-hidden p-6 sm:p-8">
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          Welcome back
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-wide text-balance sm:text-5xl">
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
            <UserCog className="size-5" aria-hidden="true" />
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
      <CheckCircle2 className="size-3.5" aria-hidden="true" /> {s.text}
    </span>
  );
}

function PendingCard() {
  return (
    <div className="glass border-l-2 border-white/60 p-5 text-sm">
      <p className="font-display text-xl tracking-wide">Awaiting trainer approval</p>
      <p className="mt-2 text-pretty text-muted-foreground">
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

  const bookSlotFn = useBookSlot();
  async function book(slot: SlotInfo) {
    setPending(slot.start);
    try {
      await bookSlotFn({ data: { date: fmtDateKey(selected), start: slot.start } });
      toast.success("Booked!");
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
        <CalendarClock className="size-6 opacity-60" aria-hidden="true" />
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
                className={`rm-tabular min-w-16 rounded-2xl px-3 py-3 text-center transition ${
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
          <Loader2 className="size-5 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {slots.map((s) => {
            const full = s.count >= s.cap && !s.mine;
            const busy = pending === s.start;
            const stateCls = s.mine ? "glow-ring" : full ? "opacity-50" : "";
            return (
              <button
                key={s.start}
                disabled={busy || (!s.mine && full)}
                onClick={() => (s.mine ? onCancel(s) : onBook(s))}
                className={`glass flex flex-col items-start gap-1 p-4 text-left transition hover:bg-white/[0.08] ${stateCls}`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="rm-tabular font-display text-xl tracking-wide">{s.start}</span>
                  {s.mine ? (
                    <CheckCircle2 className="size-4" aria-hidden="true" />
                  ) : full ? (
                    <Lock className="size-4 text-muted-foreground" aria-hidden="true" />
                  ) : (
                    <Clock className="size-4 text-muted-foreground" aria-hidden="true" />
                  )}
                </div>
                <div className="rm-tabular flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="size-3" aria-hidden="true" /> {s.count}/{s.cap}
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
        <HeartPulse className="size-6 opacity-60" aria-hidden="true" />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Keep this current so every session is safe and pushes the right way.
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="size-5 animate-spin" />
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          <Field
            icon={<HeartPulse className="size-4" aria-hidden="true" />}
            title="Current injuries"
            hint="Aches, past surgeries, mobility limits."
            value={form.injuries}
            onChange={(v) => setForm({ ...form, injuries: v })}
          />
          <Field
            icon={<ShieldPlus className="size-4" aria-hidden="true" />}
            title="Allergies"
            hint="Foods, medications, environmental triggers."
            value={form.allergies}
            onChange={(v) => setForm({ ...form, allergies: v })}
          />
          <Field
            icon={<HeartPulse className="size-4" aria-hidden="true" />}
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
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" aria-hidden="true" />}
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
      <div className="rm-tabular mt-1 text-right text-[10px] text-muted-foreground">
        {value.length}/1000
      </div>
    </div>
  );
}
