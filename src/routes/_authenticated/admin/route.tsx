import { createFileRoute, Outlet, redirect, Link } from "@tanstack/react-router";
import { ShieldAlert, Users, CalendarClock, UserCog } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async ({ context }) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!data) throw redirect({ to: "/dashboard" });
  },
  component: AdminLayout,
});

function AdminLayout() {
  const tabs = [
    { to: "/admin", icon: ShieldAlert, label: "Approvals" },
    { to: "/admin/schedule", icon: CalendarClock, label: "Schedule" },
    { to: "/admin/clients", icon: Users, label: "Clients" },
  ] as const;
  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-center gap-2">
        <UserCog className="h-5 w-5 text-[color:var(--neon-magenta)]" />
        <h1 className="font-display text-2xl font-bold">Trainer console</h1>
      </div>
      <div className="glass-strong flex gap-1 rounded-full p-1 text-xs">
        {tabs.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            activeOptions={{ exact: true }}
            className="flex flex-1 items-center justify-center gap-1 rounded-full px-3 py-2 text-muted-foreground [&.active]:bg-white/10 [&.active]:text-[color:var(--neon-cyan)]"
            activeProps={{ className: "active" }}
          >
            <t.icon className="h-3.5 w-3.5" /> {t.label}
          </Link>
        ))}
      </div>
      <Outlet />
    </div>
  );
}
