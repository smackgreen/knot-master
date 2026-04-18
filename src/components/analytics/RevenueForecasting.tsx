import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RevenueChartData } from "@/types/analytics";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area
} from "recharts";

interface RevenueForecastingProps {
  data: RevenueChartData[];
  fullSize?: boolean;
}

const RevenueForecasting = ({ data, fullSize = false }: RevenueForecastingProps) => {
  const { t } = useTranslation();
  const [chartType, setChartType] = useState<"bar" | "line" | "area">("bar");

  // Custom tooltip formatter
  const formatTooltipValue = (value: number) => {
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-md shadow-md p-3">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={`tooltip-${index}`} className="flex items-center gap-2 mt-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm">
                {entry.name}: {formatTooltipValue(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={fullSize ? "col-span-2" : ""}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{t('analytics.revenueForecasting')}</CardTitle>
            <CardDescription>{t('analytics.revenueForecastingDesc')}</CardDescription>
          </div>
          <Tabs value={chartType} onValueChange={(value) => setChartType(value as any)}>
            <TabsList className="grid grid-cols-3 h-8">
              <TabsTrigger value="bar" className="text-xs">{t('analytics.barChart')}</TabsTrigger>
              <TabsTrigger value="line" className="text-xs">{t('analytics.lineChart')}</TabsTrigger>
              <TabsTrigger value="area" className="text-xs">{t('analytics.areaChart')}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <div className={fullSize ? "h-[500px]" : "h-[300px]"}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis 
                tickFormatter={(value) => 
                  value.toLocaleString('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                    notation: 'compact'
                  })
                }
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {chartType === "bar" && (
                <>
                  <Bar 
                    dataKey="confirmed" 
                    name={t('analytics.confirmedRevenue')} 
                    fill="#10b981" 
                    stackId="a"
                  />
                  <Bar 
                    dataKey="projected" 
                    name={t('analytics.projectedRevenue')} 
                    fill="#3b82f6" 
                    stackId="a"
                  />
                  <Bar 
                    dataKey="potential" 
                    name={t('analytics.potentialRevenue')} 
                    fill="#8b5cf6" 
                    stackId="a"
                  />
                </>
              )}
              
              {chartType === "line" && (
                <>
                  <Line 
                    type="monotone" 
                    dataKey="confirmed" 
                    name={t('analytics.confirmedRevenue')} 
                    stroke="#10b981" 
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="projected" 
                    name={t('analytics.projectedRevenue')} 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="potential" 
                    name={t('analytics.potentialRevenue')} 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                  />
                </>
              )}
              
              {chartType === "area" && (
                <>
                  <Area 
                    type="monotone" 
                    dataKey="confirmed" 
                    name={t('analytics.confirmedRevenue')} 
                    fill="#10b981" 
                    stroke="#10b981"
                    fillOpacity={0.6}
                    stackId="1"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="projected" 
                    name={t('analytics.projectedRevenue')} 
                    fill="#3b82f6" 
                    stroke="#3b82f6"
                    fillOpacity={0.6}
                    stackId="1"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="potential" 
                    name={t('analytics.potentialRevenue')} 
                    fill="#8b5cf6" 
                    stroke="#8b5cf6"
                    fillOpacity={0.6}
                    stackId="1"
                  />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default RevenueForecasting;
