
# RM Personal Training — Build Plan

A mobile-first, dark futuristic web app for a personal trainer with client booking, health profiles, admin approvals, and WhatsApp/SMS activation notifications.

## Stack
- TanStack Start (existing template) + Tailwind v4
- Lovable Cloud (Supabase under the hood) for DB, auth, storage, server functions
- Twilio connector for WhatsApp/SMS activation messages (added when you're ready to send real messages; mocked until then)

## Step 1 — Database Schema (Postgres / Supabase)

```text
auth.users                     (managed by Supabase Auth: email, password)

public.profiles
  id uuid PK  → auth.users.id (cascade)
  full_name text
  age int
  phone text                   (E.164)
  avatar_url text
  height_cm numeric
  weight_kg numeric
  status text                  ('pending' | 'active' | 'denied')  default 'pending'
  created_at timestamptz

public.user_roles              (separate table — never store role on profile)
  id uuid PK
  user_id uuid → auth.users.id
  role app_role                enum('admin','client')
  unique(user_id, role)

public.health_profiles
  user_id uuid PK → auth.users.id (cascade)
  injuries text
  allergies text
  notes text
  updated_at timestamptz

public.bookings
  id uuid PK
  user_id uuid → auth.users.id
  slot_date date
  slot_start time              (e.g. 06:30, 07:30 … 22:30)
  period text                  ('morning' | 'evening')
  created_at timestamptz
  unique(user_id, slot_date, slot_start)   -- prevent double-booking self

  index (slot_date, slot_start)             -- fast capacity counts
```

**Capacity handling:** enforced in a Postgres RPC `book_slot(date, time)` that runs `INSERT ... WHERE (SELECT count(*) FROM bookings WHERE date=… AND start=…) < capacity` inside a transaction. Morning cap = 2, evening cap = 4. Only `active` clients can call it (checked via `profiles.status`).

**RLS summary:**
- profiles: user reads/updates own; admin reads/updates all
- health_profiles: user reads/updates own; admin reads
- bookings: user reads/creates own; admin reads all
- user_roles: read via `has_role()` security-definer function only

**Status flow:** signup → row inserted with `status='pending'` via trigger on `auth.users`. Admin sets `status='active'` from dashboard. A Postgres trigger on `profiles` fires an edge notification when status transitions pending→active.

## Step 2 — Activation Webhook (server function)

`src/lib/notifications.functions.ts` — protected `createServerFn` `approveUser({ userId })`:
1. Verifies caller `has_role('admin')`.
2. Updates `profiles.status = 'active'`.
3. Sends WhatsApp via Twilio connector gateway (`/Messages.json`, `MessagingServiceSid` for WA); falls back to SMS. Mocked with a `console.log` + toast until Twilio is connected.
4. Returns `{ ok: true }`.

Message body: "Welcome to RM Personal Training! Your account is approved. Login: {email} / temp password: {tempPw}. Please change it after login."

## Step 3 — Booking Engine (frontend)

`/book` route (client-only, under `_authenticated/`):
- Date picker (next 14 days).
- Fetch `bookings` for that date via server fn → group counts per slot.
- Generate slots: morning `06:30–10:30` (cap 2), evening `15:30–22:30` (cap 4).
- Each slot card shows `X / cap` and one of states: **available** (cyan glow, clickable), **filling** (magenta, still clickable), **full** (disabled, muted, "FULL" badge), **booked-by-me** (checkmark).
- Confirm → calls `book_slot` RPC. On unique-violation or capacity-exceeded, refetch and toast "Slot just filled".
- Blocks booking if `profiles.status !== 'active'` or health profile incomplete.

## Step 4 — Health Profile Form (glassmorphic)

`/health` route: dark backdrop, two glass cards (Injuries, Allergies) with big textareas, animated neon focus rings, save button with gradient (cyan→magenta). Autosave to `health_profiles` via server fn. Uses Zod validation (max 1000 chars each).

## Screens & Routes

Public
- `/` — landing (hero, features, CTA)
- `/auth` — sign in / sign up (extended signup captures name, age, phone, height, weight, avatar upload)

Client (`_authenticated/`)
- `/dashboard` — status card (pending / active), quick links
- `/health` — injuries & allergies form
- `/book` — booking engine
- `/my-bookings` — upcoming + history

Admin (`_authenticated/admin/`, gated by `has_role('admin')`)
- `/admin` — pending approvals queue (approve/deny)
- `/admin/schedule` — daily/weekly view of who's booked in which slot
- `/admin/clients` — client list → profile detail (bio, health, bookings)

## Design System

Tokens in `src/styles.css`:
- `--background` deep midnight `oklch(0.15 0.03 260)`
- `--foreground` near-white
- `--primary` electric cyan `oklch(0.82 0.18 210)`
- `--accent` neon magenta `oklch(0.68 0.28 340)`
- `--glass-bg` `oklch(1 0 0 / 0.06)`, `--glass-border` `oklch(1 0 0 / 0.12)`
- Gradients: `--gradient-neon` cyan→magenta; shadows: `--shadow-glow-cyan`, `--shadow-glow-magenta`
- Font: Inter (loaded via `<link>` in `__root.tsx`)
- Custom utilities: `@utility glass` (bg + backdrop-blur + border + shadow), `@utility neon-ring`

Button variants added: `neon` (gradient), `glass` (translucent).

## Build Order

1. Enable Lovable Cloud.
2. Migration: enum, profiles, user_roles, health_profiles, bookings, `has_role`, `book_slot` RPC, RLS + grants, signup trigger.
3. Design system tokens + fonts + glass utility + button variants.
4. Auth pages (signup with extended fields + avatar upload to storage).
5. Client dashboard + health form + booking engine.
6. Admin approvals + schedule + client detail.
7. Notification server fn (mocked). Wire Twilio when you're ready.
8. Sitemap/robots, head metadata per route.

## Notes / assumptions

- I could not access the Google usercontent HTML link (auth-gated), so I'll build the design from your written brief: dark midnight, cyan + magenta neon, glassmorphism, Inter.
- Admin role bootstrapped by you claiming the first `admin` grant (I'll add a one-time claim page or you tell me the email and I seed it in a migration).
- Notifications start mocked; connecting Twilio requires the Twilio connector — I'll prompt for it in the step that needs it.

Want me to proceed with this? If yes, I'll enable Cloud and start building.
