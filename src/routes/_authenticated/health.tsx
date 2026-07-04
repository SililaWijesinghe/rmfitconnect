import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { HeartPulse, ShieldPlus, Loader2, Save } from "lucide-react";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/health")({
  component: HealthPage,
});

const schema = z.object({
  injuries: z.string().trim().max(1000),
  allergies: z.string().trim().max(1000),
  notes: z.string().trim().max(1000),
});

function HealthPage() {
  const { user } = Route.useRouteContext();
  const [form, setForm] = useState({ injuries: "", allergies: "", notes: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("health_profiles")
        .select("injuries,allergies,notes")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) setForm({
        injuries: data.injuries ?? "",
        allergies: data.allergies ?? "",
        notes: data.notes ?? "",
      });
      setLoading(false);
    })();
  }, [user.id]);

  async function save() {
    setSaving(true);
    try {
      const parsed = schema.parse(form);
      const { error } = await supabase
        .from("health_profiles")
        .upsert({ user_id: user.id, ...parsed, updated_at: new Date().toISOString() });
      if (error) throw error;
      toast.success("Health profile saved");
    } catch (err) {
      const msg = err instanceof z.ZodError ? err.issues[0]?.message : (err as Error).message;
      toast.error(msg ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Center><Loader2 className="h-6 w-6 animate-spin" /></Center>;

  return (
    <div className="space-y-5 pt-4">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Your body</p>
        <h1 className="mt-1 font-display text-3xl font-bold">Health profile</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Keep these up to date so every session is safe and pushes you the right way.
        </p>
      </div>

      <GlassField
        icon={<HeartPulse className="h-5 w-5 text-[color:var(--neon-magenta)]" />}
        title="Current injuries"
        hint="Aches, past surgeries, mobility limits."
        value={form.injuries}
        onChange={(v) => setForm({ ...form, injuries: v })}
      />
      <GlassField
        icon={<ShieldPlus className="h-5 w-5 text-[color:var(--neon-cyan)]" />}
        title="Allergies"
        hint="Foods, medications, environmental triggers."
        value={form.allergies}
        onChange={(v) => setForm({ ...form, allergies: v })}
      />
      <GlassField
        icon={<HeartPulse className="h-5 w-5 text-[color:var(--neon-cyan)]" />}
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
  );
}

function GlassField({
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
    <div className="glass-strong p-5">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="font-display text-lg font-semibold">{title}</h3>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        maxLength={1000}
        className="mt-3 w-full resize-none rounded-md border border-white/10 bg-black/30 p-3 text-sm outline-none focus:border-[color:var(--neon-cyan)] focus:ring-2 focus:ring-[color:var(--neon-cyan)]/30"
        placeholder="Type here…"
      />
      <div className="mt-1 text-right text-[10px] text-muted-foreground">
        {value.length}/1000
      </div>
    </div>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-center py-24">{children}</div>;
}
