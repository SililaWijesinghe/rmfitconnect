import { createFileRoute, Link } from "@tanstack/react-router";
import { Dumbbell, ShieldCheck, Zap, CalendarClock } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "RM Personal Training — Train Smarter, Push Harder" },
      {
        name: "description",
        content:
          "Book 1-hour personal training sessions with RM. Modern booking, health tracking, and premium coaching in a futuristic client hub.",
      },
    ],
  }),
});

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="btn-neon flex h-9 w-9 items-center justify-center rounded-lg">
            <Dumbbell className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight">
            RM<span className="text-gradient-neon">.</span>Training
          </span>
        </div>
        <nav className="flex gap-2">
          <Link
            to="/auth"
            className="rounded-md px-4 py-2 text-sm font-medium hover:bg-white/5"
          >
            Sign in
          </Link>
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="btn-neon rounded-md px-4 py-2 text-sm"
          >
            Get started
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24 pt-10 sm:pt-20">
        <section className="text-center">
          <div className="glass mx-auto mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs uppercase tracking-widest text-muted-foreground">
            <Zap className="h-3 w-3 text-[color:var(--neon-cyan)]" /> Personal training, upgraded
          </div>
          <h1 className="font-display text-5xl font-extrabold leading-[1.05] sm:text-7xl">
            Train with <span className="text-gradient-neon">RM</span>.
            <br />
            Own your <span className="text-gradient-neon">energy</span>.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            Book 1-hour sessions, log your health profile, and stay ahead of every rep — all
            from one high-energy client hub.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="btn-neon w-full rounded-md px-6 py-3 text-base sm:w-auto"
            >
              Create your account
            </Link>
            <Link
              to="/auth"
              className="glass w-full rounded-md px-6 py-3 text-base sm:w-auto"
            >
              I already have an account
            </Link>
          </div>
        </section>

        <section className="mt-24 grid gap-6 sm:grid-cols-3">
          {[
            {
              icon: ShieldCheck,
              title: "Trainer-approved access",
              body: "Every account is personally reviewed and activated by RM. No spam, no randoms.",
            },
            {
              icon: CalendarClock,
              title: "Strict capacity slots",
              body: "1-hour sessions, 2 clients in the morning, 4 in the evening. Full slots lock automatically.",
            },
            {
              icon: Zap,
              title: "Health-first profile",
              body: "Keep injuries and allergies up to date so every session pushes safely, not blindly.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="glass p-6">
              <div className="btn-neon inline-flex h-10 w-10 items-center justify-center rounded-lg">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-border/40 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} RM Personal Training
      </footer>
    </div>
  );
}
