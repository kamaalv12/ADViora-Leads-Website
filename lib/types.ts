import { DigitalInterest, TrackingField } from './constants';

export type DateRangePreset = 'today' | '7days' | 'all' | 'custom';
export type AttributionFilter = 'all' | 'attributed' | 'unattributed';
export type SortOrder = 'latest' | 'oldest';

export interface DashboardMetrics {
  uniqueLeads: number;
  totalEnquiries: number;
  newLeads: number;
  returningLeads: number | 'N/A';
  activeRangeLabel: string;
}

export interface LatestAttributionSummary {
  status: 'attributed' | 'unattributed';
  source?: string;
  medium?: string;
  campaign?: string;
  badgeLabel: string;
  timestamp?: string;
}

export interface LeadTableRow {
  serialNumber: number;
  userId: string;
  name: string;
  phone: string;
  maskedPhone: string;
  email: string;
  latestInterest: string;
  firstEnquiryDate: string;
  latestEnquiryDate: string;
  totalEnquiries: number;
  totalTouchpoints: number;
  primaryAttribution: LatestAttributionSummary;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface LeadsListResponse {
  success: boolean;
  data: {
    metrics: DashboardMetrics;
    leads: LeadTableRow[];
    pagination: PaginationMeta;
  };
}

export interface ServiceEnquiryDetail {
  _id: string;
  interest: string;
  message: string;
  createdAt: string;
}

export interface UtmCampaignDetail {
  _id: string;
  route?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  platform?: string;
  gclid?: string;
  fbclid?: string;
  fbp?: string;
  fbc?: string;
  matchtype?: string;
  network?: string;
  device?: string;
  keyword?: string;
  placement?: string;
  campaignid?: string;
  adgroupid?: string;
  hasAttributionEvidence: boolean;
  createdAt: string;
}

export interface UserDetailProfile {
  _id: string;
  name: string;
  email: string;
  phone: string;
  countryCode: string;
  timezone: string;
  status: string;
  createdAt: string;
}

export interface LeadDetailResponse {
  success: boolean;
  data: {
    user: UserDetailProfile;
    enquiries: {
      items: ServiceEnquiryDetail[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
    touchpoints: {
      items: UtmCampaignDetail[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export interface FilterOptionsResponse {
  success: boolean;
  data: {
    interests: DigitalInterest[];
    sources: string[];
    mediums: string[];
    campaigns: string[];
    truncated: {
      sources: boolean;
      mediums: boolean;
      campaigns: boolean;
    };
  };
}
