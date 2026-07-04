import { createFileRoute, Outlet, redirect, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LayoutDashboard, HeartPulse, CalendarPlus, ListChecks, LogOut, Dumbbell, ShieldAlert } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const { user } = Route.useRouteContext();

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      setIsAdmin(!!data);
    })();
  }, [user.id]);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  const navItems = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Home" },
    { to: "/book", icon: CalendarPlus, label: "Book" },
    { to: "/my-bookings", icon: ListChecks, label: "Sessions" },
    { to: "/health", icon: HeartPulse, label: "Health" },
  ] as const;

  return (
    <div className="min-h-screen pb-24">
      <header className="mx-auto flex max-w-4xl items-center justify-between px-4 py-5">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="btn-neon flex h-9 w-9 items-center justify-center rounded-lg">
            <Dumbbell className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-bold">
            RM<span className="text-gradient-neon">.</span>Training
          </span>
        </Link>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link
              to="/admin"
              className="glass inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs"
            >
              <ShieldAlert className="h-3.5 w-3.5" /> Admin
            </Link>
          )}
          <button
            onClick={signOut}
            className="glass inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-4 mx-auto max-w-md px-4">
        <div className="glass-strong flex items-center justify-around rounded-full p-1.5">
          {navItems.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              className="flex flex-1 flex-col items-center gap-0.5 rounded-full px-3 py-2 text-[10px] font-medium text-muted-foreground transition-colors [&.active]:bg-white/10 [&.active]:text-[color:var(--neon-cyan)]"
              activeProps={{ className: "active" }}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
