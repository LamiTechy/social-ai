# SocialAI — AI Social Media Assistant for Small Businesses

A full-stack Micro-SaaS that helps small business owners generate, organize, and schedule social media content using AI.

## Tech Stack

| Layer      | Technology                       |
| ---------- | -------------------------------- |
| Frontend   | React 18, Tailwind CSS, Vite     |
| Auth & DB  | Supabase (PostgreSQL + RLS)      |
| AI         | Groq API                         |
| Deployment | Vercel / Netlify + Supabase Edge |

## Features

- 🔐 **Auth** — Supabase email/password auth with auto-profile creation
- 📊 **Dashboard** — Post stats, weekly calendar
- ✨ **AI Generator** — Topic + tone + platform → ready-to-post content
- 📚 **Content Library** — Filter, schedule, copy, delete saved posts
- 🔗 **Connected Accounts** — Link Twitter, LinkedIn, Instagram, Facebook

## Quick Start

See [SETUP.md](./SETUP.md) for the full setup guide.

```bash
npm install
cp .env.example .env.local   # fill in your keys
npm run dev
```

## License

MIT
