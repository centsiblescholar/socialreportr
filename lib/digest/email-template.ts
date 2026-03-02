// =============================================================================
// Daily Digest Agent — Email Template
// =============================================================================
// Generates a clean, mobile-responsive HTML email from the aggregated data.
// Designed to be scanned in 30 seconds — key numbers at the top, details below.
//
// Uses inline CSS throughout because most email clients (Gmail, Outlook, Apple
// Mail) strip <style> blocks. This is ugly code but necessary for email.
// =============================================================================

import {
  MorningBriefing,
  GoogleAdsMetrics,
  MetaAdsMetrics,
  GA4Metrics,
  StripeMetrics,
  BriefingError,
} from './types';

// -- Formatting helpers -------------------------------------------------------

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

function formatPercent(rate: number, alreadyPercent = false): string {
  const value = alreadyPercent ? rate : rate * 100;
  return `${value.toFixed(1)}%`;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

// -- Color indicators for quick scanning --------------------------------------

/** Green/red/gray based on whether a metric is positive, negative, or neutral */
function metricColor(value: number, goodDirection: 'up' | 'down' = 'up'): string {
  if (value === 0) return '#6B7280'; // gray
  if (goodDirection === 'up') return value > 0 ? '#059669' : '#DC2626';
  return value < 0 ? '#059669' : '#DC2626';
}

// -- Section builders ---------------------------------------------------------

function buildScorecard(briefing: MorningBriefing): string {
  // Top-of-email KPI cards — the 30-second executive summary
  const cards: Array<{ label: string; value: string; color: string }> = [];

  if (briefing.stripe) {
    cards.push({
      label: 'Revenue',
      value: formatCurrency(briefing.stripe.grossRevenue),
      color: '#059669',
    });
    cards.push({
      label: 'Payments',
      value: formatNumber(briefing.stripe.successfulPayments),
      color: '#2563EB',
    });
  }

  if (briefing.ga4) {
    cards.push({
      label: 'Active Users',
      value: formatNumber(briefing.ga4.activeUsers),
      color: '#7C3AED',
    });
    cards.push({
      label: 'Sessions',
      value: formatNumber(briefing.ga4.sessions),
      color: '#7C3AED',
    });
  }

  const totalAdSpend =
    (briefing.googleAds?.totalSpend || 0) + (briefing.metaAds?.totalSpend || 0);
  if (totalAdSpend > 0) {
    cards.push({
      label: 'Total Ad Spend',
      value: formatCurrency(totalAdSpend),
      color: '#DC2626',
    });
  }

  if (briefing.googleAds) {
    cards.push({
      label: 'Google Ads Clicks',
      value: formatNumber(briefing.googleAds.clicks),
      color: '#EA4335',
    });
  }

  if (briefing.metaAds) {
    cards.push({
      label: 'Meta Link Clicks',
      value: formatNumber(briefing.metaAds.linkClicks),
      color: '#1877F2',
    });
  }

  // Render cards in a 2-column grid
  const cardHtml = cards
    .map(
      (card) => `
    <td style="width:50%;padding:6px;">
      <div style="background:#F9FAFB;border-left:4px solid ${card.color};padding:12px 16px;border-radius:4px;">
        <div style="font-size:12px;color:#6B7280;text-transform:uppercase;letter-spacing:0.5px;">${card.label}</div>
        <div style="font-size:24px;font-weight:700;color:#111827;margin-top:4px;">${card.value}</div>
      </div>
    </td>`
    )
    .reduce((rows, card, i) => {
      if (i % 2 === 0) rows.push([]);
      rows[rows.length - 1].push(card);
      return rows;
    }, [] as string[][])
    .map((pair) => `<tr>${pair.join('')}${pair.length === 1 ? '<td></td>' : ''}</tr>`)
    .join('');

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      ${cardHtml}
    </table>`;
}

function buildStripeSection(data: StripeMetrics): string {
  const transactionRows = data.topTransactions
    .map(
      (t) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #F3F4F6;font-size:13px;">${t.description || t.id}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #F3F4F6;font-size:13px;text-align:right;font-weight:600;">${formatCurrency(t.amount)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #F3F4F6;font-size:13px;text-align:center;">
          <span style="background:#D1FAE5;color:#065F46;padding:2px 8px;border-radius:12px;font-size:11px;">${t.status}</span>
        </td>
      </tr>`
    )
    .join('');

  return `
    <div style="margin-bottom:24px;">
      <h2 style="font-size:16px;color:#111827;margin:0 0 12px;padding-bottom:8px;border-bottom:2px solid #059669;">
        💰 Stripe Revenue
      </h2>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
        <tr>
          <td style="padding:4px 0;font-size:14px;color:#374151;">Gross Revenue</td>
          <td style="padding:4px 0;font-size:14px;color:#111827;font-weight:600;text-align:right;">${formatCurrency(data.grossRevenue)}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:14px;color:#374151;">Net Revenue (est.)</td>
          <td style="padding:4px 0;font-size:14px;color:#111827;font-weight:600;text-align:right;">${formatCurrency(data.netRevenue)}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:14px;color:#374151;">Successful Payments</td>
          <td style="padding:4px 0;font-size:14px;color:#059669;font-weight:600;text-align:right;">${formatNumber(data.successfulPayments)}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:14px;color:#374151;">Failed Payments</td>
          <td style="padding:4px 0;font-size:14px;color:${data.failedPayments > 0 ? '#DC2626' : '#6B7280'};font-weight:600;text-align:right;">${formatNumber(data.failedPayments)}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:14px;color:#374151;">New Customers</td>
          <td style="padding:4px 0;font-size:14px;color:#111827;font-weight:600;text-align:right;">${formatNumber(data.newCustomers)}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:14px;color:#374151;">Refunds</td>
          <td style="padding:4px 0;font-size:14px;color:${data.totalRefunds > 0 ? '#DC2626' : '#6B7280'};font-weight:600;text-align:right;">${formatNumber(data.totalRefunds)} (${formatCurrency(data.refundAmount)})</td>
        </tr>
      </table>
      ${data.topTransactions.length > 0 ? `
        <div style="font-size:13px;color:#6B7280;margin-bottom:8px;">Top Transactions</div>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;border-radius:4px;">
          <tr>
            <td style="padding:8px 12px;font-size:11px;color:#6B7280;text-transform:uppercase;border-bottom:1px solid #E5E7EB;">Description</td>
            <td style="padding:8px 12px;font-size:11px;color:#6B7280;text-transform:uppercase;text-align:right;border-bottom:1px solid #E5E7EB;">Amount</td>
            <td style="padding:8px 12px;font-size:11px;color:#6B7280;text-transform:uppercase;text-align:center;border-bottom:1px solid #E5E7EB;">Status</td>
          </tr>
          ${transactionRows}
        </table>
      ` : ''}
    </div>`;
}

function buildGA4Section(data: GA4Metrics): string {
  const topPagesRows = data.topPages
    .slice(0, 5)
    .map(
      (p) => `
      <tr>
        <td style="padding:6px 12px;border-bottom:1px solid #F3F4F6;font-size:13px;font-family:monospace;">${p.path}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #F3F4F6;font-size:13px;text-align:right;">${formatNumber(p.views)}</td>
      </tr>`
    )
    .join('');

  const trafficRows = data.trafficSources
    .slice(0, 5)
    .map(
      (t) => `
      <tr>
        <td style="padding:6px 12px;border-bottom:1px solid #F3F4F6;font-size:13px;">${t.source} / ${t.medium}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #F3F4F6;font-size:13px;text-align:right;">${formatNumber(t.sessions)}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #F3F4F6;font-size:13px;text-align:right;">${formatNumber(t.users)}</td>
      </tr>`
    )
    .join('');

  const conversionRows = data.conversionEvents
    .map(
      (e) => `
      <tr>
        <td style="padding:6px 12px;border-bottom:1px solid #F3F4F6;font-size:13px;">${e.eventName}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #F3F4F6;font-size:13px;text-align:right;font-weight:600;">${formatNumber(e.count)}</td>
      </tr>`
    )
    .join('');

  return `
    <div style="margin-bottom:24px;">
      <h2 style="font-size:16px;color:#111827;margin:0 0 12px;padding-bottom:8px;border-bottom:2px solid #7C3AED;">
        📊 Google Analytics
      </h2>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
        <tr>
          <td style="padding:4px 0;font-size:14px;color:#374151;">Active Users</td>
          <td style="padding:4px 0;font-size:14px;color:#111827;font-weight:600;text-align:right;">${formatNumber(data.activeUsers)}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:14px;color:#374151;">Sessions</td>
          <td style="padding:4px 0;font-size:14px;color:#111827;font-weight:600;text-align:right;">${formatNumber(data.sessions)}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:14px;color:#374151;">Page Views</td>
          <td style="padding:4px 0;font-size:14px;color:#111827;font-weight:600;text-align:right;">${formatNumber(data.pageViews)}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:14px;color:#374151;">Avg. Session Duration</td>
          <td style="padding:4px 0;font-size:14px;color:#111827;font-weight:600;text-align:right;">${formatDuration(data.avgSessionDuration)}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:14px;color:#374151;">Bounce Rate</td>
          <td style="padding:4px 0;font-size:14px;color:#111827;font-weight:600;text-align:right;">${formatPercent(data.bounceRate, true)}</td>
        </tr>
      </table>

      ${data.topPages.length > 0 ? `
        <div style="font-size:13px;color:#6B7280;margin-bottom:8px;">Top Pages</div>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;border-radius:4px;margin-bottom:16px;">
          <tr>
            <td style="padding:6px 12px;font-size:11px;color:#6B7280;text-transform:uppercase;border-bottom:1px solid #E5E7EB;">Path</td>
            <td style="padding:6px 12px;font-size:11px;color:#6B7280;text-transform:uppercase;text-align:right;border-bottom:1px solid #E5E7EB;">Views</td>
          </tr>
          ${topPagesRows}
        </table>
      ` : ''}

      ${data.trafficSources.length > 0 ? `
        <div style="font-size:13px;color:#6B7280;margin-bottom:8px;">Traffic Sources</div>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;border-radius:4px;margin-bottom:16px;">
          <tr>
            <td style="padding:6px 12px;font-size:11px;color:#6B7280;text-transform:uppercase;border-bottom:1px solid #E5E7EB;">Source / Medium</td>
            <td style="padding:6px 12px;font-size:11px;color:#6B7280;text-transform:uppercase;text-align:right;border-bottom:1px solid #E5E7EB;">Sessions</td>
            <td style="padding:6px 12px;font-size:11px;color:#6B7280;text-transform:uppercase;text-align:right;border-bottom:1px solid #E5E7EB;">Users</td>
          </tr>
          ${trafficRows}
        </table>
      ` : ''}

      ${data.conversionEvents.length > 0 ? `
        <div style="font-size:13px;color:#6B7280;margin-bottom:8px;">Key Events (Conversions)</div>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;border-radius:4px;">
          <tr>
            <td style="padding:6px 12px;font-size:11px;color:#6B7280;text-transform:uppercase;border-bottom:1px solid #E5E7EB;">Event</td>
            <td style="padding:6px 12px;font-size:11px;color:#6B7280;text-transform:uppercase;text-align:right;border-bottom:1px solid #E5E7EB;">Count</td>
          </tr>
          ${conversionRows}
        </table>
      ` : ''}
    </div>`;
}

function buildGoogleAdsSection(data: GoogleAdsMetrics): string {
  const campaignRows = data.campaigns
    .slice(0, 10)
    .map(
      (c) => `
      <tr>
        <td style="padding:6px 12px;border-bottom:1px solid #F3F4F6;font-size:13px;">${c.name}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #F3F4F6;font-size:13px;text-align:right;">${formatCurrency(c.spend)}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #F3F4F6;font-size:13px;text-align:right;">${formatNumber(c.clicks)}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #F3F4F6;font-size:13px;text-align:right;">${formatPercent(c.ctr)}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #F3F4F6;font-size:13px;text-align:right;">${c.conversions.toFixed(1)}</td>
      </tr>`
    )
    .join('');

  return `
    <div style="margin-bottom:24px;">
      <h2 style="font-size:16px;color:#111827;margin:0 0 12px;padding-bottom:8px;border-bottom:2px solid #EA4335;">
        🔍 Google Ads
      </h2>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
        <tr>
          <td style="padding:4px 0;font-size:14px;color:#374151;">Total Spend</td>
          <td style="padding:4px 0;font-size:14px;color:#111827;font-weight:600;text-align:right;">${formatCurrency(data.totalSpend)}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:14px;color:#374151;">Impressions</td>
          <td style="padding:4px 0;font-size:14px;color:#111827;font-weight:600;text-align:right;">${formatNumber(data.impressions)}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:14px;color:#374151;">Clicks</td>
          <td style="padding:4px 0;font-size:14px;color:#111827;font-weight:600;text-align:right;">${formatNumber(data.clicks)}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:14px;color:#374151;">CTR</td>
          <td style="padding:4px 0;font-size:14px;color:#111827;font-weight:600;text-align:right;">${formatPercent(data.ctr)}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:14px;color:#374151;">Conversions</td>
          <td style="padding:4px 0;font-size:14px;color:#111827;font-weight:600;text-align:right;">${data.conversions.toFixed(1)}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:14px;color:#374151;">Cost / Conversion</td>
          <td style="padding:4px 0;font-size:14px;color:#111827;font-weight:600;text-align:right;">${data.costPerConversion !== null ? formatCurrency(data.costPerConversion) : '—'}</td>
        </tr>
      </table>

      ${data.campaigns.length > 0 ? `
        <div style="font-size:13px;color:#6B7280;margin-bottom:8px;">Campaigns</div>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;border-radius:4px;">
          <tr>
            <td style="padding:6px 12px;font-size:11px;color:#6B7280;text-transform:uppercase;border-bottom:1px solid #E5E7EB;">Campaign</td>
            <td style="padding:6px 12px;font-size:11px;color:#6B7280;text-transform:uppercase;text-align:right;border-bottom:1px solid #E5E7EB;">Spend</td>
            <td style="padding:6px 12px;font-size:11px;color:#6B7280;text-transform:uppercase;text-align:right;border-bottom:1px solid #E5E7EB;">Clicks</td>
            <td style="padding:6px 12px;font-size:11px;color:#6B7280;text-transform:uppercase;text-align:right;border-bottom:1px solid #E5E7EB;">CTR</td>
            <td style="padding:6px 12px;font-size:11px;color:#6B7280;text-transform:uppercase;text-align:right;border-bottom:1px solid #E5E7EB;">Conv</td>
          </tr>
          ${campaignRows}
        </table>
      ` : ''}
    </div>`;
}

function buildMetaAdsSection(data: MetaAdsMetrics): string {
  const campaignRows = data.campaigns
    .slice(0, 10)
    .map(
      (c) => `
      <tr>
        <td style="padding:6px 12px;border-bottom:1px solid #F3F4F6;font-size:13px;">${c.name}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #F3F4F6;font-size:13px;text-align:right;">${formatCurrency(c.spend)}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #F3F4F6;font-size:13px;text-align:right;">${formatNumber(c.reach)}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #F3F4F6;font-size:13px;text-align:right;">${formatNumber(c.clicks)}</td>
      </tr>`
    )
    .join('');

  return `
    <div style="margin-bottom:24px;">
      <h2 style="font-size:16px;color:#111827;margin:0 0 12px;padding-bottom:8px;border-bottom:2px solid #1877F2;">
        📱 Meta Ads
      </h2>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
        <tr>
          <td style="padding:4px 0;font-size:14px;color:#374151;">Total Spend</td>
          <td style="padding:4px 0;font-size:14px;color:#111827;font-weight:600;text-align:right;">${formatCurrency(data.totalSpend)}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:14px;color:#374151;">Reach</td>
          <td style="padding:4px 0;font-size:14px;color:#111827;font-weight:600;text-align:right;">${formatNumber(data.reach)}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:14px;color:#374151;">Impressions</td>
          <td style="padding:4px 0;font-size:14px;color:#111827;font-weight:600;text-align:right;">${formatNumber(data.impressions)}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:14px;color:#374151;">CPM</td>
          <td style="padding:4px 0;font-size:14px;color:#111827;font-weight:600;text-align:right;">${formatCurrency(data.cpm)}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:14px;color:#374151;">CPC</td>
          <td style="padding:4px 0;font-size:14px;color:#111827;font-weight:600;text-align:right;">${formatCurrency(data.cpc)}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:14px;color:#374151;">Link Clicks</td>
          <td style="padding:4px 0;font-size:14px;color:#111827;font-weight:600;text-align:right;">${formatNumber(data.linkClicks)}</td>
        </tr>
      </table>

      ${data.campaigns.length > 0 ? `
        <div style="font-size:13px;color:#6B7280;margin-bottom:8px;">Campaigns</div>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;border-radius:4px;">
          <tr>
            <td style="padding:6px 12px;font-size:11px;color:#6B7280;text-transform:uppercase;border-bottom:1px solid #E5E7EB;">Campaign</td>
            <td style="padding:6px 12px;font-size:11px;color:#6B7280;text-transform:uppercase;text-align:right;border-bottom:1px solid #E5E7EB;">Spend</td>
            <td style="padding:6px 12px;font-size:11px;color:#6B7280;text-transform:uppercase;text-align:right;border-bottom:1px solid #E5E7EB;">Reach</td>
            <td style="padding:6px 12px;font-size:11px;color:#6B7280;text-transform:uppercase;text-align:right;border-bottom:1px solid #E5E7EB;">Clicks</td>
          </tr>
          ${campaignRows}
        </table>
      ` : ''}
    </div>`;
}

function buildErrorsSection(errors: BriefingError[]): string {
  if (errors.length === 0) return '';

  const errorRows = errors
    .map(
      (e) => `
    <tr>
      <td style="padding:6px 12px;border-bottom:1px solid #FEE2E2;font-size:13px;font-weight:600;">${e.source}</td>
      <td style="padding:6px 12px;border-bottom:1px solid #FEE2E2;font-size:13px;">${e.message}</td>
    </tr>`
    )
    .join('');

  return `
    <div style="margin-bottom:24px;background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:16px;">
      <h2 style="font-size:16px;color:#991B1B;margin:0 0 12px;">⚠️ Errors</h2>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${errorRows}
      </table>
    </div>`;
}

// -- Main template builder ----------------------------------------------------

export function buildBriefingEmail(briefing: MorningBriefing): {
  subject: string;
  html: string;
  text: string;
} {
  const dateFormatted = formatDate(briefing.reportDate);

  // Build the plain-text fallback (for email clients that don't render HTML)
  const textParts = [`CentsibleScholar Daily Digest — ${dateFormatted}\n`];

  if (briefing.stripe) {
    textParts.push(`STRIPE: Revenue ${formatCurrency(briefing.stripe.grossRevenue)} | ${briefing.stripe.successfulPayments} payments | ${briefing.stripe.newCustomers} new customers`);
  }
  if (briefing.ga4) {
    textParts.push(`GA4: ${briefing.ga4.activeUsers} active users | ${briefing.ga4.sessions} sessions | ${briefing.ga4.pageViews} page views`);
  }
  if (briefing.googleAds) {
    textParts.push(`GOOGLE ADS: Spend ${formatCurrency(briefing.googleAds.totalSpend)} | ${briefing.googleAds.clicks} clicks | ${briefing.googleAds.conversions.toFixed(1)} conversions`);
  }
  if (briefing.metaAds) {
    textParts.push(`META ADS: Spend ${formatCurrency(briefing.metaAds.totalSpend)} | Reach ${formatNumber(briefing.metaAds.reach)} | ${briefing.metaAds.linkClicks} link clicks`);
  }
  if (briefing.errors.length > 0) {
    textParts.push(`\nERRORS: ${briefing.errors.map((e) => `${e.source}: ${e.message}`).join('; ')}`);
  }

  // Build the subject line with a quick revenue snapshot
  const revenuePart = briefing.stripe
    ? ` | ${formatCurrency(briefing.stripe.grossRevenue)} revenue`
    : '';
  const usersPart = briefing.ga4
    ? ` | ${formatNumber(briefing.ga4.activeUsers)} users`
    : '';
  const subject = `📈 CS Daily${revenuePart}${usersPart} — ${briefing.reportDate}`;

  // Assemble the full HTML email
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Daily Digest</title>
</head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;padding:24px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1E3A5F,#2563EB);padding:24px 32px;">
              <h1 style="margin:0;font-size:22px;color:#FFFFFF;font-weight:700;">
                CentsibleScholar Daily Digest
              </h1>
              <div style="margin-top:4px;font-size:14px;color:#93C5FD;">
                ${dateFormatted}
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:24px 32px;">

              <!-- Errors (if any) -->
              ${buildErrorsSection(briefing.errors)}

              <!-- KPI Scorecard -->
              ${buildScorecard(briefing)}

              <!-- Stripe Section -->
              ${briefing.stripe ? buildStripeSection(briefing.stripe) : ''}

              <!-- GA4 Section -->
              ${briefing.ga4 ? buildGA4Section(briefing.ga4) : ''}

              <!-- Google Ads Section -->
              ${briefing.googleAds ? buildGoogleAdsSection(briefing.googleAds) : ''}

              <!-- Meta Ads Section -->
              ${briefing.metaAds ? buildMetaAdsSection(briefing.metaAds) : ''}

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;background:#F9FAFB;border-top:1px solid #E5E7EB;">
              <div style="font-size:12px;color:#9CA3AF;text-align:center;">
                Generated at ${new Date(briefing.generatedAt).toLocaleString('en-US', { timeZone: 'America/Chicago' })} CT
                <br>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.centsiblescholar.com'}" style="color:#2563EB;text-decoration:none;">Open Dashboard</a>
                &nbsp;·&nbsp;
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.centsiblescholar.com'}/api/daily-digest?manual=true" style="color:#2563EB;text-decoration:none;">Refresh Now</a>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html, text: textParts.join('\n') };
}
