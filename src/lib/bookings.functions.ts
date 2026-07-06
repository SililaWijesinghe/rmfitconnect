import { createServerFn, useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const inputSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start: z.string().regex(/^\d{2}:\d{2}$/),
});

export const bookSlot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { date: string; start: string }) => inputSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Check account status via user's own JWT (RLS-enforced)
    const { data: profile, error: profErr } = await context.supabase
      .from("profiles")
      .select("status")
      .eq("id", context.userId)
      .maybeSingle();
    if (profErr) throw new Error(profErr.message);
    if (!profile || profile.status !== "active") throw new Error("Account not active");

    // Validate slot window and capacity
    const [h, m] = data.start.split(":").map(Number);
    if (m !== 30) throw new Error("Slots must start at :30");
    const minutes = h * 60 + m;
    let period: "morning" | "evening";
    let cap: number;
    if (minutes >= 6 * 60 + 30 && minutes <= 9 * 60 + 30) {
      period = "morning";
      cap = 2;
    } else if (minutes >= 15 * 60 + 30 && minutes <= 21 * 60 + 30) {
      period = "evening";
      cap = 4;
    } else {
      throw new Error("Invalid time slot");
    }

    const { count, error: cntErr } = await supabaseAdmin
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("slot_date", data.date)
      .eq("slot_start", data.start);
    if (cntErr) throw new Error(cntErr.message);
    if ((count ?? 0) >= cap) throw new Error("Slot full");

    const { data: row, error: insErr } = await supabaseAdmin
      .from("bookings")
      .insert({
        user_id: context.userId,
        slot_date: data.date,
        slot_start: data.start,
        period,
      })
      .select()
      .single();
    if (insErr) throw new Error(insErr.message);
    return row;
  });

export function useBookSlot() {
  return useServerFn(bookSlot);
}
