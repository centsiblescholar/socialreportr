// =============================================================================
// Daily Digest Agent — Shared Types
// =============================================================================

export interface GoogleAdsMetrics {
  date: string;
  totalSpend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  costPerConversion: number | null;
  campaigns: CampaignMetrics[];
}

export interface CampaignMetrics {
  name: string;
  status: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
}

export interface MetaAdsMetrics {
  date: string;
  totalSpend: number;
  reach: number;
  impressions: number;
  cpm: number;
  cpc: number;
  linkClicks: number;
  campaigns: MetaCampaignMetrics[];
}

export interface MetaCampaignMetrics {
  name: string;
  spend: number;
  reach: number;
  impressions: number;
  clicks: number;
}

export interface GA4Metrics {
  date: string;
  activeUsers: number;
  sessions: number;
  pageViews: number;
  avgSessionDuration: number; // in seconds
  bounceRate: number;
  topPages: PageMetric[];
  trafficSources: TrafficSource[];
  conversionEvents: ConversionEvent[];
}

export interface PageMetric {
  path: string;
  views: number;
  avgEngagementTime: number;
}

export interface TrafficSource {
  source: string;
  medium: string;
  sessions: number;
  users: number;
}

export interface ConversionEvent {
  eventName: string;
  count: number;
}

export interface StripeMetrics {
  date: string;
  grossRevenue: number;        // in dollars
  netRevenue: number;          // after fees
  successfulPayments: number;
  failedPayments: number;
  newCustomers: number;
  totalRefunds: number;
  refundAmount: number;
  topTransactions: StripeTransaction[];
}

export interface StripeTransaction {
  id: string;
  amount: number;
  currency: string;
  description: string | null;
  customerEmail: string | null;
  status: string;
}

export interface MorningBriefing {
  generatedAt: string;
  reportDate: string;
  googleAds: GoogleAdsMetrics | null;
  metaAds: MetaAdsMetrics | null;
  ga4: GA4Metrics | null;
  stripe: StripeMetrics | null;
  errors: BriefingError[];
}

export interface BriefingError {
  source: 'google_ads' | 'meta_ads' | 'ga4' | 'stripe';
  message: string;
  timestamp: string;
}
