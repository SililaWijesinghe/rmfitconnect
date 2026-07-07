import { createFileRoute, Outlet, redirect, Link, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, HeartPulse, CalendarPlus, ListChecks, LogOut, Dumbbell, ShieldAlert, Users, CalendarClock } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

const CLIENT_ONLY_PREFIXES = ["/dashboard", "/book", "/my-bookings", "/health"];

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .eq("role", "admin")
      .maybeSingle();
    const isAdmin = !!roleRow;
    if (isAdmin && CLIENT_ONLY_PREFIXES.some((p) => location.pathname === p || location.pathname.startsWith(p + "/"))) {
      throw redirect({ to: "/admin" });
    }
    return { user: data.user, isAdmin };
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  const navigate = useNavigate();
  const { isAdmin } = Route.useRouteContext();

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  const clientNav = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Home" },
    { to: "/book", icon: CalendarPlus, label: "Book" },
    { to: "/my-bookings", icon: ListChecks, label: "Sessions" },
    { to: "/health", icon: HeartPulse, label: "Health" },
  ] as const;

  const adminNav = [
    { to: "/admin", icon: ShieldAlert, label: "Approvals", exact: true },
    { to: "/admin/schedule", icon: CalendarClock, label: "Schedule", exact: true },
    { to: "/admin/clients", icon: Users, label: "Clients", exact: true },
  ] as const;

  const navItems = isAdmin ? adminNav : clientNav;
  const homeHref = isAdmin ? "/admin" : "/dashboard";

  return (
    <div className="min-h-screen pb-24">
      <header className="mx-auto flex max-w-4xl items-center justify-between px-4 py-5">
        <Link to={homeHref} className="flex items-center gap-2">
          <div className="btn-neon flex h-9 w-9 items-center justify-center rounded-lg">
            <Dumbbell className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-bold">
            RM<span className="text-gradient-neon">.</span>Training
            {isAdmin && (
              <span className="ml-2 rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-[color:var(--neon-cyan)]">
                Admin
              </span>
            )}
          </span>
        </Link>
        <button
          onClick={signOut}
          className="glass inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs"
        >
          <LogOut className="h-3.5 w-3.5" /> Sign out
        </button>
      </header>

      <main className="mx-auto max-w-4xl px-4">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-4 mx-auto max-w-md px-4">
        <div className="glass-strong flex items-center justify-around rounded-full p-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={"exact" in item && item.exact ? { exact: true } : undefined}
                className="flex flex-1 flex-col items-center gap-0.5 rounded-full px-3 py-2 text-[10px] font-medium text-muted-foreground transition-colors [&.active]:bg-white/10 [&.active]:text-[color:var(--neon-cyan)]"
                activeProps={{ className: "active" }}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
