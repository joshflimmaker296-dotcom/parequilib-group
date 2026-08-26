# Parequilib Group

A real marketplace app: Supabase for auth + database, Stripe Connect for real
payouts (with your 10% platform fee), Next.js for the app itself, and
optional Claude-powered listing writing / shopping assistant.

Nothing in here is a fake demo — there's no client-side admin password, no
seed data, no canned auto-replies. Every screen reads and writes real rows in
a real Postgres database, and money actually moves through Stripe once
you've completed the setup below.

## 1. Supabase (auth + database) — ~5 min

1. Go to https://supabase.com → New project. Note the project's **URL** and
   **anon public key** (Project Settings → API), and the **service_role key**
   (same page — keep this one secret, it's server-only).
2. Open the SQL Editor → New query → paste the entire contents of
   `supabase/schema.sql` → Run. This creates every table, RLS policy, the
   `listing-images` storage bucket, and the trigger that auto-creates a
   profile row when someone signs up.
3. (Optional, for "Continue with Google") Authentication → Providers →
   Google → enable it and add your OAuth client ID/secret. If you skip this,
   email/password sign-in still works fine on its own.
4. Authentication → URL Configuration → set your Site URL and add
   `http://localhost:3000/**` and your production domain to Redirect URLs.

## 2. Stripe (real payments) — ~10 min

1. Create a Stripe account at https://dashboard.stripe.com (use test mode
   while developing — no real bank account needed yet).
2. Developers → API keys → copy the **Secret key** → `STRIPE_SECRET_KEY`.
3. Enable **Stripe Connect**: Connect → Get started → choose "Platform or
   marketplace" → Express accounts (this is what lets sellers get paid
   directly while you keep a 10% cut automatically — see
   `app/api/stripe/checkout/route.ts`).
4. Webhook: Developers → Webhooks → Add endpoint →
   `https://YOUR_DOMAIN/api/stripe/webhook`, listening for
   `checkout.session.completed` and `account.updated`. Copy the **Signing
   secret** → `STRIPE_WEBHOOK_SECRET`.
   - While developing locally, use the Stripe CLI instead:
     `stripe listen --forward-to localhost:3000/api/stripe/webhook`
5. When you're ready for real money, flip Stripe out of test mode and Stripe
   will walk you through business verification (this part has to be you —
   it's your business/bank details, not something that can be automated).

## 3. Anthropic (optional — AI listing writer + shopping assistant)

Get an API key at https://console.anthropic.com → set `ANTHROPIC_API_KEY`.
Without it, those two features just show a clear "not configured" message —
nothing else breaks.

## 4. Environment variables

Copy `.env.example` to `.env.local` and fill in everything from steps 1–3.

## 5. Run it locally

```bash
npm install
npm run dev
```

Visit http://localhost:3000, sign up, then in the Supabase SQL Editor run:

```sql
update profiles set role = 'admin' where email = 'you@example.com';
```

to give your own account admin access at `/admin`.

## 6. Deploy (Vercel, free tier)

1. Push this project to a GitHub repo.
2. https://vercel.com → New Project → import the repo.
3. Add all the same environment variables from `.env.local` in Vercel's
   project settings, but set `NEXT_PUBLIC_SITE_URL` to your real Vercel URL.
4. Deploy. Then update your Stripe webhook endpoint and Supabase redirect
   URLs to point at the production URL instead of localhost.

## What's real vs. what's intentionally left out

**Real:** accounts (Supabase Auth), the database (Postgres + row-level
security so users can only see/edit what they should), messaging and offers,
image uploads (Supabase Storage), Stripe Connect payouts with an automatic
10% platform fee, an admin role enforced server-side (`lib/require-admin.ts`
+ middleware), and admin stats computed live from the database.

**Left out of this pass, on purpose** — say the word and I'll add any of
these:
- Admin tools to remove listings / view all users & activity in one screen
  (currently the admin panel shows live stats only)
- Custom site branding/theme editor
- Email notifications (new message, offer received, item sold)
- Order/refund management UI beyond what Stripe's own dashboard gives you
