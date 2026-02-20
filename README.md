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

The local script will:
- start Supabase via `npx supabase start`
- reset the local database with project migrations
- run Playwright using local Supabase anon/service-role keys
- stop Supabase when finished

## Deploying to Vercel

- Set the two env vars above in Vercel project settings.
- Deploy from the repository; build command `npm run build`, output `.next`.
