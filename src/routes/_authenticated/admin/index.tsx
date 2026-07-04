import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { approveUser } from "@/lib/notifications.functions";

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

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminApprovals,
});

function AdminApprovals() {
  const [rows, setRows] = useState<Pending[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("id,full_name,phone,age,height_cm,weight_kg,avatar_url,status,created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    setRows((data as Pending[] | null) ?? []);
    setLoading(false);
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
    const { error } = await supabase
      .from("profiles")
      .update({ status: "denied" })
      .eq("id", p.id);
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success("Denied");
    load();
  }

  if (loading)
    return (
      <div className="glass flex items-center justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );

  if (rows.length === 0)
    return (
      <div className="glass p-6 text-center text-sm text-muted-foreground">
        No pending accounts. 🔥
      </div>
    );

  return (
    <div className="space-y-3">
      {rows.map((p) => (
        <div key={p.id} className="glass-strong p-4">
          <div className="flex items-start gap-3">
            <div className="btn-neon flex h-12 w-12 items-center justify-center rounded-full font-display font-bold">
              {p.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="font-display text-lg font-semibold">{p.full_name}</p>
              <p className="text-xs text-muted-foreground">
                {p.phone ?? "no phone"} · age {p.age ?? "–"} · {p.height_cm ?? "–"}cm ·{" "}
                {p.weight_kg ?? "–"}kg
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                Signed up {new Date(p.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              disabled={busy === p.id}
              onClick={() => approve(p)}
              className="btn-neon hover:btn-neon-hover flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm"
            >
              {busy === p.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Approve & notify
            </button>
            <button
              disabled={busy === p.id}
              onClick={() => deny(p)}
              className="glass flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm text-destructive"
            >
              <XCircle className="h-4 w-4" /> Deny
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
