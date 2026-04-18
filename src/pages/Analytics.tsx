import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Download, TrendingUp, Users, BarChart3, Calendar } from "lucide-react";
import { fetchAnalyticsDashboardData } from "@/services/analyticsService";
import { AnalyticsDashboardData } from "@/types/analytics";
import RevenueForecasting from "@/components/analytics/RevenueForecasting";
import ClientAcquisition from "@/components/analytics/ClientAcquisition";
import ConversionRates from "@/components/analytics/ConversionRates";
import PopularServices from "@/components/analytics/PopularServices";
import SeasonalTrends from "@/components/analytics/SeasonalTrends";
import LeadManagement from "@/components/analytics/LeadManagement";
import { toast } from "@/components/ui/use-toast";

const Analytics = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("overview");
  const [timeRange, setTimeRange] = useState("12");
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsDashboardData | null>(null);

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAnalyticsDashboardData(parseInt(timeRange));
      setAnalyticsData(data);
    } catch (error) {
      console.error("Error loading analytics data:", error);
      toast({
        title: t('common.error'),
        description: t('analytics.errorLoadingData'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const handleExportData = () => {
    // Implementation for exporting data
    console.log("Exporting analytics data...");
    toast({
      title: t('analytics.exportStarted'),
      description: t('analytics.exportInProgress'),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('analytics.title')}</h1>
          <p className="text-muted-foreground">{t('analytics.description')}</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('analytics.selectTimeRange')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">{t('analytics.threeMonths')}</SelectItem>
              <SelectItem value="6">{t('analytics.sixMonths')}</SelectItem>
              <SelectItem value="12">{t('analytics.oneYear')}</SelectItem>
              <SelectItem value="24">{t('analytics.twoYears')}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExportData}>
            <Download className="mr-2 h-4 w-4" />
            {t('analytics.exportData')}
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mr-4">
              <TrendingUp className="text-primary h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('analytics.totalRevenue')}</p>
              <h2 className="text-2xl font-bold">
                {analyticsData?.totalMetrics.totalRevenue.toLocaleString('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                })}
              </h2>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mr-4">
              <Users className="text-primary h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('analytics.conversionRate')}</p>
              <h2 className="text-2xl font-bold">
                {analyticsData?.totalMetrics.leadConversionRate.toFixed(1)}%
              </h2>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mr-4">
              <BarChart3 className="text-primary h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('analytics.averageWeddingValue')}</p>
              <h2 className="text-2xl font-bold">
                {analyticsData?.totalMetrics.averageWeddingValue.toLocaleString('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                })}
              </h2>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mr-4">
              <Calendar className="text-primary h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('analytics.upcomingWeddings')}</p>
              <h2 className="text-2xl font-bold">
                {analyticsData?.totalMetrics.upcomingWeddings}
              </h2>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="overview">{t('analytics.overview')}</TabsTrigger>
          <TabsTrigger value="revenue">{t('analytics.revenue')}</TabsTrigger>
          <TabsTrigger value="clients">{t('analytics.clients')}</TabsTrigger>
          <TabsTrigger value="leads">{t('analytics.leads')}</TabsTrigger>
          <TabsTrigger value="services">{t('analytics.services')}</TabsTrigger>
          <TabsTrigger value="seasonal">{t('analytics.seasonal')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <RevenueForecasting data={analyticsData?.revenueForecasts || []} />
            <ClientAcquisition data={analyticsData?.clientAcquisition || []} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ConversionRates data={analyticsData?.conversionRates || []} />
            <PopularServices data={analyticsData?.popularServices || []} />
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="mt-6">
          <RevenueForecasting data={analyticsData?.revenueForecasts || []} fullSize />
        </TabsContent>

        <TabsContent value="clients" className="mt-6">
          <ClientAcquisition data={analyticsData?.clientAcquisition || []} fullSize />
        </TabsContent>

        <TabsContent value="leads" className="mt-6">
          <LeadManagement />
        </TabsContent>

        <TabsContent value="services" className="mt-6">
          <PopularServices data={analyticsData?.popularServices || []} fullSize />
        </TabsContent>

        <TabsContent value="seasonal" className="mt-6">
          <SeasonalTrends data={analyticsData?.seasonalTrends || []} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;
