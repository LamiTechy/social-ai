# SocialAI — Setup Guide

## Prerequisites

- Node.js ≥ 18
- Supabase account (free tier works)
- Groq API key

---

## 1 · Clone & Install

```bash
git clone <your-repo>
cd social-ai-saas
npm install
```

---

## 2 · Supabase Setup

### Create a project

1. Go to https://supabase.com → New project
2. Copy your **Project URL** and **anon public key** from Settings → API

### Run the schema

1. Open Supabase dashboard → SQL Editor
2. Paste the contents of `supabase/schema.sql`
3. Click **Run**

### Enable Realtime (optional, for live credit updates)

```sql
alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.generated_posts;
```

---

## 3 · Environment Variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```bash
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

VITE_GROQ_API_KEY=gsk_...
```

---

## 4 · Supabase Edge Functions

### Install Supabase CLI

```bash
npm install -g supabase
supabase login
supabase link --project-ref <your-project-ref>
```

### Set secrets

```bash
supabase secrets set GROQ_API_KEY=gsk_...
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

### Deploy functions

```bash
supabase functions deploy generate
```

---

## 5 · OAuth (Connected Accounts)

To enable real platform connections:

### Twitter / X

1. Apply at https://developer.twitter.com
2. Create an app, enable OAuth 2.0
3. Add `TWITTER_CLIENT_ID` and `TWITTER_CLIENT_SECRET` to Edge Function secrets
4. Implement the OAuth flow in `supabase/functions/oauth-twitter/`

### LinkedIn

1. Create app at https://developer.linkedin.com
2. Request `w_member_social` permission
3. Add `LINKEDIN_CLIENT_ID` / `LINKEDIN_CLIENT_SECRET`

### Instagram

1. Use Meta for Developers: https://developers.facebook.com
2. Create a Business app, add Instagram Graph API product
3. Add `INSTAGRAM_APP_ID` / `INSTAGRAM_APP_SECRET`

---

## 6 · Run Locally

```bash
npm run dev
```

Visit http://localhost:5173

---

## 7 · Deploy to Production

### Frontend (Vercel / Netlify)

```bash
npm run build
# Deploy dist/ to Vercel, Netlify, or any static host
```

Vercel:

```bash
npx vercel --prod
```

Set environment variables in your hosting platform's dashboard.

### Backend

Edge Functions are already deployed to Supabase's global edge network — nothing extra needed.

---

## Project Structure

```
src/
  features/
    auth/         Login, Signup
    dashboard/    Overview, stats, calendar
    generator/    AI content generation
    library/      Post management & scheduling
    accounts/     Social platform connections
  components/
    layout/       AppShell, Sidebar, TopBar
    ui/           Button, Modal, Toast, Badge…
  hooks/          useAuth, usePosts, useProfile
  lib/
    supabase/     client.js, posts.js (all DB operations)
    ai/           generateContent.js (API wrapper)
  context/        AuthContext, ProfileContext
supabase/
  schema.sql
  functions/
    generate/     AI content Edge Function
```

---

## Support

Open an issue in the repository or email support@yourdomain.com
