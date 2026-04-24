# SocialAI — AI Social Media Assistant for Small Businesses

A full-stack Micro-SaaS that helps small business owners generate, organize, and schedule social media content using AI.

## Tech Stack

| Layer      | Technology |
|------------|-----------|
| Frontend   | React 18, Tailwind CSS, Vite |
| Auth & DB  | Supabase (PostgreSQL + RLS) |
| AI         | Anthropic Claude (via Edge Function) |
| Payments   | Paystack (swap-ready for Stripe) |
| Deployment | Vercel / Netlify + Supabase Edge |

## Features

- 🔐 **Auth** — Supabase email/password auth with auto-profile creation
- 📊 **Dashboard** — Credits widget, post stats, weekly calendar
- ✨ **AI Generator** — Topic + tone + platform → ready-to-post content
- 📚 **Content Library** — Filter, schedule, copy, delete saved posts
- 🔗 **Connected Accounts** — Link Twitter, LinkedIn, Instagram, Facebook
- 💳 **Billing** — Tiered plans + one-time credit top-ups via Paystack

## Quick Start

See [SETUP.md](./SETUP.md) for the full setup guide.

```bash
npm install
cp .env.example .env.local   # fill in your keys
npm run dev
```

## Credit System

| Event        | Credits |
|-------------|---------|
| AI Generation (any platform combo) | -1 |
| Free tier signup | +10 |
| Starter plan | +100/month |
| Pro plan     | +400/month |
| Top-up packs | +20 / +50 / +120 |

## License

MIT
