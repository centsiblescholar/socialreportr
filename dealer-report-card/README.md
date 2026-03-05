# Dealer Report Card

Instant dealer intelligence for automotive sales reps. Enter a dealership URL, get a full report in seconds.

**Stack:** React + Vite + Tailwind → Vercel | Supabase (Postgres + Auth + Edge Functions)

---

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/dealer-report-card.git
cd dealer-report-card
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your values:

```
VITE_SUPABASE_URL=https://ldttcpogwdfwzmzvomvm.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

Your Supabase anon key is in: **Supabase Dashboard → Project Settings → API**

### 3. Run Locally

```bash
npm run dev
```

App runs at `http://localhost:5173`

---

## Supabase Setup (Already Done)

The following are already configured in your Supabase project (`ldttcpogwdfwzmzvomvm`):

- ✅ Database schema (5 tables: profiles, reports, report_shares, saved_dealers, usage_log)
- ✅ Row Level Security policies
- ✅ Auto-create profile on signup trigger
- ✅ `scrape` Edge Function deployed

### Supabase Auth Settings

In your Supabase Dashboard → Authentication → URL Configuration, set:

- **Site URL:** `http://localhost:5173` (dev) or your Vercel URL (prod)
- **Redirect URLs:** add your Vercel URL

---

## Deploy to Vercel

### Option A: Vercel Dashboard (easiest)

1. Push this repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your GitHub repo
4. Add environment variables:
   - `VITE_SUPABASE_URL` = `https://ldttcpogwdfwzmzvomvm.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = your anon key
5. Deploy

### Option B: Vercel CLI

```bash
npm i -g vercel
vercel --prod
```

---

## Project Structure

```
dealer-report-card/
├── src/
│   ├── pages/
│   │   ├── AuthPage.jsx        # Login / signup
│   │   ├── DashboardPage.jsx   # Report history list
│   │   ├── NewReportPage.jsx   # URL input + progress
│   │   ├── ReportPage.jsx      # Full report view
│   │   └── SettingsPage.jsx    # Profile + plan
│   ├── components/
│   │   └── Layout.jsx          # Nav shell (top + mobile bottom)
│   ├── hooks/
│   │   └── useAuth.js          # Auth context + profile
│   ├── lib/
│   │   └── supabase.js         # Supabase client
│   ├── App.jsx                 # Router + auth guard
│   └── main.jsx
├── supabase/
│   └── functions/
│       └── scrape/
│           └── index.ts        # TypeScript scraper edge function
├── .env.example
├── package.json
├── tailwind.config.js
└── vite.config.js
```

---

## How the Scraper Works

When a user submits a dealer URL:

1. React creates a `pending` report record in Supabase
2. React calls the `scrape` Edge Function with the report ID + URL
3. Edge Function fetches the dealer homepage
4. Runs in parallel:
   - `getDealerBasics()` — name, phone, address, brands from JSON-LD + HTML
   - `detectTechStack()` — 40+ fingerprint patterns across 8 categories
   - `analyzeSeo()` — 9-point on-page audit with letter grade
   - `scrapeInventory()` — JSON-LD vehicle data + inventory page count
5. `identifyOpportunities()` — gap analysis generates pitch angles
6. Full JSON saved to `reports.data` (JSONB)
7. Status updated to `complete`
8. React renders the report

---

## Phase Roadmap

| Phase | Status | Cost | Key Additions |
|-------|--------|------|---------------|
| Phase 1 | 🟢 In progress | $0/mo | Core app, auth, live scraping |
| Phase 2 | 🔜 Next | ~$50-100/mo | Playwright for JS sites, Google reviews, PDF export, Stripe |
| Phase 3 | 🔮 Future | ~$800-2K/mo | Cross-Sell lender data, MarketCheck inventory, BuiltWith |

---

## Next Steps for Phase 2

- [ ] Add Browserless.io for JS-rendered dealer sites
- [ ] Google Places API for dealer reviews + star ratings
- [ ] PDF export via Browserless print-to-PDF
- [ ] Shareable report links (token-based, no auth required)
- [ ] Stripe subscription billing
- [ ] Report refresh (re-run saved dealer)

---

Built by Manifest Lab X
