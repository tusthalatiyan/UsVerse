# UsVerse

UsVerse is a private shared-space web app built for a tiny user base. It gives close people one soft, premium shared space for ideas, plans, votes, chat, mini games, moods, memories, and tiny everyday decisions.

## Stack

- `Next.js 15` with the App Router
- `TypeScript`
- `Tailwind CSS`
- `shadcn/ui`
- `Framer Motion`
- `Lucide`
- `Zustand`
- `Supabase` for Auth, Postgres, Realtime, and RLS
- `Zod`
- `React Hook Form`
- `date-fns`
- `Vercel`

## Features

- Playful auth with nickname, emoji identity, avatar, and theme selection
- Reusable invite-code connection flow with unlink support
- Shared dream board with categories, statuses, tags, and optional image URLs
- Realtime voting for yes/no, emoji, rating, and hell-yes/maybe/nope decisions
- Random decision engine with weighted mode and celebration confetti
- Cozy private chat with reactions, presence, typing indicator, and read receipts
- Mini games for instant couple chaos
- Mood check-ins that drive lightweight recommendations
- Memory timeline for milestones, completed plans, and saved moments
- Realtime notifications

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy the env template:

```bash
cp .env.example .env.local
```

3. Add your Supabase values to `.env.local`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

4. Create a Supabase project and run the SQL migrations in `supabase/migrations/` in timestamp order.

5. Start the app:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## Verification

These checks pass in the current repo state:

```bash
npm run typecheck
npm run lint
npm run build
```

## Supabase notes

- Enable Email auth in Supabase Auth.
- The signup flow stores profile personalization in `raw_user_meta_data`, then a trigger creates the `profiles` row automatically.
- Pairing is handled with Postgres RPC functions:
  - `create_couple_invite()`
  - `join_couple_with_code(text)`
  - `unlink_couple()`
- Realtime-backed tables are added to the `supabase_realtime` publication in the migration.
- Row Level Security is enabled across the app, with `profiles.active_couple_id` used as the main access boundary.

## Deployment

1. Push the repo to GitHub.
2. Import it into Vercel.
3. Add the same environment variables in Vercel.
4. Point `NEXT_PUBLIC_APP_URL` to your production URL.
5. Run the Supabase migration against your production database before inviting real users.

## Structure

- `src/app` routes, layouts, and auth callback
- `src/components` UI grouped by product area
- `src/hooks` realtime and browser hooks
- `src/lib` env, constants, schemas, helpers, and Supabase clients
- `src/services` data shaping and browser mutation services
- `src/stores` Zustand UI state
- `src/types` database and domain typing
- `docs` architecture notes and phase-1 wireframes
- `supabase/migrations` database schema and RLS
