# CentsibleScholar Daily Digest Agent

A morning briefing agent that pulls data from Google Ads, Meta Ads, Google Analytics 4, and Stripe, then delivers a clean HTML email digest via Resend every morning at 7 AM CT.

## Architecture

```
Vercel Cron (7 AM CT daily)
    |
    v
GET /api/daily-digest (Next.js API Route, 60s timeout)
    |
    +-- Google Ads API     (GAQL campaign metrics)
    +-- Meta Marketing API (Insights with date_preset=yesterday)
    +-- GA4 Data API       (runReport for users, sessions, pages, traffic)
    +-- Stripe REST API    (Payment intents, customers, refunds)
    |
    v  (all fetched in parallel via Promise.all)
    |
Email Template Builder --> HTML email with KPI scorecard + detail sections
    |
    v
Resend API --> Delivers to configured recipients
```

## File Structure

```
app/api/daily-digest/route.ts   -- Main API route (cron + manual trigger)
lib/digest/
  types.ts                      -- Shared TypeScript interfaces
  google-ads.ts                 -- Google Ads data fetcher (JWT auth)
  meta-ads.ts                   -- Meta Ads data fetcher
  ga4.ts                        -- GA4 data fetcher (JWT auth)
  stripe-data.ts                -- Stripe data fetcher
  email-template.ts             -- HTML email builder
vercel.json                     -- Cron schedule configuration
.env.example                    -- Environment variables template
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your credentials. The fastest path:

**Phase 1 -- Stripe + GA4 only (30 min):**
- Set `ENABLE_GOOGLE_ADS=false` and `ENABLE_META_ADS=false`
- Configure `STRIPE_SECRET_KEY`, `GA4_PROPERTY_ID`, `GOOGLE_SERVICE_ACCOUNT_JSON`
- Set up `RESEND_API_KEY`, `DIGEST_TO_EMAIL`, and `CRON_SECRET`

**Phase 2 -- Add Meta Ads (1 hour):**
- Create a System User in Meta Business Suite
- Generate a long-lived token with `ads_read` permission
- Set `META_ACCESS_TOKEN` and `META_AD_ACCOUNT_ID`

**Phase 3 -- Add Google Ads (1-3 days, mostly waiting):**
- Apply for a Google Ads API developer token
- Set `GOOGLE_ADS_DEVELOPER_TOKEN` and `GOOGLE_ADS_CUSTOMER_ID`

### 3. Test locally

```bash
npm run dev
curl "http://localhost:3000/api/daily-digest?secret=YOUR_CRON_SECRET"
```

### 4. Deploy to Vercel

Add all env vars to Vercel project settings. The `vercel.json` cron config is picked up automatically.

```bash
# Manual trigger in production
curl -X POST https://app.centsiblescholar.com/api/daily-digest \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## How It Handles Failures

Each data source is fetched independently. If one API is down, you still get a briefing with the other three sources plus a clear error banner showing what failed.
