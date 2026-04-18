import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertTriangle, Clock, MapPin, Users } from "lucide-react";
import { format, parseISO, differenceInMinutes } from "date-fns";
import { WeddingDayEvent } from "@/types/timeline";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Cell,
  ReferenceLine
} from "recharts";

interface TimelineVisualizationProps {
  events: WeddingDayEvent[];
}

interface TimelineDataPoint {
  id: string;
  title: string;
  startTime: string | Date;
  endTime: string | Date;
  duration: number;
  location?: string;
  category?: string;
  responsibleParty?: string;
  isCriticalPath: boolean;
  startHour: number;
  index: number;
}

const TimelineVisualization = ({ events }: TimelineVisualizationProps) => {
  const { t } = useTranslation();
  const [viewType, setViewType] = useState<"gantt" | "sequence">("gantt");

  // Sort events by start time
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const dateA = new Date(a.startTime).getTime();
      const dateB = new Date(b.startTime).getTime();
      return dateA - dateB;
    });
  }, [events]);

  // Prepare data for visualization
  const timelineData = useMemo(() => {
    if (!sortedEvents.length) return [];

    return sortedEvents.map((event, index) => {
      const startDate = typeof event.startTime === 'string' ? parseISO(event.startTime) : event.startTime;
      const endDate = typeof event.endTime === 'string' ? parseISO(event.endTime) : event.endTime;
      const duration = differenceInMinutes(endDate, startDate);
      const startHour = startDate.getHours() + startDate.getMinutes() / 60;

      return {
        id: event.id,
        title: event.title,
        startTime: event.startTime,
        endTime: event.endTime,
        duration,
        location: event.location,
        category: event.category,
        responsibleParty: event.responsibleParty,
        isCriticalPath: event.isCriticalPath,
        startHour,
        index
      };
    });
  }, [sortedEvents]);

  // Custom tooltip for the timeline chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) {
      return null;
    }

    const data = payload[0].payload as TimelineDataPoint;
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
          {data.location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span>{data.location}</span>
            </div>
          )}
          {data.responsibleParty && (
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{data.responsibleParty}</span>
            </div>
          )}
          {data.isCriticalPath && (
            <div className="flex items-center gap-1 text-red-500">
              <AlertTriangle className="h-3 w-3" />
              <span>{t('timeline.criticalPath')}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Format time for axis labels
  const formatXAxis = (value: number) => {
    const hours = Math.floor(value);
    const minutes = Math.round((value - hours) * 60);
    return `${hours}:${minutes < 10 ? '0' + minutes : minutes}`;
  };

  if (!events.length) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">{t('timeline.noEvents')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">{t('timeline.visualization')}</h3>
        <Select value={viewType} onValueChange={(value) => setViewType(value as "gantt" | "sequence")}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('timeline.selectView')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gantt">{t('timeline.ganttView')}</SelectItem>
            <SelectItem value="sequence">{t('timeline.sequenceView')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="h-[500px]">
            <ResponsiveContainer width="100%" height="100%">
              {viewType === "gantt" ? (
                <BarChart
                  data={timelineData}
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number" 
                    domain={[
                      Math.floor(Math.min(...timelineData.map(d => d.startHour))),
                      Math.ceil(Math.max(...timelineData.map(d => d.startHour + d.duration / 60)))
                    ]}
                    tickFormatter={formatXAxis}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="title" 
                    width={100}
                    tick={{ fontSize: 12 }}
                  />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Bar dataKey="duration" name={t('timeline.duration')} barSize={20}>
                    {timelineData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.isCriticalPath ? '#ef4444' : '#3b82f6'} 
                        fillOpacity={0.8}
                        x={entry.startHour}
                      />
                    ))}
                  </Bar>
                  <ReferenceLine x={new Date().getHours() + new Date().getMinutes() / 60} stroke="#10b981" />
                </BarChart>
              ) : (
                <BarChart
                  data={timelineData}
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number" 
                    domain={[0, timelineData.length > 0 ? timelineData[timelineData.length - 1].index + 1 : 1]}
                    hide
                  />
                  <YAxis 
                    type="category" 
                    dataKey="title" 
                    width={100}
                    tick={{ fontSize: 12 }}
                  />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Bar dataKey="index" name={t('timeline.sequence')} barSize={20}>
                    {timelineData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.isCriticalPath ? '#ef4444' : '#3b82f6'} 
                        fillOpacity={0.8}
                      />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-sm">{t('timeline.regularEvent')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-sm">{t('timeline.criticalPathEvent')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-sm">{t('timeline.currentTime')}</span>
        </div>
      </div>
    </div>
  );
};

export default TimelineVisualization;
