import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import { CalendarEvent, EVENT_TYPES } from "./types";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/context/AppContext";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";

interface TimeTrackingProps {
  events?: CalendarEvent[];
}

interface TimeData {
  name: string;
  hours: number;
  color: string;
}

// Mock time tracking data - in a real app, this would come from your database
const MOCK_TIME_ENTRIES = [
  { id: '1', eventId: 'task-1', hours: 2.5, date: '2023-05-01' },
  { id: '2', eventId: 'task-2', hours: 1.0, date: '2023-05-02' },
  { id: '3', eventId: 'task-3', hours: 3.5, date: '2023-05-03' },
  { id: '4', eventId: 'task-4', hours: 2.0, date: '2023-05-04' },
  { id: '5', eventId: 'task-5', hours: 4.0, date: '2023-05-05' },
  { id: '6', eventId: 'task-6', hours: 1.5, date: '2023-05-06' },
  { id: '7', eventId: 'task-7', hours: 3.0, date: '2023-05-07' },
  { id: '8', eventId: 'task-8', hours: 2.0, date: '2023-05-08' },
  { id: '9', eventId: 'task-9', hours: 5.0, date: '2023-05-09' },
  { id: '10', eventId: 'task-10', hours: 1.0, date: '2023-05-10' },
];

const TimeTracking = ({ events: propEvents }: TimeTrackingProps) => {
  const { t } = useTranslation();
  const { clients } = useApp();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"client" | "type" | "billable">("client");
  const [timeRange, setTimeRange] = useState<"week" | "month" | "quarter">("month");
  const [clientTimeData, setClientTimeData] = useState<TimeData[]>([]);
  const [typeTimeData, setTypeTimeData] = useState<TimeData[]>([]);
  const [billableTimeData, setBillableTimeData] = useState<TimeData[]>([]);

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

  // Process time tracking data
  useEffect(() => {
    if (loading || !events.length) return;

    // In a real app, you would fetch time entries from your database
    // For this example, we'll use mock data and associate it with events

    // Process time by client
    const clientTime: Record<string, number> = {};

    // Process time by event type
    const typeTime: Record<string, number> = {};
    Object.keys(EVENT_TYPES).forEach(type => {
      typeTime[type] = 0;
    });

    // Process billable vs non-billable time
    const billableTime = { billable: 0, nonBillable: 0 };

    // Associate time entries with events and aggregate data
    MOCK_TIME_ENTRIES.forEach(entry => {
      const event = events.find(e => e.id === entry.eventId);
      if (!event) return;

      // Aggregate by client
      const clientId = event.extendedProps?.clientId;
      if (clientId) {
        clientTime[clientId] = (clientTime[clientId] || 0) + entry.hours;
      }

      // Aggregate by type
      const type = event.extendedProps?.type as keyof typeof EVENT_TYPES || 'task';
      typeTime[type] = (typeTime[type] || 0) + entry.hours;

      // Aggregate billable vs non-billable (mock logic - in a real app, this would be a property of the time entry)
      if (['wedding', 'meeting'].includes(type)) {
        billableTime.billable += entry.hours;
      } else {
        billableTime.nonBillable += entry.hours;
      }
    });

    // Convert to chart data format
    const clientChartData: TimeData[] = Object.entries(clientTime)
      .map(([clientId, hours]) => {
        const client = clients.find(c => c.id === clientId);
        return {
          name: client ? `${client.name} ${client.partnerName ? `& ${client.partnerName}` : ''}` : 'Unknown',
          hours,
          color: `hsl(${Math.random() * 360}, 70%, 60%)`
        };
      })
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 10); // Top 10 clients

    const typeChartData: TimeData[] = Object.entries(typeTime)
      .filter(([_, hours]) => hours > 0)
      .map(([type, hours]) => ({
        name: EVENT_TYPES[type as keyof typeof EVENT_TYPES]?.label || type,
        hours,
        color: EVENT_TYPES[type as keyof typeof EVENT_TYPES]?.color || '#888888'
      }));

    const billableChartData: TimeData[] = [
      { name: t('calendar.analytics.billable'), hours: billableTime.billable, color: '#10b981' },
      { name: t('calendar.analytics.nonBillable'), hours: billableTime.nonBillable, color: '#6b7280' }
    ];

    setClientTimeData(clientChartData);
    setTypeTimeData(typeChartData);
    setBillableTimeData(billableChartData);
  }, [events, loading, clients, t]);

  // Format hours for display
  const formatHours = (hours: number) => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);

    if (minutes === 0) {
      return `${wholeHours}h`;
    }

    return `${wholeHours}h ${minutes}m`;
  };

  // Custom tooltip formatter
  const customTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow-sm">
          <p className="font-medium">{payload[0].name}</p>
          <p>{`${t('calendar.analytics.timeSpent')}: ${formatHours(payload[0].value)}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>{t('calendar.analytics.timeTracking')}</CardTitle>
        <Select
          value={timeRange}
          onValueChange={(value: "week" | "month" | "quarter") => setTimeRange(value)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder={t('calendar.analytics.timeRange')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">{t('calendar.analytics.thisWeek')}</SelectItem>
            <SelectItem value="month">{t('calendar.analytics.thisMonth')}</SelectItem>
            <SelectItem value="quarter">{t('calendar.analytics.thisQuarter')}</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
            <TabsList className="mb-4">
              <TabsTrigger value="client">{t('calendar.analytics.byClient')}</TabsTrigger>
              <TabsTrigger value="type">{t('calendar.analytics.byType')}</TabsTrigger>
              <TabsTrigger value="billable">{t('calendar.analytics.billableStatus')}</TabsTrigger>
            </TabsList>

            <TabsContent value="client" className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={clientTimeData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={100}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip content={customTooltip} />
                  <Bar dataKey="hours" name={t('calendar.analytics.hours')}>
                    {clientTimeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="type" className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeTimeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="hours"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {typeTimeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={customTooltip} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="billable" className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={billableTimeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="hours"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {billableTimeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={customTooltip} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

export default TimeTracking;
