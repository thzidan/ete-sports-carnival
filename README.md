# ETE Sports Carnival

ETE Sports Carnival is a Vite + React + Tailwind + Supabase web application for a multi-sport inter-series carnival. It includes a public site, realtime football auction page, team dashboard, and a full admin panel.

## Stack

- Frontend: React 18 + Vite
- Routing: React Router v6
- Styling: Tailwind CSS
- Backend: Supabase PostgreSQL, Auth, Storage, Realtime
- State: Zustand
- Icons: Lucide React
- Hosting: Vercel-ready SPA rewrite config included

## Features

- Public dashboard with overall leaderboard, live and upcoming matches, latest result, and sport-wise summaries
- Scoreboard and match history with sport filters
- Single match detail view
- Public football auction page with Supabase Realtime subscriptions on `auction_state`, `players`, and `matches`
- Shared login page using Supabase Auth and `admin_users` role lookup
- Protected team panel for credits and squad review
- Protected admin panel for sports, teams, matches, players, and live auction control
- Supabase SQL schema with RLS and Storage policies in [supabase/schema.sql](supabase/schema.sql)

## Environment

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Supabase Setup

1. Create a new Supabase project.
2. In Supabase Auth, enable Email authentication.
3. Open the SQL editor and run [supabase/schema.sql](supabase/schema.sql).
4. Confirm the `player-photos` Storage bucket exists and is public.
5. Create users in Supabase Auth.
6. Insert matching rows into `public.admin_users`:

```sql
insert into public.admin_users (id, email, role, team_id)
values
  ('AUTH_USER_UUID', 'admin@example.com', 'admin', null),
  ('AUTH_USER_UUID_FOR_TEAM', 'team@example.com', 'team', 'TEAM_UUID');
```

7. Seed `sports`, `teams`, `players`, and `matches` as needed from the Table Editor or SQL.

## Local Development

```bash
npm install
npm run dev
```

The app will start on Vite's local dev server. Build for production with:

```bash
npm run build
```

## Vercel Deployment

1. Push the project to a Git provider or import it directly into Vercel.
2. Add the same `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` environment variables in Vercel.
3. Deploy.

`vercel.json` already rewrites every route to `index.html`, so React Router paths like `/scoreboard`, `/auction`, `/admin`, and `/team` work in production.

## Notes

- Match standings are recalculated in the admin match manager whenever a match is created, updated, or deleted.
- Player photos upload to Supabase Storage bucket `player-photos`.
- Team auction credits are deducted from the `teams.auction_credits` column when a player is sold from the auction control page.
- Legacy static HTML files now redirect into the React routes so old bookmarks and browser history do not reopen the previous template.