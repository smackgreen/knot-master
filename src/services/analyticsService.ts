import { supabase } from '@/integrations/supabase/client';
import {
  Lead,
  LeadStatus,
  LeadSource,
  RevenueForecast,
  RevenueSource,
  RevenueEntry,
  BusinessMetric,
  PopularService,
  AnalyticsDashboardData,
  RevenueChartData,
  ClientAcquisitionData,
  ConversionRateData,
  PopularServiceData,
  SeasonalTrendData
} from '@/types/analytics';
import { format, subMonths } from 'date-fns';

// Fetch leads with optional filters
export const fetchLeads = async (
  status?: LeadStatus,
  source?: LeadSource,
  startDate?: string,
  endDate?: string
): Promise<Lead[]> => {
  let query = supabase
    .from('leads')
    .select('*');

  if (status) {
    query = query.eq('status', status);
  }

  if (source) {
    query = query.eq('source', source);
  }

  if (startDate) {
    query = query.gte('created_at', startDate);
  }

  if (endDate) {
    query = query.lte('created_at', endDate);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching leads:', error);
    throw error;
  }

  return data.map(lead => ({
    id: lead.id,
    name: lead.name,
    partnerName: lead.partner_name,
    email: lead.email,
    phone: lead.phone,
    weddingDate: lead.wedding_date,
    venue: lead.venue,
    estimatedBudget: lead.estimated_budget,
    notes: lead.notes,
    status: lead.status,
    source: lead.source,
    firstContactDate: lead.first_contact_date,
    lastContactDate: lead.last_contact_date,
    convertedDate: lead.converted_date,
    lostDate: lead.lost_date,
    lostReason: lead.lost_reason,
    createdAt: lead.created_at,
    updatedAt: lead.updated_at
  }));
};

// Create a new lead
export const createLead = async (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Promise<Lead> => {
  const { data, error } = await supabase
    .from('leads')
    .insert({
      name: lead.name,
      partner_name: lead.partnerName,
      email: lead.email,
      phone: lead.phone,
      wedding_date: lead.weddingDate,
      venue: lead.venue,
      estimated_budget: lead.estimatedBudget,
      notes: lead.notes,
      status: lead.status,
      source: lead.source,
      first_contact_date: lead.firstContactDate,
      last_contact_date: lead.lastContactDate,
      converted_date: lead.convertedDate,
      lost_date: lead.lostDate,
      lost_reason: lead.lostReason
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating lead:', error);
    throw error;
  }

  return {
    id: data.id,
    name: data.name,
    partnerName: data.partner_name,
    email: data.email,
    phone: data.phone,
    weddingDate: data.wedding_date,
    venue: data.venue,
    estimatedBudget: data.estimated_budget,
    notes: data.notes,
    status: data.status,
    source: data.source,
    firstContactDate: data.first_contact_date,
    lastContactDate: data.last_contact_date,
    convertedDate: data.converted_date,
    lostDate: data.lost_date,
    lostReason: data.lost_reason,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
};

// Update lead status
export const updateLeadStatus = async (
  leadId: string,
  status: LeadStatus,
  additionalData: Partial<Lead> = {}
): Promise<void> => {
  const updates: Record<string, any> = { status };

  // Add additional fields based on the status change
  if (status === 'converted') {
    updates.converted_date = new Date().toISOString().split('T')[0];
  } else if (status === 'lost') {
    updates.lost_date = new Date().toISOString().split('T')[0];
    if (additionalData.lostReason) {
      updates.lost_reason = additionalData.lostReason;
    }
  }

  // Add any other additional data
  Object.entries(additionalData).forEach(([key, value]) => {
    if (key === 'lostReason') {
      updates.lost_reason = value;
    } else if (key === 'lastContactDate') {
      updates.last_contact_date = value;
    }
    // Add other field mappings as needed
  });

  const { error } = await supabase
    .from('leads')
    .update(updates)
    .eq('id', leadId);

  if (error) {
    console.error('Error updating lead status:', error);
    throw error;
  }
};

// Fetch revenue forecasts for a date range
export const fetchRevenueForecasts = async (
  startDate: string,
  endDate: string
): Promise<RevenueForecast[]> => {
  const { data, error } = await supabase
    .from('revenue_forecasts')
    .select('*')
    .gte('forecast_date', startDate)
    .lte('forecast_date', endDate)
    .order('forecast_date');

  if (error) {
    console.error('Error fetching revenue forecasts:', error);
    throw error;
  }

  return data.map(forecast => ({
    id: forecast.id,
    forecastDate: forecast.forecast_date,
    confirmedRevenue: forecast.confirmed_revenue,
    projectedRevenue: forecast.projected_revenue,
    potentialRevenue: forecast.potential_revenue,
    createdAt: forecast.created_at,
    updatedAt: forecast.updated_at
  }));
};

// Fetch analytics dashboard data
export const fetchAnalyticsDashboardData = async (
  months: number = 12
): Promise<AnalyticsDashboardData> => {
  const endDate = new Date();
  const startDate = subMonths(endDate, months);

  // Format dates for database queries
  const startDateStr = format(startDate, 'yyyy-MM-dd');
  const endDateStr = format(endDate, 'yyyy-MM-dd');

  // Fetch all the required data in parallel
  const [
    revenueForecasts,
    leads,
    businessMetrics,
    popularServices,
    clients,
    invoices
  ] = await Promise.all([
    fetchRevenueForecasts(startDateStr, endDateStr),
    fetchLeads(undefined, undefined, startDateStr, endDateStr),
    fetchBusinessMetrics(startDateStr, endDateStr),
    fetchPopularServices(startDateStr, endDateStr),
    fetchClients(startDateStr, endDateStr),
    fetchInvoices(startDateStr, endDateStr)
  ]);

  // Process the data into the required format
  const revenueChartData = processRevenueForecasts(revenueForecasts);
  const clientAcquisitionData = processClientAcquisition(leads, businessMetrics);
  const conversionRateData = processConversionRates(businessMetrics);
  const popularServicesData = processPopularServices(popularServices);
  const seasonalTrendsData = processSeasonalTrends(clients, invoices);

  // Calculate total metrics
  const totalMetrics = calculateTotalMetrics(
    businessMetrics,
    leads,
    clients
  );

  return {
    revenueForecasts: revenueChartData,
    clientAcquisition: clientAcquisitionData,
    conversionRates: conversionRateData,
    popularServices: popularServicesData,
    seasonalTrends: seasonalTrendsData,
    totalMetrics
  };
};

// Helper functions for processing data
function processRevenueForecasts(forecasts: RevenueForecast[]): RevenueChartData[] {
  return forecasts.map(forecast => ({
    month: format(new Date(forecast.forecastDate), 'MMM yyyy'),
    confirmed: forecast.confirmedRevenue,
    projected: forecast.projectedRevenue,
    potential: forecast.potentialRevenue
  }));
}

async function fetchBusinessMetrics(startDate: string, endDate: string): Promise<BusinessMetric[]> {
  const { data, error } = await supabase
    .from('business_metrics')
    .select('*')
    .gte('metric_date', startDate)
    .lte('metric_date', endDate)
    .order('metric_date');

  if (error) {
    console.error('Error fetching business metrics:', error);
    throw error;
  }

  if (!data) return [];

  return data.map(metric => ({
    id: metric.id,
    metricDate: metric.metric_date,
    newLeads: Number(metric.new_leads) || 0,
    convertedLeads: Number(metric.converted_leads) || 0,
    conversionRate: Number(metric.conversion_rate) || 0,
    averageWeddingValue: Number(metric.average_wedding_value) || 0,
    totalRevenue: Number(metric.total_revenue) || 0,
    createdAt: metric.created_at,
    updatedAt: metric.updated_at
  }));
}

async function fetchPopularServices(startDate: string, endDate: string): Promise<PopularService[]> {
  // Parse the start and end dates to extract month and year
  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);

  const startMonth = startDateObj.getMonth() + 1; // 1-12 format
  const startYear = startDateObj.getFullYear();

  const endMonth = endDateObj.getMonth() + 1; // 1-12 format
  const endYear = endDateObj.getFullYear();

  // Build a query that filters by month and year as integers
  let query = supabase
    .from('popular_services')
    .select('*');

  // Handle filtering across years
  if (startYear === endYear) {
    // Same year, filter by month range
    query = query
      .eq('year', startYear)
      .gte('month', startMonth)
      .lte('month', endMonth);
  } else {
    // Different years, more complex filtering
    query = query.or(
      `year.gt.${startYear},year.lt.${endYear}` + // Middle years (if any)
      `,and(year.eq.${startYear},month.gte.${startMonth})` + // Start year
      `,and(year.eq.${endYear},month.lte.${endMonth})` // End year
    );
  }

  // Order by request count
  query = query.order('request_count', { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching popular services:', error);
    throw error;
  }

  if (!data) return [];

  return data.map(service => ({
    id: service.id,
    serviceName: service.service_name,
    requestCount: service.request_count,
    month: service.month, // Already in 1-12 format
    year: service.year,
    createdAt: service.created_at,
    updatedAt: service.updated_at
  }));
}

async function fetchClients(startDate: string, endDate: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at');

  if (error) {
    console.error('Error fetching clients:', error);
    throw error;
  }

  return data || [];
}

async function fetchInvoices(startDate: string, endDate: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      invoice_items(*)
    `)
    .gte('issue_date', startDate)
    .lte('issue_date', endDate)
    .order('issue_date');

  if (error) {
    console.error('Error fetching invoices:', error);
    throw error;
  }

  return data || [];
}

function processClientAcquisition(leads: Lead[], metrics: BusinessMetric[]): ClientAcquisitionData[] {
  // If we have metrics data, use that first
  if (metrics.length > 0) {
    // Group metrics by month
    const metricsByMonth = metrics.reduce((acc, metric) => {
      const date = new Date(metric.metricDate);
      const monthKey = format(date, 'MMM yyyy');

      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthKey,
          newLeads: 0,
          convertedLeads: 0
        };
      }

      if (metric.newLeads) acc[monthKey].newLeads += metric.newLeads;
      if (metric.convertedLeads) acc[monthKey].convertedLeads += metric.convertedLeads;

      return acc;
    }, {} as Record<string, ClientAcquisitionData>);

    return Object.values(metricsByMonth);
  }

  // If no metrics, use leads data
  if (leads.length > 0) {
    // Group leads by month
    const leadsByMonth = leads.reduce((acc, lead) => {
      const createdDate = new Date(lead.createdAt);
      const monthKey = format(createdDate, 'MMM yyyy');

      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthKey,
          newLeads: 0,
          convertedLeads: 0
        };
      }

      acc[monthKey].newLeads++;
      if (lead.status === 'converted') {
        acc[monthKey].convertedLeads++;
      }

      return acc;
    }, {} as Record<string, ClientAcquisitionData>);

    return Object.values(leadsByMonth);
  }

  // If no data, return empty array
  return [];
}

function processConversionRates(metrics: BusinessMetric[]): ConversionRateData[] {
  if (metrics.length === 0) {
    return [];
  }

  // Group metrics by month and calculate conversion rates
  const conversionRatesByMonth = metrics.reduce((acc, metric) => {
    const date = new Date(metric.metricDate);
    const monthKey = format(date, 'MMM yyyy');

    if (!acc[monthKey]) {
      acc[monthKey] = {
        month: monthKey,
        rate: metric.conversionRate || 0
      };
    } else if (metric.conversionRate) {
      // If we already have a rate for this month, use the latest one
      acc[monthKey].rate = metric.conversionRate;
    }

    return acc;
  }, {} as Record<string, ConversionRateData>);

  // If we don't have direct conversion rate metrics, calculate from leads and conversions
  if (Object.values(conversionRatesByMonth).every(item => item.rate === 0)) {
    const leadsByMonth = metrics.reduce((acc, metric) => {
      const date = new Date(metric.metricDate);
      const monthKey = format(date, 'MMM yyyy');

      if (!acc[monthKey]) {
        acc[monthKey] = {
          newLeads: 0,
          convertedLeads: 0
        };
      }

      if (metric.newLeads) acc[monthKey].newLeads += metric.newLeads;
      if (metric.convertedLeads) acc[monthKey].convertedLeads += metric.convertedLeads;

      return acc;
    }, {} as Record<string, { newLeads: number, convertedLeads: number }>);

    // Calculate conversion rates
    Object.entries(leadsByMonth).forEach(([month, data]) => {
      if (data.newLeads > 0) {
        conversionRatesByMonth[month] = {
          month,
          rate: (data.convertedLeads / data.newLeads) * 100
        };
      }
    });
  }

  return Object.values(conversionRatesByMonth);
}

function processPopularServices(services: PopularService[]): PopularServiceData[] {
  if (services.length === 0) {
    return [];
  }

  // Calculate total request count
  const totalRequests = services.reduce((sum, service) => sum + service.requestCount, 0);

  // Transform to PopularServiceData format
  return services
    .map(service => ({
      name: service.serviceName,
      count: service.requestCount,
      percentage: totalRequests > 0 ? (service.requestCount / totalRequests) * 100 : 0
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8); // Limit to top 8 services
}

function processSeasonalTrends(clients: any[], invoices: any[]): SeasonalTrendData[] {
  // If no data, return empty array
  if (clients.length === 0) {
    return [];
  }

  // Group clients by wedding month
  const weddingsByMonth = clients.reduce((acc, client) => {
    if (!client.wedding_date) return acc;

    const weddingDate = new Date(client.wedding_date);
    const monthKey = format(weddingDate, 'MMM');

    if (!acc[monthKey]) {
      acc[monthKey] = {
        month: monthKey,
        weddingCount: 0,
        totalValue: 0
      };
    }

    acc[monthKey].weddingCount++;

    // Find invoices for this client
    const clientInvoices = invoices.filter(inv => inv.client_id === client.id && inv.status === 'paid');
    const clientValue = clientInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);

    acc[monthKey].totalValue += clientValue;

    return acc;
  }, {} as Record<string, { month: string, weddingCount: number, totalValue: number }>);

  // Transform to SeasonalTrendData format
  return Object.values(weddingsByMonth).map(data => ({
    month: data.month,
    weddingCount: data.weddingCount,
    averageValue: data.weddingCount > 0 ? data.totalValue / data.weddingCount : 0
  }));
}

function calculateTotalMetrics(
  metrics: BusinessMetric[],
  leads: Lead[],
  clients: any[]
): AnalyticsDashboardData['totalMetrics'] {
  // Default values
  let totalRevenue = 0;
  let averageWeddingValue = 0;
  let leadConversionRate = 0;
  let activeLeads = 0;
  let upcomingWeddings = 0;

  // Calculate from metrics if available
  if (metrics.length > 0) {
    // Sum up revenue from all months
    totalRevenue = metrics.reduce((sum, metric) => {
      if (metric.totalRevenue) return sum + metric.totalRevenue;
      return sum;
    }, 0);

    // Get average wedding value from metrics
    const weddingValueMetrics = metrics.filter(m => m.averageWeddingValue > 0);
    if (weddingValueMetrics.length > 0) {
      averageWeddingValue = weddingValueMetrics.reduce((sum, m) => sum + m.averageWeddingValue, 0) / weddingValueMetrics.length;
    }

    // Get conversion rate from metrics
    const conversionRateMetrics = metrics.filter(m => m.conversionRate > 0);
    if (conversionRateMetrics.length > 0) {
      leadConversionRate = conversionRateMetrics.reduce((sum, m) => sum + m.conversionRate, 0) / conversionRateMetrics.length;
    }
  }

  // Calculate active leads
  activeLeads = leads.filter(lead =>
    lead.status !== 'converted' && lead.status !== 'lost'
  ).length;

  // Calculate upcoming weddings
  const today = new Date();
  upcomingWeddings = clients.filter(client => {
    if (!client.wedding_date) return false;
    const weddingDate = new Date(client.wedding_date);
    return weddingDate >= today;
  }).length;

  // If we don't have metrics data but have leads, calculate conversion rate
  if (leadConversionRate === 0 && leads.length > 0) {
    const convertedLeads = leads.filter(lead => lead.status === 'converted').length;
    leadConversionRate = leads.length > 0 ? (convertedLeads / leads.length) * 100 : 0;
  }

  return {
    totalRevenue,
    averageWeddingValue,
    leadConversionRate,
    activeLeads,
    upcomingWeddings
  };
}
