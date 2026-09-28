/**
 * ADViora Leads Operations Dashboard Constants
 */

// Single Authoritative Business Timezone
export const APP_TIMEZONE = 'Asia/Kolkata';

// Verified Digital Service Interests from ADViora Landing Page
export const ALLOWED_DIGITAL_INTERESTS = [
  'Business transformation',
  'ITSM / AI / digital transformation',
  'Professional training',
] as const;

export type DigitalInterest = (typeof ALLOWED_DIGITAL_INTERESTS)[number];

// All 17 Verified Tracking Fields Captured by Main Website
export const ALL_17_TRACKING_FIELDS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'platform',
  'gclid',
  'fbclid',
  'fbp',
  'fbc',
  'matchtype',
  'network',
  'device',
  'keyword',
  'placement',
  'campaignid',
  'adgroupid',
] as const;

export type TrackingField = (typeof ALL_17_TRACKING_FIELDS)[number];

/**
 * Fields that qualify as active marketing attribution evidence.
 *
 * NOTE:
 * - Direct UTMs: utm_source, utm_medium, utm_campaign, utm_content, utm_term
 * - Paid Click IDs: gclid, fbclid, fbc
 * - Platform & Campaign IDs: platform, campaignid, adgroupid, placement
 * - Contextual targeting: keyword, matchtype, network
 *
 * EXCLUDED FROM ATTRIBUTION EVIDENCE:
 * - fbp: Meta browser cookie identifier (not ad attribution proof)
 * - device: Hardware type (mobile/desktop), not marketing attribution
 * - clientIp, userAgent: Infrastructure telemetry, strictly excluded from display & export
 */
export const ATTRIBUTION_EVIDENCE_FIELDS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'platform',
  'gclid',
  'fbclid',
  'fbc',
  'campaignid',
  'adgroupid',
  'placement',
  'keyword',
  'matchtype',
  'network',
] as const;

export const MAX_CSV_EXPORT_LIMIT = 1000;
export const DEFAULT_PAGE_SIZE = 25;
export const ALLOWED_PAGE_SIZES = [10, 25, 50, 100] as const;

export const DB_QUERY_TIMEOUT_MS = 5000;
export const DB_EXPORT_TIMEOUT_MS = 10000;
