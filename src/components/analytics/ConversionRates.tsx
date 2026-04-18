import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConversionRateData } from "@/types/analytics";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from "recharts";

interface ConversionRatesProps {
  data: ConversionRateData[];
  fullSize?: boolean;
}

const ConversionRates = ({ data, fullSize = false }: ConversionRatesProps) => {
  const { t } = useTranslation();
  const [chartType, setChartType] = useState<"line" | "bar">("line");

  // Calculate average conversion rate
  const averageConversionRate = data.length > 0
    ? data.reduce((sum, item) => sum + item.rate, 0) / data.length
    : 0;

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) {
      return null;
    }

    return (
      <div className="bg-background border rounded-md shadow-md p-3">
        <p className="font-medium">{label}</p>
        <p className="text-sm">
          {t('analytics.conversionRate')}: <span className="font-medium">{payload[0].value.toFixed(1)}%</span>
        </p>
      </div>
    );
  };

  // Get color based on conversion rate compared to average
  const getBarColor = (rate: number) => {
    if (rate >= averageConversionRate * 1.1) return "#10b981"; // Green for above average
    if (rate <= averageConversionRate * 0.9) return "#ef4444"; // Red for below average
    return "#3b82f6"; // Blue for around average
  };

  return (
    <Card className={fullSize ? "col-span-2" : ""}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <div>
            <CardTitle>{t('analytics.conversionRates')}</CardTitle>
            <CardDescription>{t('analytics.conversionRatesDesc')}</CardDescription>
          </div>
          <Tabs defaultValue="line" className="w-[200px]">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="line" onClick={() => setChartType("line")}>
                {t('analytics.lineChart')}
              </TabsTrigger>
              <TabsTrigger value="bar" onClick={() => setChartType("bar")}>
                {t('analytics.barChart')}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <div className={fullSize ? "h-[500px]" : "h-[300px]"}>
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "line" ? (
              <LineChart
                data={data}
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="rate"
                  name={t('analytics.conversionRate')}
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                {/* Reference line for average */}
                <Line
                  type="monotone"
                  dataKey={() => averageConversionRate}
                  name={t('analytics.average')}
                  stroke="#6b7280"
                  strokeDasharray="5 5"
                  strokeWidth={1}
                  dot={false}
                />
              </LineChart>
            ) : (
              <BarChart
                data={data}
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar
                  dataKey="rate"
                  name={t('analytics.conversionRate')}
                  fill="#3b82f6"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry.rate)} />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        <div className="mt-6">
          <div className="bg-muted/30 p-4 rounded-md text-center">
            <p className="text-sm text-muted-foreground">{t('analytics.avgConversionRate')}</p>
            <p className="text-2xl font-bold">
              {averageConversionRate.toFixed(1)}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConversionRates;
