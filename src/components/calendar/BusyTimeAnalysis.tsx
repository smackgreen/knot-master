import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getMonth, getYear, addMonths, subMonths } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { CalendarEvent } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/context/AppContext";
import {
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell
} from "recharts";

interface BusyTimeAnalysisProps {
  events?: CalendarEvent[];
}

interface HeatMapData {
  x: number; // day of month
  y: number; // hour of day
  z: number; // number of events (intensity)
  date: Date;
}

const BusyTimeAnalysis = ({ events: propEvents }: BusyTimeAnalysisProps) => {
  const { t } = useTranslation();
  const { clients, tasks } = useApp();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [timeRange, setTimeRange] = useState<"month" | "quarter" | "year">("month");
  const [heatMapData, setHeatMapData] = useState<HeatMapData[]>([]);

  // Get locale for date formatting
  const locale = t("common.locale") === "fr" ? fr : enUS;

  // Fetch events from database if not provided as props
  useEffect(() => {
    const fetchEvents = async () => {
      if (propEvents) {
        setEvents(propEvents);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Fetch tasks from Supabase
        const { data: taskData, error: taskError } = await supabase
          .from('tasks')
          .select('*');

        if (taskError) throw taskError;

        // Fetch wedding dates from clients
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('id, name, partnerName, weddingDate');

        if (clientError) throw clientError;

        // Convert to CalendarEvent format
        const taskEvents: CalendarEvent[] = (taskData || []).map((task: any) => ({
          id: `task-${task.id}`,
          title: task.title,
          start: new Date(task.dueDate),
          allDay: true,
          extendedProps: {
            type: 'task',
            description: task.description || '',
            clientId: task.clientId,
            taskId: task.id,
            status: task.status,
            priority: task.priority,
          }
        }));

        const weddingEvents: CalendarEvent[] = (clientData || []).map((client: any) => ({
          id: `wedding-${client.id}`,
          title: `${client.name} & ${client.partnerName || ''} Wedding`,
          start: new Date(client.weddingDate),
          allDay: true,
          extendedProps: {
            type: 'wedding',
            description: `Wedding day for ${client.name} & ${client.partnerName || ''}`,
            clientId: client.id,
          }
        }));

        // Combine all events
        setEvents([...taskEvents, ...weddingEvents]);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [propEvents]);

  // Generate heat map data based on events and selected time range
  useEffect(() => {
    if (loading || !events.length) return;

    let startDate, endDate;

    // Determine date range based on selected time range
    switch (timeRange) {
      case 'month':
        startDate = startOfMonth(currentMonth);
        endDate = endOfMonth(currentMonth);
        break;
      case 'quarter':
        startDate = startOfMonth(currentMonth);
        endDate = endOfMonth(addMonths(currentMonth, 2));
        break;
      case 'year':
        startDate = new Date(getYear(currentMonth), 0, 1);
        endDate = new Date(getYear(currentMonth), 11, 31);
        break;
      default:
        startDate = startOfMonth(currentMonth);
        endDate = endOfMonth(currentMonth);
    }

    // Get all days in the range
    const daysInRange = eachDayOfInterval({ start: startDate, end: endDate });

    // Initialize data with zero events for all days and hours
    const initialData: HeatMapData[] = [];

    daysInRange.forEach((date, index) => {
      for (let hour = 0; hour < 24; hour++) {
        initialData.push({
          x: index + 1, // day index (1-based)
          y: hour, // hour (0-23)
          z: 0, // event count
          date: new Date(date.setHours(hour))
        });
      }
    });

    // Count events for each day and hour
    events.forEach(event => {
      const eventDate = new Date(event.start);

      // Skip events outside the selected range
      if (eventDate < startDate || eventDate > endDate) return;

      // Find the corresponding day and hour in our data
      const dayIndex = daysInRange.findIndex(day =>
        day.getDate() === eventDate.getDate() &&
        day.getMonth() === eventDate.getMonth() &&
        day.getFullYear() === eventDate.getFullYear()
      );

      if (dayIndex !== -1) {
        const hour = eventDate.getHours();
        const dataIndex = (dayIndex * 24) + hour;

        if (initialData[dataIndex]) {
          initialData[dataIndex].z += 1;
        }
      }
    });

    // Filter out empty cells to reduce data size
    const filteredData = initialData.filter(item => item.z > 0);

    setHeatMapData(filteredData.length ? filteredData : initialData);
  }, [events, currentMonth, timeRange, loading]);

  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentMonth(prevMonth => subMonths(prevMonth, 1));
  };

  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentMonth(prevMonth => addMonths(prevMonth, 1));
  };

  // Get color based on intensity (number of events)
  const getColor = (intensity: number) => {
    if (intensity === 0) return '#f3f4f6'; // Light gray for no events
    if (intensity === 1) return '#93c5fd'; // Light blue for 1 event
    if (intensity === 2) return '#60a5fa'; // Medium blue for 2 events
    if (intensity === 3) return '#3b82f6'; // Blue for 3 events
    if (intensity === 4) return '#2563eb'; // Dark blue for 4 events
    return '#1d4ed8'; // Very dark blue for 5+ events
  };

  // Format tooltip content
  const renderTooltip = (props: any) => {
    const { payload } = props;
    if (!payload || !payload.length) return null;

    const { date, z } = payload[0].payload;

    return (
      <div className="bg-white p-2 border rounded shadow-sm">
        <p className="font-medium">{format(date, 'PPP', { locale })}</p>
        <p>{format(date, 'p', { locale })}</p>
        <p>{t('calendar.analytics.eventCount', { count: z })}</p>
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>{t('calendar.analytics.busyTimeAnalysis')}</CardTitle>
        <div className="flex items-center gap-2">
          <Select
            value={timeRange}
            onValueChange={(value: "month" | "quarter" | "year") => setTimeRange(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('calendar.analytics.selectTimeRange')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">{t('calendar.analytics.month')}</SelectItem>
              <SelectItem value="quarter">{t('calendar.analytics.quarter')}</SelectItem>
              <SelectItem value="year">{t('calendar.analytics.year')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              >
                <XAxis
                  type="number"
                  dataKey="x"
                  name="day"
                  domain={[1, timeRange === 'month' ? 31 : timeRange === 'quarter' ? 92 : 365]}
                  tickFormatter={(value) => `${value}`}
                  label={{ value: t('calendar.analytics.day'), position: 'insideBottom', offset: -10 }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="hour"
                  domain={[0, 23]}
                  tickFormatter={(value) => `${value}:00`}
                  label={{ value: t('calendar.analytics.hour'), angle: -90, position: 'insideLeft' }}
                />
                <ZAxis
                  type="number"
                  dataKey="z"
                  range={[50, 500]}
                  domain={[0, 10]}
                />
                <Tooltip content={renderTooltip} />
                <Scatter name="Events" data={heatMapData}>
                  {heatMapData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getColor(entry.z)} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BusyTimeAnalysis;
