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

## Deploying to Vercel

- Set the two env vars above in Vercel project settings.
- Deploy from the repository; build command `npm run build`, output `.next`.
