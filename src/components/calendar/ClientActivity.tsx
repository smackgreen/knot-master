import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import { CalendarEvent } from "./types";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/context/AppContext";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area
} from "recharts";
import { format, subMonths, eachMonthOfInterval, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { fr, enUS } from "date-fns/locale";

interface ClientActivityProps {
  events?: CalendarEvent[];
}

interface ActivityData {
  month: string;
  [key: string]: string | number; // Client IDs as keys, event counts as values
}

const ClientActivity = ({ events: propEvents }: ClientActivityProps) => {
  const { t } = useTranslation();
  const { clients } = useApp();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"6months" | "1year" | "2years">("6months");
  const [chartType, setChartType] = useState<"line" | "area">("line");
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);

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

  // Initialize selected clients with top active clients
  useEffect(() => {
    if (loading || !events.length) return;

    // Count events per client
    const clientCounts: Record<string, number> = {};

    events.forEach(event => {
      const clientId = event.extendedProps?.clientId;
      if (clientId) {
        clientCounts[clientId] = (clientCounts[clientId] || 0) + 1;
      }
    });

    // Get top 5 most active clients
    const topClients = Object.entries(clientCounts)
      .sort(([, countA], [, countB]) => countB - countA)
      .slice(0, 5)
      .map(([clientId]) => clientId);

    setSelectedClients(topClients);
  }, [events, loading]);

  // Process data for client activity chart
  useEffect(() => {
    if (loading || !events.length || !selectedClients.length) return;

    // Determine date range
    const now = new Date();
    let startDate;

    switch (timeRange) {
      case '6months':
        startDate = subMonths(now, 6);
        break;
      case '1year':
        startDate = subMonths(now, 12);
        break;
      case '2years':
        startDate = subMonths(now, 24);
        break;
      default:
        startDate = subMonths(now, 6);
    }

    // Get all months in the range
    const monthsInRange = eachMonthOfInterval({ start: startDate, end: now });

    // Initialize data with zero events for all months and selected clients
    const data: ActivityData[] = monthsInRange.map(month => {
      const monthData: ActivityData = {
        month: format(month, 'MMM yyyy', { locale }),
        monthObj: month // We'll remove this later
      };

      // Initialize count for each selected client
      selectedClients.forEach(clientId => {
        monthData[clientId] = 0;
      });

      return monthData;
    });

    // Count events for each month and client
    events.forEach(event => {
      const eventDate = new Date(event.start);
      const clientId = event.extendedProps?.clientId;

      // Skip events outside the selected range or without client ID
      if (!clientId || !selectedClients.includes(clientId) || eventDate < startDate) return;

      // Find the corresponding month in our data
      const monthIndex = data.findIndex(item => {
        const monthStart = startOfMonth(item.monthObj as Date);
        const monthEnd = endOfMonth(item.monthObj as Date);
        return isWithinInterval(eventDate, { start: monthStart, end: monthEnd });
      });

      if (monthIndex !== -1) {
        data[monthIndex][clientId] = (data[monthIndex][clientId] as number) + 1;
      }
    });

    // Remove the monthObj property before setting state
    const cleanData = data.map(item => {
      const { monthObj, ...rest } = item;
      return rest;
    });

    setActivityData(cleanData);
  }, [events, selectedClients, timeRange, loading, locale]);

  // Toggle client selection
  const toggleClientSelection = (clientId: string) => {
    if (selectedClients.includes(clientId)) {
      setSelectedClients(selectedClients.filter(id => id !== clientId));
    } else {
      setSelectedClients([...selectedClients, clientId]);
    }
  };

  // Get client name by ID
  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client ? `${client.name} ${client.partnerName ? `& ${client.partnerName}` : ''}` : clientId;
  };

  // Get random color for client
  const getClientColor = (clientId: string) => {
    // Generate a deterministic color based on client ID
    const hash = clientId.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);

    const h = Math.abs(hash) % 360;
    return `hsl(${h}, 70%, 60%)`;
  };

  // Custom tooltip formatter
  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow-sm">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any) => (
            <p key={entry.dataKey} style={{ color: entry.color }}>
              {getClientName(entry.dataKey)}: {entry.value} {t('calendar.analytics.events')}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>{t('calendar.analytics.clientActivity')}</CardTitle>
        <div className="flex items-center gap-2">
          <Select
            value={timeRange}
            onValueChange={(value: "6months" | "1year" | "2years") => setTimeRange(value)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder={t('calendar.analytics.timeRange')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6months">{t('calendar.analytics.sixMonths')}</SelectItem>
              <SelectItem value="1year">{t('calendar.analytics.oneYear')}</SelectItem>
              <SelectItem value="2years">{t('calendar.analytics.twoYears')}</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={chartType}
            onValueChange={(value: "line" | "area") => setChartType(value)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder={t('calendar.analytics.chartType')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="line">{t('calendar.analytics.lineChart')}</SelectItem>
              <SelectItem value="area">{t('calendar.analytics.areaChart')}</SelectItem>
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
          <>
            <div className="mb-4 flex flex-wrap gap-2">
              {clients.map(client => (
                <button
                  key={client.id}
                  className={`px-2 py-1 text-xs rounded-full transition-colors ${
                    selectedClients.includes(client.id)
                      ? 'text-white'
                      : 'bg-transparent text-foreground border'
                  }`}
                  style={{
                    backgroundColor: selectedClients.includes(client.id)
                      ? getClientColor(client.id)
                      : 'transparent',
                    borderColor: getClientColor(client.id)
                  }}
                  onClick={() => toggleClientSelection(client.id)}
                >
                  {client.name}
                </button>
              ))}
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'line' ? (
                  <LineChart
                    data={activityData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip content={customTooltip} />
                    <Legend />
                    {selectedClients.map(clientId => (
                      <Line
                        key={clientId}
                        type="monotone"
                        dataKey={clientId}
                        name={getClientName(clientId)}
                        stroke={getClientColor(clientId)}
                        activeDot={{ r: 8 }}
                      />
                    ))}
                  </LineChart>
                ) : (
                  <AreaChart
                    data={activityData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip content={customTooltip} />
                    <Legend />
                    {selectedClients.map(clientId => (
                      <Area
                        key={clientId}
                        type="monotone"
                        dataKey={clientId}
                        name={getClientName(clientId)}
                        stroke={getClientColor(clientId)}
                        fill={getClientColor(clientId)}
                        fillOpacity={0.3}
                      />
                    ))}
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ClientActivity;
