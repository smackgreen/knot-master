import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PopularServiceData } from "@/types/analytics";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";

interface PopularServicesProps {
  data: PopularServiceData[];
  fullSize?: boolean;
}

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'];

const PopularServices = ({ data, fullSize = false }: PopularServicesProps) => {
  const { t } = useTranslation();
  const [chartType, setChartType] = useState<"pie" | "bar">("pie");

  // Sort data by count in descending order
  const sortedData = [...data].sort((a, b) => b.count - a.count);

  // Custom tooltip for pie chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) {
      return null;
    }

    const data = payload[0].payload;
    return (
      <div className="bg-background border rounded-md shadow-md p-3">
        <p className="font-medium">{data.name}</p>
        <p className="text-sm">
          {t('analytics.count')}: <span className="font-medium">{data.count}</span>
        </p>
        <p className="text-sm">
          {t('analytics.percentage')}: <span className="font-medium">{data.percentage.toFixed(1)}%</span>
        </p>
      </div>
    );
  };

  return (
    <Card className={fullSize ? "col-span-2" : ""}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <div>
            <CardTitle>{t('analytics.popularServices')}</CardTitle>
            <CardDescription>{t('analytics.popularServicesDesc')}</CardDescription>
          </div>
          <Tabs defaultValue="pie" className="w-[200px]">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pie" onClick={() => setChartType("pie")}>
                {t('analytics.pieChart')}
              </TabsTrigger>
              <TabsTrigger value="bar" onClick={() => setChartType("bar")}>
                {t('analytics.barChart')}
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
              {chartType === "pie" ? (
                <PieChart>
                  <Pie
                    data={sortedData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={fullSize ? 180 : 100}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  >
                    {sortedData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              ) : (
                <BarChart
                  data={sortedData}
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={100}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar 
                    dataKey="count" 
                    name={t('analytics.bookingCount')} 
                    fill="#3b82f6"
                  >
                    {sortedData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        )}

        {data.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium mb-2">{t('analytics.topServices')}</h4>
            <div className="space-y-2">
              {sortedData.slice(0, 5).map((service, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <span className="text-sm">{service.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{service.count}</span>
                    <span className="text-xs text-muted-foreground">({service.percentage.toFixed(1)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PopularServices;
