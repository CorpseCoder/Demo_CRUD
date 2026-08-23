# Game Backlog

Track your game backlog across platforms: completion status, ratings, reviews,
achievements, playtime and more. Built with Next.js 15, Drizzle ORM,
PostgreSQL (Neon-compatible), Better Auth (email/password + GitHub/Google OAuth)
and Tailwind CSS v4.

## Quick start (Docker)

1. Create a `.env` file next to `docker-compose.yml`:

   ```
   BETTER_AUTH_SECRET=<openssl rand -base64 32>
   # Optional OAuth:
   GITHUB_CLIENT_ID=
   GITHUB_CLIENT_SECRET=
   GOOGLE_CLIENT_ID=
   GOOGLE_CLIENT_SECRET=
   ```

2. Run:

   ```
   docker compose up -d --build
   ```

3. Open http://localhost:3000

The app container runs Drizzle migrations automatically before starting.
Data persists in the `pgdata` volume.

### Using Neon instead of the bundled Postgres

Set `DATABASE_URL` to your Neon connection string (in `.env` or shell); the
compose file forwards it to the app and skips the local db usage:

```
DATABASE_URL=postgres://...@ep-xxx.neon.tech/neondb?sslmode=require
```

## Local development (without Docker)

Requires Node 20+ and a Postgres database (`DATABASE_URL`, e.g. from Neon):

```
npm install
cp .env.example .env      # fill in values
npm run db:migrate        # or: npx drizzle-kit migrate
npm run dev
```

Useful scripts:

| Command                 | Purpose                        |
| ----------------------- | ------------------------------ |
| `npm run dev`           | Dev server                     |
| `npm run build`         | Production build               |
| `npm run typecheck`     | TypeScript check               |
| `npm run db:generate`   | Generate SQL migration from schema |
| `npm run db:migrate`    | Apply migrations               |

## OAuth setup

- GitHub: create an OAuth App at https://github.com/settings/developers with
  callback `{BASE_URL}/api/auth/callback/github`.
- Google: create OAuth credentials at https://console.cloud.google.com/apis/credentials
  with redirect `{BASE_URL}/api/auth/callback/google`.

`{BASE_URL}` is your `BETTER_AUTH_URL` (default `http://localhost:3000`).
Providers without credentials configured are hidden from the login screen.

## Notes

- Every user sees only their own games; ownership is enforced server-side in
  every CRUD action (`src/lib/actions.ts`).
- Input validation happens on the server boundary with Zod (`src/lib/validation.ts`).
- Cover art is fetched live from the RAWG.io API while typing a game name.
  Set `RAWG_API_KEY` (free at rawg.io/apidocs) to enable; without it the
  cover picker is hidden and everything else works.
