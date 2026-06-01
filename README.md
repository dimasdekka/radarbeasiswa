<div align="center">

# 🛰️ RadarBeasiswa

**AI-powered scholarship discovery, matching, and application platform for Indonesian students.**

From finding scholarships you didn't know existed, to knowing which ones actually fit you, all the way to drafting essays — in one place.

[![Live Demo](https://img.shields.io/badge/demo-live-22c55e?style=flat-square)](https://beasiswa-radar-966798432161.asia-southeast2.run.app)
[![Built for #JuaraVibeCoding](https://img.shields.io/badge/built%20for-%23JuaraVibeCoding-7c3aed?style=flat-square)](#)
[![Next.js 14](https://img.shields.io/badge/Next.js-14-000?style=flat-square&logo=nextdotjs)](https://nextjs.org/)
[![Gemini](https://img.shields.io/badge/Google-Gemini-4285F4?style=flat-square&logo=google)](https://ai.google.dev/)
[![Cloud Run](https://img.shields.io/badge/Google-Cloud%20Run-4285F4?style=flat-square&logo=googlecloud)](https://cloud.google.com/run)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](#license)

[Live demo](https://beasiswa-radar-966798432161.asia-southeast2.run.app) · [Features](#-features) · [Tech stack](#-tech-stack) · [Local setup](#-local-setup) · [Deploy](#-deploy-to-cloud-run)

</div>

---

## 📖 The problem

Each year, thousands of scholarships open for Indonesian students — LPDP, Chevening, DAAD, MEXT, Australia Awards, Fulbright, plus university-specific programs. The information is scattered across dozens of websites with different formats and update cadences.

Students burn hours hopping between portals, miss deadlines, and worst of all, they don't know which scholarships actually fit their profile. Most existing sites only show static lists with no personalization, no relevance ranking, and no explanation. Talented students fail to apply not because they aren't qualified — but because they didn't know, and had nobody to guide them.

## 💡 What RadarBeasiswa does

RadarBeasiswa unifies the entire scholarship journey into one AI-assisted platform:

- **One central, always-fresh database** built by automatic scraping of official sources, normalized by Gemini.
- **Personalized matching** — fill in a profile or just upload a CV, and the AI returns a Match Score *with reasoning* per scholarship.
- **AI eligibility explainer** breaks down each criterion so students understand exactly why they qualify or not.
- **Essay Studio** with rubric-aware feedback per paragraph.
- **Document checklist + deadline tracker** so nothing slips.
- **Indonesian-first** copy, onboarding, and rubrics — for both high schoolers (S1) and university students/fresh grads (S2/S3).

> Built end-to-end in under three weeks for the **#JuaraVibeCoding** challenge by [GDG Live Indonesia](https://gdg.community.dev/).

---

## ✨ Features

### For students

| | |
|---|---|
| 🎯 **AI Matching Engine** | Per-scholarship Match Score with a written reason — not just a number, the *why* |
| 📄 **CV-to-profile** | Upload PDF/DOCX, AI parses fields straight into your profile |
| 🧭 **Smart filtering** | Search + filter by jenjang, country, GPA min, language scores, funding scope |
| 🔍 **Eligibility explainer** | Per-criterion breakdown so students see exactly what to improve |
| ✍️ **Essay Studio** | Rubric-driven prompts and AI feedback per paragraph |
| ✅ **Doc checklist** | Auto-generated per scholarship |
| 🔔 **Deadline tracker** | Application stage status (Riset → Essay → Dokumen → Submit) |
| 📊 **Dashboard** | Visual progress, country/level breakdown, funding mix |

### For admins

| | |
|---|---|
| 🤖 **Scraping pipeline** | Cheerio + Playwright scrapers, normalized by Gemini, with manual review queue |
| 🌐 **AI Auto-Research** | Gemini with Google Search grounding — finds *new* scholarships automatically |
| 🖼️ **Image manager** | Per-scholarship hero image with og:image candidates and fallbacks |
| ⏰ **Cloud Scheduler** | Daily/weekly auto-scrape jobs |
| 🔐 **Auth + RBAC** | Supabase Auth (email + Google OAuth), admin-only endpoints |

---

## 🧱 Tech stack

**Frontend** Next.js 14 (App Router) · TypeScript · Tailwind CSS · shadcn-style UI · GSAP · Three.js · Recharts · Framer Motion

**AI** Google Gemini (`gemini-2.5-flash` → `2.0-flash` → `2.5-flash-lite` fallback chain) · Google Search grounding · pgvector embeddings for matching

**Backend & Data** Next.js API Routes · Prisma ORM · Supabase (Postgres + pgvector + Auth + Storage)

**Scraping** Playwright · Cheerio · Gemini-based normalization

**Infra** Google Cloud Run (`asia-southeast2` / Jakarta) · Cloud Build · Artifact Registry · Cloud Scheduler · Docker (multi-stage)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                       Next.js 14 (App Router)                       │
│  ┌─────────────┐   ┌──────────────┐   ┌────────────────────────┐    │
│  │  Public UI  │   │ Student app  │   │  Admin panel + review  │    │
│  └─────────────┘   └──────────────┘   └────────────────────────┘    │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
       ┌───────────────────────┼───────────────────────┐
       ▼                       ▼                       ▼
┌──────────────┐      ┌─────────────────┐     ┌─────────────────┐
│   Supabase   │      │  Gemini AI      │     │ Scraping engine │
│ Postgres +   │ ◀──▶ │ - normalizer    │ ◀──▶│ Playwright +    │
│ pgvector +   │      │ - matching      │     │ Cheerio         │
│ Auth + Storage      │ - essay coach   │     │                 │
│              │      │ - search ground │     │                 │
└──────────────┘      └─────────────────┘     └─────────────────┘
```

The Gemini client (`src/lib/gemini.ts`) is hardened with exponential backoff, `Retry-After` parsing, and a model fallback chain — so transient rate limits never poison the database with bad rows.

---

## 🚀 Local setup

### 1. Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project (free tier is fine)
- A Google AI Studio key (Gemini Developer API) — [get one](https://aistudio.google.com/apikey)

### 2. Clone & install

```bash
git clone https://github.com/dimasdekka/radarbeasiswa.git
cd radarbeasiswa
npm install
```

### 3. Environment

Create `.env` in the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="sb_publishable_..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."
DATABASE_URL="postgresql://postgres:PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres"

# Google AI (Gemini Developer API)
GOOGLE_AI_API_KEY="AIza..."

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Optional — cron / scraping automation
CRON_SECRET=""
AUTO_APPROVE_HIGH_CONFIDENCE="false"
```

### 4. Database

In your Supabase project, enable the `vector` extension (Database → Extensions), then:

```bash
npx prisma db push      # apply schema
npx prisma generate     # generate client
npx tsx prisma/seed.ts  # seed initial scholarships (optional)
```

### 5. Run

```bash
npm run dev
```

Open <http://localhost:3000>.

> ⚠️ Don't run `npm run build` while `npm run dev` is running — it corrupts the `.next` cache. Stop dev first.

---

## ☁️ Deploy to Cloud Run

The repo includes a working `Dockerfile` (multi-stage, standalone) and `cloudbuild.yaml`. Full step-by-step in [`DEPLOY.md`](./DEPLOY.md), but the short version:

```bash
# Build via Cloud Build (passes NEXT_PUBLIC_* as build args)
gcloud builds submit --config cloudbuild.yaml \
  --substitutions=_NEXT_PUBLIC_SUPABASE_URL=...,_NEXT_PUBLIC_SUPABASE_ANON_KEY=...,_NEXT_PUBLIC_APP_URL=...

# Deploy
gcloud run deploy beasiswa-radar \
  --image=asia-southeast2-docker.pkg.dev/PROJECT/beasiswa-radar/app:latest \
  --region=asia-southeast2
```

Set the rest of the env vars (`DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_AI_API_KEY`, etc.) on the Cloud Run service. Configure Supabase Auth Site URL and Redirect URLs to your Cloud Run domain. Optionally wire Cloud Scheduler for periodic scraping (see `DEPLOY.md` § Auto-Scraping).

---

## 📂 Project structure

```
src/
├── app/
│   ├── (admin)/        Admin panel (scraping review, sources, image manager)
│   ├── (auth)/         Login, register, OAuth callback
│   ├── (main)/         Dashboard, beasiswa list & detail, apply flow, profile
│   └── api/            Auth, profile, beasiswa, applications, essays, scraping, cron
├── components/
│   ├── admin/          Admin-only UI (review cards, AI research panel)
│   ├── animations/     GSAP-powered Reveal, WordsReveal, Magnetic
│   ├── auth/           AuthAside, GoogleButton
│   ├── essay/          Essay Studio editor + feedback panels
│   ├── three/          3D scholarship globe
│   └── ui/             Primitives (Button, Card, Input, SafeImage, etc.)
├── lib/
│   ├── gemini.ts           Hardened Gemini client (retries, fallback)
│   ├── matching.ts         Profile↔beasiswa scoring
│   ├── normalizer.ts       Raw scrape → structured Beasiswa via Gemini
│   ├── explainer.ts        Per-criterion eligibility explanation
│   ├── essay-ai.ts         Essay rubric coach
│   ├── ai-research.ts      Auto-research with Google Search grounding
│   ├── scraping-pipeline.ts End-to-end scrape + normalize + persist
│   ├── scraper.ts          Cheerio + Playwright fetchers
│   └── embedding.ts        pgvector embeddings
└── utils/supabase/         Server, client, admin (service-role) helpers
prisma/
├── schema.prisma           Beasiswa, User, Profile, Application, Essay, Source, ...
├── seed*.ts                Curated + scraped seed data
└── audit-images.ts         Image-quality audit + remediation
```

---

## 🤝 Contributing

This started as a solo build for #JuaraVibeCoding, but issues, PRs, and ideas are welcome. The mission — making scholarship discovery actually work for Indonesian students — is bigger than any one person.

Good first contributions:
- Add a new scholarship source to `prisma/seed-sources.ts` and a scraper in `src/lib/scraper.ts`
- Improve the Indonesian rubric/copy in `src/lib/essay-ai.ts`
- Add tests (none yet — green field)
- Accessibility audit and improvements

Please open an issue first for anything substantial.

---

## 🗺️ Roadmap

- [ ] User-submitted scholarship suggestions (community contribution)
- [ ] Email + push deadline reminders
- [ ] Mock interview practice with AI
- [ ] Mentor matching (alumni who got the same scholarship)
- [ ] Multi-language support (English UI alongside Bahasa)
- [ ] Mobile app (React Native or PWA polish)
- [ ] Telemetry + impact dashboard (how many users → applied → got accepted)

---

## 📜 License

MIT — see [LICENSE](./LICENSE) (to be added). You're free to use, modify, and learn from this code. Attribution appreciated.

---

## 🙏 Acknowledgements

- [GDG Live Indonesia](https://gdg.community.dev/) and the **#JuaraVibeCoding** program
- [Google Cloud](https://cloud.google.com/) — Gemini API + Cloud Run + Cloud Build
- [Supabase](https://supabase.com) — Postgres, pgvector, Auth, Storage
- [shadcn/ui](https://ui.shadcn.com), [Lucide](https://lucide.dev), [Recharts](https://recharts.org), [GSAP](https://gsap.com), [Three.js](https://threejs.org)
- The [GhostCatcg/3d-earth](https://github.com/GhostCatcg/3d-earth) project — basis for the hero globe
- And every Indonesian student who deserves a fair shot at the right scholarship

<div align="center">

Made with ☕ and Gemini in Jakarta · 2026

</div>
