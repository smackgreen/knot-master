import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";
import { CalendarEvent } from "@/types";
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

// Define event types and colors (same as in Calendar.tsx)
const EVENT_TYPES = {
  wedding: { label: 'Wedding', color: '#f472b6' }, // pink
  task: { label: 'Task', color: '#60a5fa' }, // blue
  meeting: { label: 'Meeting', color: '#34d399' }, // green
  deadline: { label: 'Deadline', color: '#f97316' }, // orange
  appointment: { label: 'Appointment', color: '#a78bfa' }, // purple
};

interface EventDistributionProps {
  events?: CalendarEvent[];
}

interface ChartData {
  name: string;
  value: number;
  color: string;
}

const EventDistribution = ({ events: propEvents }: EventDistributionProps) => {
  const { t } = useTranslation();
  const { clients } = useApp();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"type" | "client" | "month">("type");
  const [typeData, setTypeData] = useState<ChartData[]>([]);
  const [clientData, setClientData] = useState<ChartData[]>([]);
  const [monthData, setMonthData] = useState<ChartData[]>([]);

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

  // Process data for charts
  useEffect(() => {
    if (loading || !events.length) return;

    // Process data by event type
    const typeCount: Record<string, number> = {};
    Object.keys(EVENT_TYPES).forEach(type => {
      typeCount[type] = 0;
    });

    // Process data by client
    const clientCount: Record<string, number> = {};

    // Process data by month
    const monthCount: Record<number, number> = {};
    for (let i = 0; i < 12; i++) {
      monthCount[i] = 0;
    }

    // Count events
    events.forEach(event => {
      // Count by type
      const type = event.extendedProps?.type as keyof typeof EVENT_TYPES || 'task';
      typeCount[type] = (typeCount[type] || 0) + 1;

      // Count by client
      const clientId = event.extendedProps?.clientId;
      if (clientId) {
        clientCount[clientId] = (clientCount[clientId] || 0) + 1;
      }

      // Count by month
      const month = new Date(event.start).getMonth();
      monthCount[month] = (monthCount[month] || 0) + 1;
    });

    // Convert to chart data format
    const typeChartData: ChartData[] = Object.entries(typeCount)
      .filter(([_, count]) => count > 0)
      .map(([type, count]) => ({
        name: EVENT_TYPES[type as keyof typeof EVENT_TYPES]?.label || type,
        value: count,
        color: EVENT_TYPES[type as keyof typeof EVENT_TYPES]?.color || '#888888'
      }));

    const clientChartData: ChartData[] = Object.entries(clientCount)
      .map(([clientId, count]) => {
        const client = clients.find(c => c.id === clientId);
        return {
          name: client ? `${client.name} ${client.partnerName ? `& ${client.partnerName}` : ''}` : 'Unknown',
          value: count,
          color: `hsl(${Math.random() * 360}, 70%, 60%)`
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10 clients

    const monthNames = [
      t('calendar.analytics.january'),
      t('calendar.analytics.february'),
      t('calendar.analytics.march'),
      t('calendar.analytics.april'),
      t('calendar.analytics.may'),
      t('calendar.analytics.june'),
      t('calendar.analytics.july'),
      t('calendar.analytics.august'),
      t('calendar.analytics.september'),
      t('calendar.analytics.october'),
      t('calendar.analytics.november'),
      t('calendar.analytics.december')
    ];

    const monthChartData: ChartData[] = Object.entries(monthCount)
      .map(([month, count]) => ({
        name: monthNames[parseInt(month)],
        value: count,
        color: `hsl(${(parseInt(month) * 30) % 360}, 70%, 60%)`
      }));

    setTypeData(typeChartData);
    setClientData(clientChartData);
    setMonthData(monthChartData);
  }, [events, loading, clients, t]);

  // Custom tooltip formatter
  const customTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow-sm">
          <p className="font-medium">{payload[0].name}</p>
          <p>{`${t('calendar.analytics.events')}: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle>{t('calendar.analytics.eventDistribution')}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
            <TabsList className="mb-4">
              <TabsTrigger value="type">{t('calendar.analytics.byType')}</TabsTrigger>
              <TabsTrigger value="client">{t('calendar.analytics.byClient')}</TabsTrigger>
              <TabsTrigger value="month">{t('calendar.analytics.byMonth')}</TabsTrigger>
            </TabsList>

            <TabsContent value="type" className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {typeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={customTooltip} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="client" className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={clientData}
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
                  <Bar dataKey="value" name={t('calendar.analytics.events')}>
                    {clientData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="month" className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip content={customTooltip} />
                  <Bar dataKey="value" name={t('calendar.analytics.events')}>
                    {monthData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

export default EventDistribution;
