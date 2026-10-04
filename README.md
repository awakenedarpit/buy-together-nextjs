# Buy Together

Turn individual needs into smarter group purchases. Buy Together lets members describe purchases in everyday English or Hinglish, saves those requests in Supabase, and gives managers a live combined view of everything the group needs.

> **Live demo:** [https://buy-together-demo.onrender.com](https://buy-together-demo.onrender.com)
> **Source:** [awakenedarpit/buy-together-nextjs](https://github.com/awakenedarpit/buy-together-nextjs)
> The demo uses Render's free web service and may take a little longer to respond after a period of inactivity.

## Features

- Email/password registration and login with Supabase Auth; new accounts default to `MEMBER`.
- Server-rendered member dashboard with private personal requirements.
- Optional Gemini structured extraction plus a deterministic parser that works without an API key.
- Add requirements from natural language; edit or delete individual items.
- Manager view for all member requirements, search/member filters, and dynamic totals grouped by item + variant + unit.
- Protected manager setup using a server-only setup secret and Supabase service-role key; a SQL promotion example is included as a fallback.
- PostgreSQL foreign keys, indexes, quantity checks, row-level security policies, and non-exposed security-definer helpers.
- Responsive Next.js App Router interface styled with Tailwind CSS 4 and custom design tokens.

## Technology

- Next.js 16 App Router, React 19, TypeScript
- Supabase PostgreSQL, Auth, `@supabase/ssr`
- Tailwind CSS 4
- Gemini API (optional); always-available deterministic English/Hinglish fallback
- Render deployment with auto-deploy from the repository's `main` branch

## Local setup

Requirements: Node.js 20.9+ (Node 22 recommended) and npm.

```bash
git clone https://github.com/awakenedarpit/buy-together-nextjs.git
cd buy-together-nextjs
npm install
cp .env.example .env.local
```

Fill in `.env.local` as described below, then run:

```bash
npm run dev
```

Open <http://localhost:3000>. `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` are available for checks.

## Supabase setup

The live demo already has its own Supabase project, schema, and Auth URL configuration. For a separate project:

1. Create a Supabase project.
2. In **SQL Editor**, run [`supabase/schema.sql`](supabase/schema.sql). It creates `profiles`, `messages`, and `request_items`; a profile trigger; indexes; a private manager-check function; and RLS policies.
3. If upgrading a project that already ran the earlier schema, apply [`supabase/migrations/202610040001_private_security_functions.sql`](supabase/migrations/202610040001_private_security_functions.sql) instead of re-running the full schema.
4. In **Authentication → Providers → Email**, enable email/password. Complete the email confirmation flow if it is enabled for the project.
5. Copy the project URL and anon/public key from **Project Settings → API** into `.env.local` or your deployment environment:

   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

   The anon key is intended for client authentication; database access remains constrained by RLS.
6. In **Authentication → URL Configuration**, set the production Site URL and add the production origin plus `http://localhost:3000/**` to the allowed redirect URLs.

### Manager account

For the live demo, register and confirm the account you want to use as manager, then run this one-time statement in the Buy Together Supabase SQL Editor, replacing the example address with that account's email:

```sql
update public.profiles set role = 'MANAGER' where email = 'manager@example.com';
```

The optional `/manager/setup` form requires both of these **server-only** deployment variables:

```dotenv
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
MANAGER_SETUP_SECRET=replace-with-a-long-random-secret
```

The route verifies the secret server-side and promotes only the signed-in user's profile. Never prefix the service-role key with `NEXT_PUBLIC_` or expose it in browser code.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase public anon key; RLS still applies |
| `SUPABASE_SERVICE_ROLE_KEY` | Manager setup only | Server-only manager promotion |
| `MANAGER_SETUP_SECRET` | Manager setup only | Separate shared secret for the protected setup action |
| `GEMINI_API_KEY` | No | Enables Gemini structured extraction; if missing or the call fails, the local parser is used |
| `GEMINI_MODEL` | No | Model name; defaults to `gemini-2.5-flash` |

The repository ignores environment files; `.env.example` is the only environment template committed.

## Deployment

The `main` branch of the GitHub repository is connected to the Render web service. A push to `main` automatically rebuilds and deploys the app. The live service has the required Supabase public URL and anon key configured; no service-role key is exposed to the public app.

**Live deployment:** [https://buy-together-demo.onrender.com](https://buy-together-demo.onrender.com)
