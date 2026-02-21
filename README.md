# Wedding Invite (Next.js)

React/Next rewrite of the original static invitation, ready for Vercel.

## Running locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Environment

Create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Tests

Playwright E2E:

```bash
npm test        # headless
npx playwright test --headed  # interactive
```

Playwright E2E against local Supabase (requires Docker):

```bash
npm run test:e2e:local
```

Playwright E2E against a real Supabase project schema:

```bash
NEXT_PUBLIC_SUPABASE_URL=... \
NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
SUPABASE_SERVICE_ROLE_KEY=... \
npm run test:e2e:remote
```

Warning: the integration tests clear rows in `wedding_rsvps` before/after each test. Use a dedicated test project.

The local script will:
- start Supabase via `npx supabase start`
- reset the local database with project migrations
- run Playwright using local Supabase anon/service-role keys
- stop Supabase when finished

## GitHub Actions tests

`.github/workflows/tests.yml` runs:
- mocked E2E tests on push/pull request
- local Supabase integration tests on push/pull request
- optional remote-schema integration tests via manual dispatch
- `deploy.yml` now gates deployment on mocked E2E passing first

Manual dispatch input:
- `schema_source`: `local`, `remote`, or `both`

Required secrets for `remote` mode:
- `SUPABASE_TEST_URL`
- `SUPABASE_TEST_ANON_KEY`
- `SUPABASE_TEST_SERVICE_ROLE_KEY`

## Deploying to Vercel

- Set the two env vars above in Vercel project settings.
- Deploy from the repository; build command `npm run build`, output `.next`.
