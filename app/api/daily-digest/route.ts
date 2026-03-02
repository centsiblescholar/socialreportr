// =============================================================================
// Daily Digest Agent — Main API Route
// =============================================================================
// Path: /api/daily-digest
//
// This is the orchestrator. It runs all four data fetchers in parallel,
// catches individual failures gracefully (so one broken API doesn't kill
// the whole briefing), and sends the digest via Resend.
//
// ENDPOINTS:
//   GET  /api/daily-digest          — Cron trigger (requires CRON_SECRET)
//   POST /api/daily-digest          — Manual trigger (requires CRON_SECRET)
//   GET  /api/daily-digest?manual=1 — Manual trigger via browser link in email
//
// SECURITY:
// The route is protected by a CRON_SECRET header check. Vercel's cron system
// sends this automatically. For manual triggers, you'll need to include it
// in the Authorization header or use the signed browser link approach.
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { fetchGoogleAdsMetrics } from '@/lib/digest/google-ads';
import { fetchMetaAdsMetrics } from '@/lib/digest/meta-ads';
import { fetchGA4Metrics } from '@/lib/digest/ga4';
import { fetchStripeMetrics } from '@/lib/digest/stripe-data';
import { buildBriefingEmail } from '@/lib/digest/email-template';
import {
  MorningBriefing,
  BriefingError,
  GoogleAdsMetrics,
  MetaAdsMetrics,
  GA4Metrics,
  StripeMetrics,
} from '@/lib/digest/types';

// -- Auth check ---------------------------------------------------------------

function isAuthorized(req: NextRequest): boolean {
  // Vercel Cron sends this header automatically when configured
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.warn('CRON_SECRET not set — rejecting all requests');
    return false;
  }

  // Support both "Bearer <secret>" format and direct header match
  if (authHeader === `Bearer ${cronSecret}`) return true;

  // Also check the Vercel-specific cron header
  // Vercel automatically verifies cron requests in production
  const vercelCronHeader = req.headers.get('x-vercel-cron');
  if (vercelCronHeader) return true;

  // Manual trigger via signed URL (for the "Refresh Now" link in emails)
  const url = new URL(req.url);
  const manualSecret = url.searchParams.get('secret');
  if (manualSecret === cronSecret) return true;

  return false;
}

// -- Feature flags ------------------------------------------------------------
// Enable/disable individual data sources. Useful during initial setup when
// you might not have all four APIs configured yet. Set any of these to "false"
// in your Vercel env vars to skip that source.

function isEnabled(envVar: string): boolean {
  const value = process.env[envVar];
  return value !== 'false' && value !== '0';
}

// -- Main handler -------------------------------------------------------------

export async function GET(req: NextRequest) {
  return handleDigest(req);
}

export async function POST(req: NextRequest) {
  return handleDigest(req);
}

async function handleDigest(req: NextRequest): Promise<NextResponse> {
  // Auth check
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log(`[Daily Digest] Starting at ${new Date().toISOString()}`);
  const startTime = Date.now();

  const errors: BriefingError[] = [];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const reportDate = yesterday.toISOString().split('T')[0];

  // -- Parallel data fetching -------------------------------------------------
  // Using Promise.all with safeFetch so one failure doesn't kill the whole report.
  // Each source is independently try/caught and adds to the errors array
  // if it fails, so you always get a partial briefing at minimum.

  type FetchResult<T> = { data: T | null; error: BriefingError | null };

  async function safeFetch<T>(
    source: BriefingError['source'],
    enabled: boolean,
    fetcher: () => Promise<T>
  ): Promise<FetchResult<T>> {
    if (!enabled) {
      console.log(`[Daily Digest] ${source} is disabled, skipping`);
      return { data: null, error: null };
    }

    try {
      console.log(`[Daily Digest] Fetching ${source}...`);
      const data = await fetcher();
      console.log(`[Daily Digest] ${source} done`);
      return { data, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[Daily Digest] ${source} FAILED:`, message);
      return {
        data: null,
        error: {
          source,
          message: message.slice(0, 500), // Truncate long error messages
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  // Fire all four in parallel
  const [googleAdsResult, metaAdsResult, ga4Result, stripeResult] =
    await Promise.all([
      safeFetch<GoogleAdsMetrics>(
        'google_ads',
        isEnabled('ENABLE_GOOGLE_ADS'),
        fetchGoogleAdsMetrics
      ),
      safeFetch<MetaAdsMetrics>(
        'meta_ads',
        isEnabled('ENABLE_META_ADS'),
        fetchMetaAdsMetrics
      ),
      safeFetch<GA4Metrics>(
        'ga4',
        isEnabled('ENABLE_GA4'),
        fetchGA4Metrics
      ),
      safeFetch<StripeMetrics>(
        'stripe',
        isEnabled('ENABLE_STRIPE'),
        fetchStripeMetrics
      ),
    ]);

  // Collect errors
  [googleAdsResult, metaAdsResult, ga4Result, stripeResult].forEach((r) => {
    if (r.error) errors.push(r.error);
  });

  // -- Assemble the briefing --------------------------------------------------

  const briefing: MorningBriefing = {
    generatedAt: new Date().toISOString(),
    reportDate,
    googleAds: googleAdsResult.data,
    metaAds: metaAdsResult.data,
    ga4: ga4Result.data,
    stripe: stripeResult.data,
    errors,
  };

  // -- Send email via Resend --------------------------------------------------

  const resendApiKey = process.env.RESEND_API_KEY;
  const recipientEmails = (process.env.DIGEST_TO_EMAIL || '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);

  if (!resendApiKey) {
    console.error('[Daily Digest] RESEND_API_KEY not set');
    return NextResponse.json(
      {
        success: false,
        error: 'RESEND_API_KEY not configured',
        briefing, // Still return the data even if email fails
      },
      { status: 500 }
    );
  }

  if (recipientEmails.length === 0) {
    console.error('[Daily Digest] No DIGEST_TO_EMAIL configured');
    return NextResponse.json(
      {
        success: false,
        error: 'No recipients configured',
        briefing,
      },
      { status: 500 }
    );
  }

  const { subject, html, text } = buildBriefingEmail(briefing);
  const resend = new Resend(resendApiKey);

  try {
    const emailResult = await resend.emails.send({
      from: process.env.DIGEST_FROM_EMAIL || 'CentsibleScholar <noreply@centsiblescholar.com>',
      to: recipientEmails,
      subject,
      html,
      text,
    });

    const elapsed = Date.now() - startTime;
    console.log(
      `[Daily Digest] Complete in ${elapsed}ms | Errors: ${errors.length} | Email sent to ${recipientEmails.length} recipient(s)`
    );

    return NextResponse.json({
      success: true,
      elapsed: `${elapsed}ms`,
      reportDate,
      errorsCount: errors.length,
      emailId: emailResult.data?.id,
      briefing,
    });
  } catch (emailErr) {
    const message =
      emailErr instanceof Error ? emailErr.message : String(emailErr);
    console.error('[Daily Digest] Email send failed:', message);

    return NextResponse.json(
      {
        success: false,
        error: `Email delivery failed: ${message}`,
        briefing,
      },
      { status: 500 }
    );
  }
}

// -- Vercel-specific config ---------------------------------------------------
// Set max duration to 60s since we're making 4+ external API calls in parallel.
// Default serverless timeout is 10s which is too tight.
export const maxDuration = 60;
