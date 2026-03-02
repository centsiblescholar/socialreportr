// =============================================================================
// Daily Digest Agent — GA4 Data Fetcher
// =============================================================================
// Docs: https://developers.google.com/analytics/devguides/reporting/data/v1
//
// SETUP REQUIRED:
// 1. Enable "Google Analytics Data API" in your GCP project
//    https://console.cloud.google.com/apis/library/analyticsdata.googleapis.com
// 2. Grant your service account "Viewer" role on the GA4 property
//    (GA4 Admin > Property Access Management > Add the service account email)
// 3. Set env vars: GA4_PROPERTY_ID (numeric, e.g., "123456789")
//    Uses the same GOOGLE_SERVICE_ACCOUNT_JSON as the Google Ads fetcher
//
// NOTE: GA4 Data API is free with generous quotas (10,000 requests/day).
// This agent uses 4 requests per run.
// =============================================================================

import { GA4Metrics, PageMetric, TrafficSource, ConversionEvent } from './types';

/**
 * Reuse the same JWT-based auth from the Google Ads module, but with the
 * GA4 analytics scope. We inline it here to keep each module self-contained,
 * but in production you might extract this to a shared google-auth.ts util.
 */
async function getAccessToken(): Promise<string> {
  const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!);

  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const claimSet = {
    iss: serviceAccount.client_email,
    // This scope covers both GA4 Data API and Admin API
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

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

  const encoder = new TextEncoder();
  const toBase64Url = (data: string | Uint8Array) => {
    const base64 =
      typeof data === 'string'
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
 * Helper to call the GA4 Data API runReport endpoint.
 * Returns the raw response JSON for flexible parsing.
 */
async function runReport(
  propertyId: string,
  accessToken: string,
  body: Record<string, unknown>
): Promise<any> {
  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`GA4 Data API error (${res.status}): ${error}`);
  }

  return res.json();
}

/**
 * Pull yesterday's GA4 metrics in four requests:
 * 1. Core metrics (users, sessions, page views, bounce rate)
 * 2. Top pages by pageviews
 * 3. Traffic sources
 * 4. Conversion events (key events)
 */
export async function fetchGA4Metrics(): Promise<GA4Metrics> {
  const propertyId = process.env.GA4_PROPERTY_ID!;
  const accessToken = await getAccessToken();

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().split('T')[0];

  // -- Report 1: Core metrics -------------------------------------------------
  const coreReport = await runReport(propertyId, accessToken, {
    dateRanges: [{ startDate: 'yesterday', endDate: 'yesterday' }],
    metrics: [
      { name: 'activeUsers' },
      { name: 'sessions' },
      { name: 'screenPageViews' },
      { name: 'averageSessionDuration' },
      { name: 'bounceRate' },
    ],
  });

  // Parse the single-row core metrics response
  const coreRow = coreReport.rows?.[0]?.metricValues || [];
  const activeUsers = parseInt(coreRow[0]?.value || '0');
  const sessions = parseInt(coreRow[1]?.value || '0');
  const pageViews = parseInt(coreRow[2]?.value || '0');
  const avgSessionDuration = parseFloat(coreRow[3]?.value || '0');
  const bounceRate = parseFloat(coreRow[4]?.value || '0');

  // -- Report 2: Top pages ----------------------------------------------------
  const pagesReport = await runReport(propertyId, accessToken, {
    dateRanges: [{ startDate: 'yesterday', endDate: 'yesterday' }],
    dimensions: [{ name: 'pagePath' }],
    metrics: [
      { name: 'screenPageViews' },
      { name: 'userEngagementDuration' },
    ],
    orderBys: [
      { metric: { metricName: 'screenPageViews' }, desc: true },
    ],
    limit: 10,
  });

  const topPages: PageMetric[] = (pagesReport.rows || []).map(
    (row: any) => ({
      path: row.dimensionValues[0].value,
      views: parseInt(row.metricValues[0].value || '0'),
      avgEngagementTime: parseFloat(row.metricValues[1].value || '0'),
    })
  );

  // -- Report 3: Traffic sources ----------------------------------------------
  const trafficReport = await runReport(propertyId, accessToken, {
    dateRanges: [{ startDate: 'yesterday', endDate: 'yesterday' }],
    dimensions: [
      { name: 'sessionSource' },
      { name: 'sessionMedium' },
    ],
    metrics: [
      { name: 'sessions' },
      { name: 'activeUsers' },
    ],
    orderBys: [
      { metric: { metricName: 'sessions' }, desc: true },
    ],
    limit: 10,
  });

  const trafficSources: TrafficSource[] = (trafficReport.rows || []).map(
    (row: any) => ({
      source: row.dimensionValues[0].value,
      medium: row.dimensionValues[1].value,
      sessions: parseInt(row.metricValues[0].value || '0'),
      users: parseInt(row.metricValues[1].value || '0'),
    })
  );

  // -- Report 4: Conversion events --------------------------------------------
  // GA4 treats any event you mark as a "conversion" (now called "key event")
  // as a conversion. This pulls all key events from yesterday.
  const conversionReport = await runReport(propertyId, accessToken, {
    dateRanges: [{ startDate: 'yesterday', endDate: 'yesterday' }],
    dimensions: [{ name: 'eventName' }],
    metrics: [{ name: 'keyEvents' }],
    orderBys: [
      { metric: { metricName: 'keyEvents' }, desc: true },
    ],
    limit: 10,
  });

  const conversionEvents: ConversionEvent[] = (
    conversionReport.rows || []
  )
    .filter((row: any) => parseInt(row.metricValues[0].value || '0') > 0)
    .map((row: any) => ({
      eventName: row.dimensionValues[0].value,
      count: parseInt(row.metricValues[0].value || '0'),
    }));

  return {
    date: dateStr,
    activeUsers,
    sessions,
    pageViews,
    avgSessionDuration,
    bounceRate,
    topPages,
    trafficSources,
    conversionEvents,
  };
}
