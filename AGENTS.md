# Repository Notes

## Stack

Next.js 15 (App Router, TypeScript, Tailwind v4) + Drizzle ORM + PostgreSQL
(Neon-compatible `pg` driver) + Better Auth (email/password + GitHub/Google).
CRUD runs through server actions in `src/lib/actions.ts`; validation is Zod in
`src/lib/validation.ts`. UI is shadcn/ui (new-york style, zinc base, dark
theme forced via `.dark` on `<html>`): primitives live in `src/components/ui`
(regenerate via `npx shadcn@latest add <name>`), theme tokens are CSS
variables in `src/app/globals.css`, `cn()` helper in `src/lib/utils.ts`.

## Commands

```
npm run dev           # dev server (needs DATABASE_URL + BETTER_AUTH_SECRET in .env)
npm run build         # production build (also typechecks)
npx tsc --noEmit      # typecheck only
npm run db:generate   # generate SQL migration from src/db/schema.ts into drizzle/
npm run db:migrate    # apply migrations
docker compose up -d --build   # full stack incl. Postgres; migrations run on container start
```

## Gotchas

- `src/db/index.ts` and `src/lib/auth.ts` throw at import when env vars are
  missing — except during `next build` (guarded via `NEXT_PHASE`). Keep that
  guard or builds fail with "DATABASE_URL is not set".
- better-auth requires drizzle-orm >= 0.45.
- Schema changes: edit `src/db/schema.ts` → `db:generate` → review SQL →
  `db:migrate`. Changing the TS file alone does nothing to the database.
- All game queries must stay scoped by `userId` (`eq(games.userId, ...)` in
  every action) — that is the ownership/authorization boundary.
- Social providers are conditionally enabled: if client ID/secret env vars are
  absent they are omitted from config and hidden from the login UI.
- Cover art search (`GET /api/games/search?q=`) proxies RAWG.io; it requires
  `RAWG_API_KEY` in env. Without the key the endpoint returns
  `{configured:false}` and the form hides the picker — that is intentional, not a bug.
