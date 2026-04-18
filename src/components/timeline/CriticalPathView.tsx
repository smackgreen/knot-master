import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertTriangle, Clock, ArrowRight } from "lucide-react";
import { format, parseISO, differenceInMinutes } from "date-fns";
import { WeddingDayEvent } from "@/types/timeline";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ReferenceLine
} from "recharts";

interface CriticalPathViewProps {
  clientId: string;
  events: WeddingDayEvent[];
}

interface CriticalPathNode {
  id: string;
  title: string;
  startTime: Date | string;
  endTime: Date | string;
  duration: number;
  slack: number;
  isCritical: boolean;
  position: number;
}

const CriticalPathView = ({ clientId, events }: CriticalPathViewProps) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  // Filter critical path events
  const criticalPathEvents = useMemo(() => {
    return events.filter(event => event.isCriticalPath)
      .sort((a, b) => {
        const dateA = new Date(a.startTime).getTime();
        const dateB = new Date(b.startTime).getTime();
        return dateA - dateB;
      });
  }, [events]);

  // Prepare data for visualization
  const criticalPathData = useMemo(() => {
    if (!criticalPathEvents.length) return [];

    return criticalPathEvents.map((event, index) => {
      const startDate = typeof event.startTime === 'string' ? parseISO(event.startTime) : event.startTime;
      const endDate = typeof event.endTime === 'string' ? parseISO(event.endTime) : event.endTime;
      const duration = differenceInMinutes(endDate, startDate);
      
      return {
        id: event.id,
        title: event.title,
        startTime: event.startTime,
        endTime: event.endTime,
        duration,
        slack: 0, // Assuming critical path events have zero slack
        isCritical: true,
        position: index
      };
    });
  }, [criticalPathEvents]);

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) {
      return null;
    }

    const data = payload[0].payload as CriticalPathNode;
    const startTime = typeof data.startTime === 'string' 
      ? format(parseISO(data.startTime), 'h:mm a')
      : format(data.startTime, 'h:mm a');
    
    const endTime = typeof data.endTime === 'string'
      ? format(parseISO(data.endTime), 'h:mm a')
      : format(data.endTime, 'h:mm a');

    return (
      <div className="bg-background border rounded-md shadow-md p-3 max-w-xs">
        <h4 className="font-semibold mb-1">{data.title}</h4>
        <div className="text-sm space-y-1">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{startTime} - {endTime}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">{t('timeline.duration')}:</span>
            <span>{data.duration} {t('timeline.minutes')}</span>
          </div>
          <div className="flex items-center gap-1 text-red-500">
            <AlertTriangle className="h-3 w-3" />
            <span>{t('timeline.criticalPath')}</span>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin">
          <Clock className="h-8 w-8 text-primary" />
        </div>
      </div>
    );
  }

  if (!criticalPathEvents.length) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">{t('timeline.noCriticalPathEvents')}</p>
        <p className="text-sm text-muted-foreground mt-2">{t('timeline.criticalPathDescription')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
          <div>
            <h3 className="font-medium text-amber-800">{t('timeline.criticalPathWarning')}</h3>
            <p className="text-sm text-amber-700 mt-1">{t('timeline.criticalPathDescription')}</p>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={criticalPathData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="position" 
                  tickFormatter={(value) => criticalPathData[value]?.title.substring(0, 10) + '...' || ''}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  label={{ value: t('timeline.duration') + ' (' + t('timeline.minutes') + ')', angle: -90, position: 'insideLeft' }}
                />
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="duration" 
                  name={t('timeline.duration')} 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">{t('timeline.criticalPathSequence')}</h3>
        
        {criticalPathEvents.map((event, index) => (
          <div key={event.id} className="flex items-start">
            <div className="flex flex-col items-center mr-4">
              <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center font-bold">
                {index + 1}
              </div>
              {index < criticalPathEvents.length - 1 && (
                <div className="h-8 w-0.5 bg-red-200 my-1"></div>
              )}
            </div>
            
            <Card className="flex-1 border-l-4 border-l-red-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold">{event.title}</h4>
                  <Badge variant="destructive" className="h-5 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {t('timeline.criticalPath')}
                  </Badge>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  <div className="flex items-center gap-1 mb-1">
                    <Clock className="h-4 w-4" />
                    <span>
                      {format(new Date(event.startTime), 'h:mm a')} - {format(new Date(event.endTime), 'h:mm a')}
                    </span>
                  </div>
                  
                  {event.location && (
                    <div className="flex items-center gap-1 mb-1">
                      <span>{event.location}</span>
                    </div>
                  )}
                </div>
                
                {event.description && (
                  <p className="text-sm mt-2">{event.description}</p>
                )}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CriticalPathView;
