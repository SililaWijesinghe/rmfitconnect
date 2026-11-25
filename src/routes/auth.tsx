import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { CheckCircle2, Dumbbell, Loader2, Mail } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Sign in — RM Personal Training" },
      { name: "description", content: "Access your RM Personal Training client hub." },
    ],
  }),
});

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">(search.mode ?? "signin");

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="btn-neon flex h-9 w-9 items-center justify-center rounded-lg">
            <Dumbbell className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-bold">
            RM<span className="text-gradient-neon">.</span>Training
          </span>
        </Link>
      </header>

      <main className="mx-auto flex max-w-md flex-col px-4 pb-16 pt-6">
        <div className="glass-strong p-6 sm:p-8">
          <h1 className="font-display text-3xl font-bold">
            {mode === "signup" ? "Join the crew" : "Welcome back"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signup"
              ? "Create an account. RM reviews every signup — you'll get activated by WhatsApp."
              : "Sign in to book your next session."}
          </p>

          <div className="mt-6">
            {mode === "signup" ? (
              <SignUpForm
                onSuccess={() => navigate({ to: "/" })}
                onSignIn={() => setMode("signin")}
              />
            ) : (
              <SignInForm
                onSuccess={(isAdmin) => navigate({ to: isAdmin ? "/admin" : "/" })}
              />
            )}
          </div>


          <div className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signup" ? (
              <>
                Already have an account?{" "}
                <button
                  className="text-[color:var(--neon-cyan)] underline underline-offset-4"
                  onClick={() => setMode("signin")}
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                New here?{" "}
                <button
                  className="text-[color:var(--neon-cyan)] underline underline-offset-4"
                  onClick={() => setMode("signup")}
                >
                  Create an account
                </button>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function inputCls() {
  return "w-full rounded-md border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground/60 focus:border-[color:var(--neon-cyan)] focus:ring-2 focus:ring-[color:var(--neon-cyan)]/30 transition";
}

function SignInForm({ onSuccess }: { onSuccess: (isAdmin: boolean) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      return toast.error(error.message);
    }
    const uid = data.user?.id;
    let isAdmin = false;
    if (uid) {
      const { data: r } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", uid)
        .eq("role", "admin")
        .maybeSingle();
      isAdmin = !!r;
    }
    setLoading(false);
    toast.success("Signed in");
    onSuccess(isAdmin);
  }


  return (
    <form className="space-y-3" onSubmit={submit}>
      <input
        className={inputCls()}
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        className={inputCls()}
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button
        disabled={loading}
        className="btn-neon hover:btn-neon-hover flex w-full items-center justify-center rounded-md px-4 py-3 text-sm"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
      </button>
    </form>
  );
}

const signupSchema = z.object({
  full_name: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  password: z.string().min(6).max(72),
  age: z.number().int().min(10).max(100),
  phone: z.string().trim().min(6).max(20),
  height_cm: z.number().min(80).max(260),
  weight_kg: z.number().min(25).max(300),
});

function SignUpForm({
  onSuccess,
  onSignIn,
}: {
  onSuccess: () => void;
  onSignIn: () => void;
}) {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    age: "",
    phone: "",
    height_cm: "",
    weight_kg: "",
  });
  const [avatar, setAvatar] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [awaiting, setAwaiting] = useState<string | null>(null);

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const parsed = signupSchema.parse({
        ...form,
        age: Number(form.age),
        height_cm: Number(form.height_cm),
        weight_kg: Number(form.weight_kg),
      });

      const { data, error } = await supabase.auth.signUp({
        email: parsed.email,
        password: parsed.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: parsed.full_name,
            age: String(parsed.age),
            phone: parsed.phone,
            height_cm: String(parsed.height_cm),
            weight_kg: String(parsed.weight_kg),
          },
        },
      });
      if (error) throw error;

      if (avatar && data.user) {
        const path = `${data.user.id}/avatar-${Date.now()}.${avatar.name.split(".").pop()}`;
        const { error: upErr } = await supabase.storage
          .from("avatars")
          .upload(path, avatar, { upsert: true });
        if (!upErr) {
          const { data: pub } = supabase.storage.from("avatars").createSignedUrl
            ? await supabase.storage.from("avatars").createSignedUrl(path, 60 * 60 * 24 * 365)
            : { data: null };
          await supabase
            .from("profiles")
            .update({ avatar_url: pub?.signedUrl ?? path })
            .eq("id", data.user.id);
        }
      }

      if (!data.session) {
        // Email confirmation is required before a session is issued.
        setAwaiting(parsed.email);
        toast.success("Account created — confirm your email to continue.");
        return;
      }

      toast.success("Account created! Waiting for trainer approval.");
      onSuccess();
    } catch (err) {
      const msg = err instanceof z.ZodError ? err.issues[0]?.message : (err as Error).message;
      toast.error(msg ?? "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    if (!awaiting) return;
    setLoading(true);
    const { error } = await supabase.auth.resend({ type: "signup", email: awaiting });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Verification email sent again");
  }

  if (awaiting) {
    return (
      <div className="rm-pop">
        <div className="btn-neon flex size-11 items-center justify-center rounded-xl">
          <Mail className="size-5" aria-hidden="true" />
        </div>
        <h2 className="mt-4 font-display text-2xl tracking-wide text-balance">
          Confirm your email
        </h2>
        <p className="mt-2 text-sm text-pretty text-muted-foreground">
          We sent a confirmation link to{" "}
          <span className="font-medium text-foreground">{awaiting}</span>. You have to confirm it
          before you can sign in — that's the account security check working.
        </p>
        <ul className="mt-4 space-y-2">
          {[
            "Open the email and tap the confirmation link",
            "You'll be returned to the app automatically",
            "Then sign in and wait for RM to activate you",
          ].map((step) => (
            <li key={step} className="flex items-start gap-2 text-sm">
              <CheckCircle2
                className="mt-0.5 size-4 shrink-0 text-[color:var(--neon-cyan)]"
                aria-hidden="true"
              />
              <span className="text-pretty">{step}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-muted-foreground">
          Nothing in your inbox? Check spam and promotions, then send it again below.
        </p>
        <button
          type="button"
          onClick={resend}
          disabled={loading}
          className="glass mt-4 flex w-full items-center justify-center gap-2 rounded-md px-4 py-3 text-sm hover:bg-white/[0.08] disabled:opacity-60"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" aria-hidden="true" />}
          Send the email again
        </button>
        <button
          type="button"
          onClick={onSignIn}
          className="mt-3 w-full text-center text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Already confirmed? Sign in
        </button>
      </div>
    );
  }

  return (
    <form className="space-y-3" onSubmit={submit}>
      <input
        className={inputCls()}
        placeholder="Full name"
        value={form.full_name}
        onChange={(e) => set("full_name", e.target.value)}
        required
      />
      <input
        className={inputCls()}
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={(e) => set("email", e.target.value)}
        required
      />
      <input
        className={inputCls()}
        type="password"
        placeholder="Password (min 6)"
        value={form.password}
        onChange={(e) => set("password", e.target.value)}
        required
      />
      <input
        className={inputCls()}
        placeholder="Phone (e.g. +14155550100)"
        value={form.phone}
        onChange={(e) => set("phone", e.target.value)}
        required
      />
      <div className="grid grid-cols-3 gap-2">
        <input
          className={inputCls()}
          type="number"
          placeholder="Age"
          value={form.age}
          onChange={(e) => set("age", e.target.value)}
          required
        />
        <input
          className={inputCls()}
          type="number"
          placeholder="Height cm"
          value={form.height_cm}
          onChange={(e) => set("height_cm", e.target.value)}
          required
        />
        <input
          className={inputCls()}
          type="number"
          placeholder="Weight kg"
          value={form.weight_kg}
          onChange={(e) => set("weight_kg", e.target.value)}
          required
        />
      </div>
      <label className="block text-xs text-muted-foreground">
        Profile picture (optional)
        <input
          type="file"
          accept="image/*"
          className="mt-1 block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-sm file:text-foreground"
          onChange={(e) => setAvatar(e.target.files?.[0] ?? null)}
        />
      </label>
      <button
        disabled={loading}
        className="btn-neon hover:btn-neon-hover flex w-full items-center justify-center rounded-md px-4 py-3 text-sm"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
      </button>
    </form>
  );
}
