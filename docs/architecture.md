# UsVerse Architecture

## Why this stack

- `Next.js 15` keeps the UI, server rendering, middleware, and deploy story in one place, which is ideal for a tiny private product.
- `Supabase` gives us Postgres, auth, realtime, and RLS without maintaining custom infrastructure.
- `Zustand` handles ephemeral UI state cleanly without adding the ceremony of a larger client cache layer.
- `shadcn/ui + Tailwind + Framer Motion` gives us a maintainable design system with enough freedom to make the app feel premium and emotionally rich.

## Product shape

- Public routes focus on playful auth and setup.
- Protected routes live inside the “universe” shell and load server-rendered snapshots from Supabase.
- Interactive modules use the Supabase browser client for validated writes plus realtime subscriptions for chat, votes, presence, and notifications.

## Data access strategy

- Authentication is handled with Supabase Auth and SSR-aware middleware for session persistence.
- Pairing uses Postgres RPC functions for atomic invite creation, joining, and unlinking.
- Product data is secured with Row Level Security using `profiles.active_couple_id` as the core access boundary.
- Pages load initial snapshots on the server; client modules hydrate with those snapshots and stay fresh via realtime events.

## File structure

- `src/app`: routes, layouts, and route handlers
- `src/components`: UI modules grouped by product area
- `src/hooks`: realtime and browser hooks
- `src/lib`: env, constants, shared schemas, Supabase helpers, utility logic
- `src/services`: data shaping and recommendation logic
- `src/stores`: Zustand state
- `src/types`: database and domain types
- `supabase/migrations`: SQL schema, RLS, triggers, and RPCs
