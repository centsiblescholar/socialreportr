// =============================================================================
// Daily Digest Agent — Meta Ads Data Fetcher
// =============================================================================
// Docs: https://developers.facebook.com/docs/marketing-api/insights
//
// SETUP REQUIRED:
// 1. Create a System User in Meta Business Suite > Business Settings >
//    System Users. This avoids token expiration issues.
// 2. Generate a long-lived token for the system user with ads_read permission
// 3. Set env vars: META_ACCESS_TOKEN, META_AD_ACCOUNT_ID (format: act_XXXXXXX)
//
// WHY SYSTEM USER vs. USER TOKEN:
// Regular user tokens expire in 60 days even with long-lived exchange.
// System User tokens never expire, which is exactly what you want for
// a server-to-server cron job that shouldn't break silently at 2am.
// =============================================================================

import { MetaAdsMetrics, MetaCampaignMetrics } from './types';

const META_API_VERSION = 'v21.0'; // Latest stable as of late 2025

interface MetaInsightRow {
  campaign_name: string;
  spend: string;
  reach: string;
  impressions: string;
  clicks: string;
  cpm: string;
  cpc: string;
  actions?: Array<{ action_type: string; value: string }>;
}

/**
 * Pull yesterday's Meta Ads metrics at the account level first (for totals),
 * then at campaign level for the breakdown.
 *
 * We use `date_preset=yesterday` which is more reliable than manual date ranges
 * because Meta handles timezone conversion for you based on the ad account's
 * configured timezone.
 */
export async function fetchMetaAdsMetrics(): Promise<MetaAdsMetrics> {
  const accessToken = process.env.META_ACCESS_TOKEN!;
  const adAccountId = process.env.META_AD_ACCOUNT_ID!;

  // Calculate yesterday's date for the report label
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().split('T')[0];

  // -- Account-level totals ---------------------------------------------------
  const accountUrl = new URL(
    `https://graph.facebook.com/${META_API_VERSION}/${adAccountId}/insights`
  );
  accountUrl.searchParams.set('access_token', accessToken);
  accountUrl.searchParams.set('date_preset', 'yesterday');
  accountUrl.searchParams.set(
    'fields',
    'spend,reach,impressions,cpm,cpc,actions'
  );

  const accountRes = await fetch(accountUrl.toString());
  if (!accountRes.ok) {
    const error = await accountRes.text();
    throw new Error(`Meta Ads API error (${accountRes.status}): ${error}`);
  }

  const accountData = await accountRes.json();
  const accountRow = accountData.data?.[0];

  // If no data (no active campaigns yesterday), return zeros
  if (!accountRow) {
    return {
      date: dateStr,
      totalSpend: 0,
      reach: 0,
      impressions: 0,
      cpm: 0,
      cpc: 0,
      linkClicks: 0,
      campaigns: [],
    };
  }

  // Extract link clicks from the actions array
  // Meta buries this inside an array of action types rather than a top-level field
  const linkClicks =
    accountRow.actions?.find(
      (a: { action_type: string; value: string }) =>
        a.action_type === 'link_click'
    )?.value || '0';

  // -- Campaign-level breakdown -----------------------------------------------
  const campaignUrl = new URL(
    `https://graph.facebook.com/${META_API_VERSION}/${adAccountId}/insights`
  );
  campaignUrl.searchParams.set('access_token', accessToken);
  campaignUrl.searchParams.set('date_preset', 'yesterday');
  campaignUrl.searchParams.set('level', 'campaign');
  campaignUrl.searchParams.set(
    'fields',
    'campaign_name,spend,reach,impressions,clicks'
  );
  campaignUrl.searchParams.set('sort', 'spend_descending');
  campaignUrl.searchParams.set('limit', '25'); // Top 25 campaigns max

  const campaignRes = await fetch(campaignUrl.toString());
  if (!campaignRes.ok) {
    const error = await campaignRes.text();
    throw new Error(`Meta Ads Campaign API error (${campaignRes.status}): ${error}`);
  }

  const campaignData = await campaignRes.json();
  const campaignRows: MetaInsightRow[] = campaignData.data || [];

  const campaigns: MetaCampaignMetrics[] = campaignRows.map((row) => ({
    name: row.campaign_name,
    spend: parseFloat(row.spend || '0'),
    reach: parseInt(row.reach || '0'),
    impressions: parseInt(row.impressions || '0'),
    clicks: parseInt(row.clicks || '0'),
  }));

  return {
    date: dateStr,
    totalSpend: parseFloat(accountRow.spend || '0'),
    reach: parseInt(accountRow.reach || '0'),
    impressions: parseInt(accountRow.impressions || '0'),
    cpm: parseFloat(accountRow.cpm || '0'),
    cpc: parseFloat(accountRow.cpc || '0'),
    linkClicks: parseInt(linkClicks),
    campaigns,
  };
}
