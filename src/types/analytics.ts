// Types for the analytics features

export type LeadStatus = 'inquiry' | 'contacted' | 'meeting_scheduled' | 'proposal_sent' | 'contract_sent' | 'converted' | 'lost';

export type LeadSource = 'website' | 'referral' | 'social_media' | 'wedding_fair' | 'advertisement' | 'other';

export interface Lead {
  id: string;
  name: string;
  partnerName?: string;
  email?: string;
  phone?: string;
  weddingDate?: Date | string;
  venue?: string;
  estimatedBudget?: number;
  notes?: string;
  status: LeadStatus;
  source: LeadSource;
  firstContactDate: Date | string;
  lastContactDate?: Date | string;
  convertedDate?: Date | string;
  lostDate?: Date | string;
  lostReason?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface RevenueForecast {
  id: string;
  forecastDate: Date | string;
  confirmedRevenue: number;
  projectedRevenue: number;
  potentialRevenue: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface RevenueSource {
  id: string;
  sourceName: string;
  sourceType: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface RevenueEntry {
  id: string;
  clientId?: string;
  invoiceId?: string;
  sourceId?: string;
  entryDate: Date | string;
  amount: number;
  description?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  // Joined data
  clientName?: string;
  sourceName?: string;
}

export interface BusinessMetric {
  id: string;
  metricDate: Date | string;
  newLeads: number;
  convertedLeads: number;
  conversionRate: number;
  averageWeddingValue: number;
  totalRevenue: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface PopularService {
  id: string;
  serviceName: string;
  requestCount: number;
  month: number;
  year: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Analytics dashboard data types
export interface RevenueChartData {
  month: string;
  confirmed: number;
  projected: number;
  potential: number;
}

export interface ClientAcquisitionData {
  month: string;
  newLeads: number;
  convertedLeads: number;
}

export interface ConversionRateData {
  month: string;
  rate: number;
}

export interface PopularServiceData {
  name: string;
  count: number;
  percentage: number;
}

export interface SeasonalTrendData {
  month: string;
  weddingCount: number;
  averageValue: number;
}

export interface AnalyticsDashboardData {
  revenueForecasts: RevenueChartData[];
  clientAcquisition: ClientAcquisitionData[];
  conversionRates: ConversionRateData[];
  popularServices: PopularServiceData[];
  seasonalTrends: SeasonalTrendData[];
  totalMetrics: {
    totalRevenue: number;
    averageWeddingValue: number;
    leadConversionRate: number;
    activeLeads: number;
    upcomingWeddings: number;
  };
}
