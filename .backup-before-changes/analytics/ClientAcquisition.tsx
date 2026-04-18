import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientAcquisitionData } from "@/types/analytics";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Line,
  ComposedChart
} from "recharts";

interface ClientAcquisitionProps {
  data: ClientAcquisitionData[];
  fullSize?: boolean;
}

const ClientAcquisition = ({ data, fullSize = false }: ClientAcquisitionProps) => {
  const { t } = useTranslation();

  // Calculate month-over-month growth
  const dataWithGrowth = data.map((item, index, array) => {
    if (index === 0) {
      return {
        ...item,
        growthRate: 0
      };
    }
    
    const prevMonth = array[index - 1];
    const growthRate = prevMonth.convertedLeads > 0
      ? ((item.convertedLeads - prevMonth.convertedLeads) / prevMonth.convertedLeads) * 100
      : 0;
    
    return {
      ...item,
      growthRate: parseFloat(growthRate.toFixed(1))
    };
  });

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
                {entry.name}: {entry.value}
                {entry.dataKey === 'growthRate' ? '%' : ''}
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
        <CardTitle>{t('analytics.clientAcquisition')}</CardTitle>
        <CardDescription>{t('analytics.clientAcquisitionDesc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className={fullSize ? "h-[500px]" : "h-[300px]"}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={dataWithGrowth}
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis 
                yAxisId="left"
                orientation="left"
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                domain={[-100, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                yAxisId="left"
                dataKey="newLeads" 
                name={t('analytics.newLeads')} 
                fill="#f59e0b" 
                barSize={fullSize ? 20 : 15}
              />
              <Bar 
                yAxisId="left"
                dataKey="convertedLeads" 
                name={t('analytics.convertedLeads')} 
                fill="#10b981" 
                barSize={fullSize ? 20 : 15}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="growthRate" 
                name={t('analytics.monthOverMonthGrowth')} 
                stroke="#8b5cf6" 
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientAcquisition;
