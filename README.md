# 🎣 LureLoadout

A fishing lure inventory tracker with AI-powered daily recommendations based on water clarity, weather, and conditions.

## Setup

### 1. Get a free Gemini API key

1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click **Create API key** — no credit card needed

### 2. Install dependencies

```bash
npm install
```

### 3. Add your API key

```bash
cp .env.example .env.local
```

Edit `.env.local` and replace `your_api_key_here` with your Gemini key.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploy to Vercel (free hosting)

1. Push the project to a GitHub repo
2. Go to [vercel.com](https://vercel.com) and import the repo
3. In the Vercel project settings, add an environment variable:
   - **Name:** `GEMINI_API_KEY`
   - **Value:** your key from Google AI Studio
4. Deploy — you'll get a live URL in about a minute

---

## Installing on iPhone (PWA)

1. Deploy to Vercel (see above)
2. Open the URL in **Safari** on iPhone
3. Tap the **Share** button (box with arrow)
4. Tap **"Add to Home Screen"**
5. Tap **Add** — done!

The app will appear on your home screen with the LureLoadout icon and run fullscreen, just like a native app. Share the Vercel URL with fishing buddies so they can install it too.

---

## Features

- **Inventory** — Add, edit, and remove lures with type, color, size, quantity, and notes. Tap +/− to adjust counts on the fly.
- **Daily Picks** — Set today's conditions and get AI-powered lure picks from your actual inventory, with techniques and a pro tip.
- **Free AI** — Powered by Google Gemini (free tier, no credit card required).
- **Secure** — Your API key lives server-side and is never sent to the browser.
- **Persistent** — Inventory saves to localStorage and survives page refreshes.

## Tech Stack

- [Next.js 15](https://nextjs.org/) (App Router)
- [Google Gemini API](https://ai.google.dev/) (free tier)
- TypeScript + CSS Modules

---

## Monetization Setup

### Clerk (Auth — free tier)

1. Create an account at [clerk.com](https://clerk.com)
2. Create a new application
3. Copy your publishable + secret keys into `.env.local`

### Stripe (Subscriptions)

1. Create an account at [stripe.com](https://stripe.com)
2. Create a **Product** → **Price** (e.g. $4.99/month recurring)
3. Copy the Price ID (`price_...`) into `.env.local` as `STRIPE_PRICE_ID`
4. For webhooks: run `stripe listen --forward-to localhost:3000/api/webhook/stripe` locally, or add the endpoint in the Stripe dashboard for production
5. Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`

### Amazon Associates (Affiliate links)

1. Apply at [affiliate-program.amazon.com](https://affiliate-program.amazon.com)
2. Once approved, get your Associate tag (e.g. `yourtag-20`)
3. Add it as `NEXT_PUBLIC_AMAZON_AFFILIATE_TAG` in `.env.local`
4. Each lure card will show a **Buy** button linking to Amazon search with your tag

Without the tag set, Buy buttons still appear but without affiliate tracking.

---

## Supabase Setup (Cross-Device Sync)

### 1. Create a free Supabase project

1. Go to [supabase.com](https://supabase.com) and sign up
2. Create a new project (free tier, no credit card needed)
3. Wait ~2 minutes for it to provision

### 2. Run the database schema

1. In your Supabase dashboard go to **SQL Editor → New Query**
2. Copy the contents of `supabase-schema.sql` (included in this project)
3. Run it — this creates the `lures`, `rods`, `reels`, `trips`, and `user_prefs` tables with Row Level Security enabled

### 3. Get your API keys

In the Supabase dashboard go to **Settings → API**:

- Copy the **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- Copy the **anon / public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Copy the **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret — server only)

### 4. Add to .env.local

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### How sync works

- Data loads from Supabase on every login — this is the source of truth
- Changes sync back to Supabase automatically with an 800ms debounce (so rapid edits don't spam the API)
- localStorage is kept as an instant-load cache so the app feels fast
- If Supabase is unreachable, the app falls back to localStorage silently
- Users who have existing localStorage data see a one-time "Upload to cloud" banner on first login

### Deploy to Vercel

Add all three Supabase env vars in your Vercel project settings alongside the existing Clerk and Stripe vars.
