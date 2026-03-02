// =============================================================================
// Daily Digest Agent — Stripe Data Fetcher
// =============================================================================
// Docs: https://docs.stripe.com/api
//
// SETUP REQUIRED:
// 1. Set env var: STRIPE_SECRET_KEY (your sk_live_... or sk_test_... key)
//
// NOTE: We use the Stripe REST API directly rather than the stripe npm SDK
// to keep the Edge Function bundle lean. The SDK adds ~500KB to the bundle
// which can cause cold start issues on serverless. For four API calls,
// raw fetch is perfectly fine and actually more readable.
// =============================================================================

import { StripeMetrics, StripeTransaction } from './types';

const STRIPE_API_BASE = 'https://api.stripe.com/v1';

/**
 * Helper for authenticated Stripe API requests.
 * Stripe uses HTTP Basic Auth with the secret key as the username.
 */
async function stripeGet(
  endpoint: string,
  params?: Record<string, string>
): Promise<any> {
  const url = new URL(`${STRIPE_API_BASE}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, val]) =>
      url.searchParams.set(key, val)
    );
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY!}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Stripe API error (${res.status}): ${error}`);
  }

  return res.json();
}

/**
 * Get Unix timestamps for the start and end of yesterday in UTC.
 * Stripe filters use Unix timestamps, not ISO dates.
 */
function getYesterdayRange(): { start: number; end: number; dateStr: string } {
  const now = new Date();

  // Start of yesterday (midnight UTC)
  const startOfYesterday = new Date(now);
  startOfYesterday.setUTCDate(startOfYesterday.getUTCDate() - 1);
  startOfYesterday.setUTCHours(0, 0, 0, 0);

  // End of yesterday (23:59:59 UTC)
  const endOfYesterday = new Date(startOfYesterday);
  endOfYesterday.setUTCHours(23, 59, 59, 999);

  return {
    start: Math.floor(startOfYesterday.getTime() / 1000),
    end: Math.floor(endOfYesterday.getTime() / 1000),
    dateStr: startOfYesterday.toISOString().split('T')[0],
  };
}

/**
 * Pull yesterday's Stripe metrics across multiple endpoints:
 * - Payment intents (for success/fail counts + revenue)
 * - Customers (new signups)
 * - Refunds
 *
 * Each fetch is independent so we run them in parallel with Promise.allSettled
 * to avoid one failure killing the entire Stripe report.
 */
export async function fetchStripeMetrics(): Promise<StripeMetrics> {
  const { start, end, dateStr } = getYesterdayRange();

  // Run all three fetches in parallel
  const [
    paymentsResult,
    customersResult,
    refundsResult,
  ] = await Promise.allSettled([
    // Successful and failed payment intents from yesterday
    stripeGet('/payment_intents', {
      'created[gte]': start.toString(),
      'created[lte]': end.toString(),
      limit: '100',
    }),
    // New customers created yesterday
    stripeGet('/customers', {
      'created[gte]': start.toString(),
      'created[lte]': end.toString(),
      limit: '100',
    }),
    // Refunds issued yesterday
    stripeGet('/refunds', {
      'created[gte]': start.toString(),
      'created[lte]': end.toString(),
      limit: '100',
    }),
  ]);

  // -- Parse payment intents --------------------------------------------------
  let grossRevenue = 0;
  let successfulPayments = 0;
  let failedPayments = 0;
  const topTransactions: StripeTransaction[] = [];

  if (paymentsResult.status === 'fulfilled') {
    const payments = paymentsResult.value.data || [];

    for (const pi of payments) {
      if (pi.status === 'succeeded') {
        successfulPayments++;
        // Stripe amounts are in cents (minor units)
        grossRevenue += pi.amount / 100;

        // Collect top 5 transactions for the briefing
        if (topTransactions.length < 5) {
          topTransactions.push({
            id: pi.id,
            amount: pi.amount / 100,
            currency: pi.currency.toUpperCase(),
            description: pi.description,
            customerEmail: null, // We'd need an extra API call per customer
            status: pi.status,
          });
        }
      } else if (
        pi.status === 'requires_payment_method' ||
        pi.status === 'canceled'
      ) {
        failedPayments++;
      }
    }
  }

  // -- Parse new customers ----------------------------------------------------
  let newCustomers = 0;
  if (customersResult.status === 'fulfilled') {
    newCustomers = customersResult.value.data?.length || 0;
  }

  // -- Parse refunds ----------------------------------------------------------
  let totalRefunds = 0;
  let refundAmount = 0;
  if (refundsResult.status === 'fulfilled') {
    const refunds = refundsResult.value.data || [];
    totalRefunds = refunds.length;
    refundAmount = refunds.reduce(
      (sum: number, r: any) => sum + (r.amount || 0) / 100,
      0
    );
  }

  // Estimate net revenue (gross - refunds - ~2.9% + $0.30 Stripe fee)
  // This is an approximation; exact fees are in balance transactions
  const estimatedFees = successfulPayments > 0
    ? grossRevenue * 0.029 + successfulPayments * 0.3
    : 0;
  const netRevenue = grossRevenue - refundAmount - estimatedFees;

  return {
    date: dateStr,
    grossRevenue,
    netRevenue: Math.max(0, netRevenue), // Don't go negative from fee estimates
    successfulPayments,
    failedPayments,
    newCustomers,
    totalRefunds,
    refundAmount,
    topTransactions,
  };
}
