# AfriTalent

A matching platform connecting African talent studying/working in Japan with Japanese companies. Companies can browse talent profiles and post jobs (full-time, staffing/ongoing contract, or project-based); talent can apply to open positions and track their application status.

- **Frontend**: React 18 + TypeScript + Vite + React Router + Tailwind CSS
- **Backend**: Supabase (Postgres, Auth, Row Level Security, Storage, Edge Functions)
- **Hosting**: Netlify

## Prerequisites

- Node.js 20+
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (required to run Supabase locally)
- [Supabase CLI](https://supabase.com/docs/guides/cli) — no separate install needed, invoked via `npx supabase`

## Getting started

```bash
npm install

# Copy env template. The default values already point at the local
# Supabase stack started below, so no editing is needed for local dev.
cp .env.example .env.local

# Start Docker Desktop first, then boot local Supabase (Postgres + Auth +
# Storage + Studio) and apply all migrations.
npx supabase start

# Seed test accounts + sample talent/job/application data. Safe to
# re-run any time you want a clean slate — it resets the local DB and
# re-applies every migration in supabase/migrations/, then runs
# supabase/seed.sql.
npx supabase db reset

# Start the dev server
npm run dev
```

The app runs at http://localhost:5173. Supabase Studio (a local admin UI for the database) runs at http://127.0.0.1:54323.

## Test accounts

All seeded via `supabase/seed.sql`, password `testpass123` for all of them:

| Role | Email | Notes |
|---|---|---|
| Admin | `admin@test.local` | Can approve/reject talent profiles at `/admin` |
| Talent | `talent1@test.local` | Approved, standard profile |
| Talent | `talent2@test.local` | Approved, fully filled out (languages, experience, past clients, video URL) |
| Talent | `talent3@test.local` | Pending review, minimal profile |
| Talent | `talent4@test.local` | Draft, long bio with emoji/quotes (edge-case content) |
| Talent | `talent5@test.local` | Rejected, with an admin note |
| Company | `company1@test.local` | Company profile filled out ("Test Corp") |

## Useful commands

```bash
npm run dev         # start Vite dev server
npm run build        # production build
npm run typecheck    # tsc --noEmit
npx supabase status  # show local Supabase URLs/keys
npx supabase db reset  # reset local DB and re-seed
npx supabase db diff  # generate a migration from local schema changes
```

## Project structure

```
src/
  pages/         route-level components (one per URL)
  components/    shared UI (Navbar, dashboards, talent cards, ...)
  context/       AuthContext (session/role state)
  lib/           Supabase client, data mappers, translation helper, constants
  i18n.ts        EN/JA/FR translation strings
  types.ts       shared TypeScript types
supabase/
  migrations/    every schema change, applied in order
  functions/     Edge Functions (e.g. `translate`, for auto-translating EN -> JA)
  seed.sql       local dev seed data (test accounts + sample content)
docs/            product/planning notes; dev-credentials.md (gitignored) holds
                 real account passwords, never commit it
```

## Database changes

Never edit the Supabase dashboard schema directly for anything that should
persist. Add a new file under `supabase/migrations/` (timestamp-prefixed,
following the existing naming pattern) and run `npx supabase db reset` to
verify it applies cleanly before committing.

## Deploying

- **Frontend**: `npx netlify deploy --prod --build` (requires being logged
  into the Netlify CLI and linked to the project — ask a maintainer for
  access).
- **Database**: `npx supabase link --project-ref <ref>` once, then
  `npx supabase db push` to apply new migrations to production. Requires a
  Supabase access token (`npx supabase login`) with access to the project.
- **Edge Functions**: `npx supabase functions deploy <name>`.

Auto-translation (EN -> JA) for job postings and talent profiles requires an
Azure Translator key set as a Supabase secret:
```bash
npx supabase secrets set AZURE_TRANSLATOR_KEY=... AZURE_TRANSLATOR_REGION=japaneast
```
Without it, leaving a Japanese field blank just saves it blank — nothing
breaks, translation is simply skipped.

## Notes

- The Supabase free-tier project auto-pauses after inactivity. If
  `supabase db push` or the deployed site can't reach the database, check
  the project status in the [Supabase dashboard](https://supabase.com/dashboard)
  and restore it there.
- `docs/dev-credentials.md` is gitignored and holds real account
  credentials for local reference — never commit real passwords anywhere
  else in the repo (including `seed.sql`).
