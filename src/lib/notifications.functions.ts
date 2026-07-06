import { createServerFn, useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const approveUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { userId: string }) =>
    z.object({ userId: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    // Verify caller is admin by reading their own role row (RLS allows self-read)
    const { data: roleRow } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) throw new Error("Forbidden");

    // Load target profile (admin RLS allows read)
    const { data: target, error: profErr } = await context.supabase
      .from("profiles")
      .select("id,full_name,phone,status")
      .eq("id", data.userId)
      .maybeSingle();
    if (profErr) throw new Error(profErr.message);
    if (!target) throw new Error("User not found");

    // Load auth email via admin API
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: userData, error: userErr } = await supabaseAdmin.auth.admin.getUserById(
      data.userId,
    );
    if (userErr) throw new Error(userErr.message);
    const email = userData.user?.email ?? "your email";

    // Flip status to active
    const { error: updErr } = await context.supabase
      .from("profiles")
      .update({ status: "active", updated_at: new Date().toISOString() })
      .eq("id", data.userId);
    if (updErr) throw new Error(updErr.message);

    // Send activation via Twilio if configured; otherwise mock.
    const twilioKey = process.env.TWILIO_API_KEY;
    const lovableKey = process.env.LOVABLE_API_KEY;
    const fromNumber = process.env.TWILIO_FROM_NUMBER;
    const message = `Welcome to RM Personal Training, ${target.full_name}! Your account is activated. Sign in with ${email} and start booking sessions.`;

    let notified: "sent" | "mocked" = "mocked";
    if (twilioKey && lovableKey && fromNumber && target.phone) {
      try {
        const res = await fetch(
          "https://connector-gateway.lovable.dev/twilio/Messages.json",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${lovableKey}`,
              "X-Connection-Api-Key": twilioKey,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              To: target.phone,
              From: fromNumber,
              Body: message,
            }),
          },
        );
        if (res.ok) notified = "sent";
        else console.warn("Twilio failed:", await res.text());
      } catch (e) {
        console.warn("Twilio error:", e);
      }
    } else {
      console.log(`[MOCK activation] to=${target.phone} :: ${message}`);
    }

    return { ok: true, notified };
  });

export function useApproveUser() {
  return useServerFn(approveUser);
}
