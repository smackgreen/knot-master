import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SeasonalTrendData } from "@/types/analytics";
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

interface SeasonalTrendsProps {
  data: SeasonalTrendData[];
  fullSize?: boolean;
}

const SeasonalTrends = ({ data, fullSize = false }: SeasonalTrendsProps) => {
  const { t } = useTranslation();
  const [chartType, setChartType] = useState<"bar" | "line" | "area">("bar");

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) {
      return null;
    }

    return (
      <div className="bg-background border rounded-md shadow-md p-3">
        <p className="font-medium">{label}</p>
        <p className="text-sm">
          {t('analytics.weddingCount')}: <span className="font-medium">{payload[0].payload.weddingCount}</span>
        </p>
        <p className="text-sm">
          {t('analytics.averageValue')}: <span className="font-medium">
            {payload[0].payload.averageValue.toLocaleString('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            })}
          </span>
        </p>
      </div>
    );
  };

  return (
    <Card className={fullSize ? "col-span-2" : ""}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <div>
            <CardTitle>{t('analytics.seasonalTrends')}</CardTitle>
            <CardDescription>{t('analytics.seasonalTrendsDesc')}</CardDescription>
          </div>
          <Tabs defaultValue="bar" className="w-[250px]">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="bar" onClick={() => setChartType("bar")}>
                {t('analytics.barChart')}
              </TabsTrigger>
              <TabsTrigger value="line" onClick={() => setChartType("line")}>
                {t('analytics.lineChart')}
              </TabsTrigger>
              <TabsTrigger value="area" onClick={() => setChartType("area")}>
                {t('analytics.areaChart')}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-[300px]">
            <p className="text-muted-foreground">{t('analytics.noDataAvailable')}</p>
          </div>
        ) : (
          <div className={fullSize ? "h-[500px]" : "h-[300px]"}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={data}
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis 
                  yAxisId="left"
                  orientation="left"
                  label={{ value: t('analytics.weddingCount'), angle: -90, position: 'insideLeft' }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  tickFormatter={(value) => 
                    value.toLocaleString('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                      notation: 'compact'
                    })
                  }
                  label={{ value: t('analytics.averageValue'), angle: 90, position: 'insideRight' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                
                {chartType === "bar" && (
                  <>
                    <Bar 
                      yAxisId="left"
                      dataKey="weddingCount" 
                      name={t('analytics.weddingCount')} 
                      fill="#3b82f6" 
                      barSize={20}
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="averageValue" 
                      name={t('analytics.averageValue')} 
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </>
                )}
                
                {chartType === "line" && (
                  <>
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="weddingCount" 
                      name={t('analytics.weddingCount')} 
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="averageValue" 
                      name={t('analytics.averageValue')} 
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </>
                )}
                
                {chartType === "area" && (
                  <>
                    <Area 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="weddingCount" 
                      name={t('analytics.weddingCount')} 
                      fill="#3b82f6" 
                      stroke="#3b82f6"
                      fillOpacity={0.6}
                    />
                    <Area 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="averageValue" 
                      name={t('analytics.averageValue')} 
                      fill="#ef4444" 
                      stroke="#ef4444"
                      fillOpacity={0.6}
                    />
                  </>
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-muted/30 p-4 rounded-md text-center">
            <p className="text-sm text-muted-foreground">{t('analytics.peakMonth')}</p>
            <p className="text-2xl font-bold">
              {data.length > 0 
                ? data.reduce((max, item) => item.weddingCount > max.weddingCount ? item : max, data[0]).month
                : '-'
              }
            </p>
          </div>
          <div className="bg-muted/30 p-4 rounded-md text-center">
            <p className="text-sm text-muted-foreground">{t('analytics.highestValueMonth')}</p>
            <p className="text-2xl font-bold">
              {data.length > 0 
                ? data.reduce((max, item) => item.averageValue > max.averageValue ? item : max, data[0]).month
                : '-'
              }
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SeasonalTrends;
