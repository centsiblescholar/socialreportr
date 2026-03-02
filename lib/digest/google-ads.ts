// =============================================================================
// Daily Digest Agent — Google Ads Data Fetcher
// =============================================================================
// Docs: https://developers.google.com/google-ads/api/docs/start
//
// SETUP REQUIRED:
// 1. Apply for Google Ads API developer token (takes 1-3 days for basic access)
//    https://developers.google.com/google-ads/api/docs/get-started/dev-token
// 2. Create a service account in GCP and grant it access to your Ads account
// 3. Set env vars: GOOGLE_ADS_DEVELOPER_TOKEN, GOOGLE_ADS_CUSTOMER_ID,
//    GOOGLE_SERVICE_ACCOUNT_JSON (stringified JSON key)
// 4. Optional: GOOGLE_ADS_LOGIN_CUSTOMER_ID if using a manager account
// =============================================================================

import { GoogleAdsMetrics, CampaignMetrics } from './types';

const GOOGLE_ADS_API_VERSION = 'v17'; // Latest stable as of 2025

interface GoogleAdsRow {
  campaign: {
    name: string;
    status: string;
  };
  metrics: {
    costMicros: string;
    impressions: string;
    clicks: string;
    ctr: string;
    conversions: string;
    costPerConversion: string;
  };
}

/**
 * Fetch an OAuth2 access token using the service account credentials.
 * We use the JWT grant flow directly to avoid needing the full googleapis SDK,
 * keeping the Edge Function bundle size small.
 */
async function getAccessToken(): Promise<string> {
  const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!);

  // Build JWT header and claim set
  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const claimSet = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/adwords',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  // Import the private key for signing
  const pemKey = serviceAccount.private_key;
  const keyData = pemKey
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\n/g, '');

  const binaryKey = Uint8Array.from(atob(keyData), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  // Encode and sign the JWT
  const encoder = new TextEncoder();
  const toBase64Url = (data: string | Uint8Array) => {
    const base64 = typeof data === 'string'
      ? btoa(data)
      : btoa(String.fromCharCode(...data));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };

  const headerB64 = toBase64Url(JSON.stringify(header));
  const claimB64 = toBase64Url(JSON.stringify(claimSet));
  const signingInput = `${headerB64}.${claimB64}`;

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    encoder.encode(signingInput)
  );

  const signatureB64 = toBase64Url(new Uint8Array(signature));
  const jwt = `${signingInput}.${signatureB64}`;

  // Exchange JWT for access token
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!tokenRes.ok) {
    const error = await tokenRes.text();
    throw new Error(`Google OAuth failed: ${error}`);
  }

  const tokenData = await tokenRes.json();
  return tokenData.access_token;
}

/**
 * Pull yesterday's Google Ads metrics via the GAQL (Google Ads Query Language).
 * We query at the campaign level to get both totals and per-campaign breakdowns.
 */
export async function fetchGoogleAdsMetrics(): Promise<GoogleAdsMetrics> {
  const accessToken = await getAccessToken();
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID!.replace(/-/g, '');
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN!;

  // Calculate yesterday's date in YYYY-MM-DD format
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().split('T')[0];

  // GAQL query — pulls campaign-level metrics for yesterday
  const query = `
    SELECT
      campaign.name,
      campaign.status,
      metrics.cost_micros,
      metrics.impressions,
      metrics.clicks,
      metrics.ctr,
      metrics.conversions,
      metrics.cost_per_conversion
    FROM campaign
    WHERE segments.date = '${dateStr}'
      AND campaign.status != 'REMOVED'
    ORDER BY metrics.cost_micros DESC
  `;

  const url = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}/customers/${customerId}/googleAds:search`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    'developer-token': developerToken,
    'Content-Type': 'application/json',
  };

  // If using a manager account, include the login customer ID
  if (process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID) {
    headers['login-customer-id'] = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID.replace(/-/g, '');
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google Ads API error (${response.status}): ${error}`);
  }

  const data = await response.json();
  const rows: GoogleAdsRow[] = data.results || [];

  // Aggregate campaign-level data into totals
  const campaigns: CampaignMetrics[] = rows.map((row) => ({
    name: row.campaign.name,
    status: row.campaign.status,
    spend: parseInt(row.metrics.costMicros) / 1_000_000,  // micros -> dollars
    impressions: parseInt(row.metrics.impressions),
    clicks: parseInt(row.metrics.clicks),
    ctr: parseFloat(row.metrics.ctr),
    conversions: parseFloat(row.metrics.conversions),
  }));

  const totalSpend = campaigns.reduce((sum, c) => sum + c.spend, 0);
  const totalImpressions = campaigns.reduce((sum, c) => sum + c.impressions, 0);
  const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0);
  const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0);

  return {
    date: dateStr,
    totalSpend,
    impressions: totalImpressions,
    clicks: totalClicks,
    ctr: totalClicks > 0 ? totalClicks / totalImpressions : 0,
    conversions: totalConversions,
    costPerConversion: totalConversions > 0 ? totalSpend / totalConversions : null,
    campaigns,
  };
}
