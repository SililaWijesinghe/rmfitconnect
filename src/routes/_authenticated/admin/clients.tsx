import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Client = {
  id: string;
  full_name: string;
  phone: string | null;
  status: "pending" | "active" | "denied";
  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
};
type Health = { injuries: string; allergies: string; notes: string } | null;

export const Route = createFileRoute("/_authenticated/admin/clients")({
  component: AdminClients,
});

function AdminClients() {
  const [rows, setRows] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [health, setHealth] = useState<Health>(null);
  const [bookings, setBookings] = useState<Array<{ slot_date: string; slot_start: string }>>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("profiles")
        .select("id,full_name,phone,status,age,height_cm,weight_kg")
        .order("created_at", { ascending: false });
      setRows((data as Client[] | null) ?? []);
      setLoading(false);
    })();
  }, []);

  async function open(id: string) {
    setOpenId(id);
    const [{ data: h }, { data: b }] = await Promise.all([
      supabase
        .from("health_profiles")
        .select("injuries,allergies,notes")
        .eq("user_id", id)
        .maybeSingle(),
      supabase
        .from("bookings")
        .select("slot_date,slot_start")
        .eq("user_id", id)
        .order("slot_date", { ascending: false })
        .limit(10),
    ]);
    setHealth((h as Health) ?? { injuries: "", allergies: "", notes: "" });
    setBookings(b ?? []);
  }

  if (loading)
    return (
      <div className="glass flex items-center justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );

  const opened = rows.find((r) => r.id === openId);

  return (
    <div className="space-y-3">
      {rows.map((c) => (
        <div key={c.id} className="glass">
          <button
            onClick={() => (openId === c.id ? setOpenId(null) : open(c.id))}
            className="flex w-full items-center gap-3 p-4 text-left"
          >
            <div className="btn-neon flex h-10 w-10 items-center justify-center rounded-full font-display">
              {c.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="font-display font-semibold">{c.full_name}</p>
              <p className="text-xs text-muted-foreground">
                {c.phone ?? "no phone"} · <span className="capitalize">{c.status}</span>
              </p>
            </div>
          </button>
          {opened?.id === c.id && (
            <div className="border-t border-white/10 p-4 text-sm">
              <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                <Stat label="Age" v={c.age} />
                <Stat label="Height" v={c.height_cm ? `${c.height_cm}cm` : null} />
                <Stat label="Weight" v={c.weight_kg ? `${c.weight_kg}kg` : null} />
              </div>
              <div className="mt-3 space-y-2">
                <Section title="Injuries" value={health?.injuries} />
                <Section title="Allergies" value={health?.allergies} />
                <Section title="Notes" value={health?.notes} />
              </div>
              <div className="mt-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Recent sessions
                </p>
                {bookings.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No bookings yet.</p>
                ) : (
                  <ul className="space-y-1 text-xs">
                    {bookings.map((b, i) => (
                      <li key={i}>
                        {new Date(b.slot_date).toLocaleDateString()} · {b.slot_start.slice(0, 5)}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function Stat({ label, v }: { label: string; v: string | number | null }) {
  return (
    <div className="glass p-2 text-center">
      <div className="text-[10px] uppercase">{label}</div>
      <div className="mt-0.5 font-display text-sm text-foreground">{v ?? "–"}</div>
    </div>
  );
}
function Section({ title, value }: { title: string; value?: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </p>
      <p className="mt-0.5 text-sm">{value?.trim() || <span className="text-muted-foreground">—</span>}</p>
    </div>
  );
}
