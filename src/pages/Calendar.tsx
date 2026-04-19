import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, parseISO } from "date-fns";
import { enUS, fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  CalendarIcon,
  Plus,
  Filter,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon2,
  Settings,
  Search,
  Layers,
  Download,
  BarChart,
  Palette,
  FolderTree
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Task } from "@/types";
import calendarService from "@/services/CalendarService";

// Import FullCalendar and required plugins
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import googleCalendarPlugin from '@fullcalendar/google-calendar';

// Import custom components
import CalendarSettings from "@/components/calendar/CalendarSettings";
import CategoryManager from "@/components/calendar/CategoryManager";
import AdvancedSearch from "@/components/calendar/AdvancedSearch";
import BusyTimeAnalysis from "@/components/calendar/BusyTimeAnalysis";
import EventDistribution from "@/components/calendar/EventDistribution";
import ClientActivity from "@/components/calendar/ClientActivity";
import TimeTracking from "@/components/calendar/TimeTracking";

// Import event types and interface
import { CalendarEvent, EVENT_TYPES } from "@/components/calendar/types";

const Calendar = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const { clients, tasks } = useApp();
  const { user } = useAuth();
  const { t } = useTranslation();
  const calendarRef = useRef<any>(null);

  // Check if Google Calendar is connected and fetch events
  useEffect(() => {
    const checkGoogleCalendar = async () => {
      if (!user) return;

      try {
        // Set the user in the calendar service
        calendarService.setUser(user);

        // Check if Google Calendar is connected
        const isConnected = await calendarService.isGoogleCalendarConnected();
        setIsGoogleCalendarEnabled(isConnected);

        // If connected, fetch events
        if (isConnected) {
          // Get the current date range from the calendar
          const now = new Date();
          const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const end = new Date(now.getFullYear(), now.getMonth() + 2, 0);

          // Format dates for the API
          const timeMin = start.toISOString();
          const timeMax = end.toISOString();

          // Fetch events
          const events = await calendarService.getGoogleCalendarEvents(timeMin, timeMax);
          setGoogleCalendarEvents(events);
        }
      } catch (error) {
        console.error("Error checking Google Calendar:", error);
      }
    };

    checkGoogleCalendar();
  }, [user]);
  const [currentView, setCurrentView] = useState<string>('dayGridMonth');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>(['wedding', 'task', 'meeting', 'deadline', 'appointment']);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [isGoogleCalendarEnabled, setIsGoogleCalendarEnabled] = useState(false);
  const [googleCalendarEvents, setGoogleCalendarEvents] = useState<any[]>([]);
  const [calendarTheme, setCalendarTheme] = useState<'light' | 'dark'>('light');
  const [showDayNotes, setShowDayNotes] = useState(true);
  const [dayNotes, setDayNotes] = useState<Record<string, string>>({});
  const [newEvent, setNewEvent] = useState<{
    title: string;
    start: Date | null;
    end: Date | null;
    allDay: boolean;
    type: keyof typeof EVENT_TYPES;
    description: string;
    clientId: string;
  }>({
    title: '',
    start: null,
    end: null,
    allDay: true,
    type: 'meeting',
    description: '',
    clientId: '',
  });

  // Track the current displayed date for the persistent header
  const [currentDisplayDate, setCurrentDisplayDate] = useState<Date>(new Date());

  // Get the date-fns locale based on current i18n language
  const getDateLocale = () => {
    const lng = typeof window !== 'undefined' ? localStorage.getItem('i18nextLng') : 'en';
    return lng === 'fr' ? fr : enUS;
  };

  // Format the header date based on the current view
  const getFormattedDateHeader = (): string => {
    const locale = getDateLocale();
    const date = currentDisplayDate;

    switch (currentView) {
      case 'dayGridMonth':
        return format(date, 'MMMM yyyy', { locale });
      case 'timeGridDay':
        return format(date, 'EEEE, MMMM d, yyyy', { locale });
      case 'timeGridWeek': {
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay() + 1); // Monday
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
        const startFmt = format(startOfWeek, 'MMM d', { locale });
        const endFmt = format(endOfWeek, 'MMM d, yyyy', { locale });
        return `${startFmt} – ${endFmt}`;
      }
      case 'listWeek': {
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay() + 1);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        const startFmt = format(startOfWeek, 'MMM d', { locale });
        const endFmt = format(endOfWeek, 'MMM d, yyyy', { locale });
        return `${startFmt} – ${endFmt}`;
      }
      default:
        return format(date, 'MMMM yyyy', { locale });
    }
  };

  // Handle dates change from FullCalendar (fires on navigation and view changes)
  const handleDatesSet = (dateInfo: any) => {
    // Sync the current view type from the calendar API
    setCurrentView(dateInfo.view.type);

    if (dateInfo.view.type === 'dayGridMonth') {
      // For month view, use the midpoint of the visible range to determine the actual month
      const start = new Date(dateInfo.start);
      const end = new Date(dateInfo.end);
      const midTime = start.getTime() + (end.getTime() - start.getTime()) / 2;
      setCurrentDisplayDate(new Date(midTime));
    } else {
      // For day and week views, use the start of the visible range
      setCurrentDisplayDate(new Date(dateInfo.start));
    }
  };

  // Get events from clients (wedding dates)
  const weddingEvents: CalendarEvent[] = clients.map(client => ({
    id: `wedding-${client.id}`,
    title: `${client.name} & ${client.partnerName} Wedding`,
    start: new Date(client.weddingDate),
    allDay: true,
    extendedProps: {
      type: 'wedding',
      description: `Wedding day for ${client.name} & ${client.partnerName} at ${client.venue || 'TBD'}`,
      clientId: client.id,
      clientName: `${client.name} & ${client.partnerName}`,
    }
  }));

  // Get events from tasks
  const taskEvents: CalendarEvent[] = tasks.map(task => ({
    id: `task-${task.id}`,
    title: task.title,
    start: new Date(task.dueDate),
    allDay: true,
    extendedProps: {
      type: 'task',
      description: task.description || '',
      clientId: task.clientId,
      clientName: clients.find(c => c.id === task.clientId)?.name || '',
      taskId: task.id,
      status: task.status,
      priority: task.priority,
    }
  }));

  // Combine all events
  const allEvents = [...weddingEvents, ...taskEvents];

  // Filter events based on selected filters and clients
  const filteredEvents = allEvents.filter(event => {
    const typeMatch = selectedFilters.includes(event.extendedProps?.type || '');
    const clientMatch = selectedClients.length === 0 ||
      selectedClients.includes(event.extendedProps?.clientId || '');
    return typeMatch && clientMatch;
  });

  // Handle event click
  const handleEventClick = (info: any) => {
    const eventId = info.event.id;
    const event = allEvents.find(e => e.id === eventId);
    if (event) {
      setSelectedEvent(event);
      setIsEventModalOpen(true);
    }
  };

  // Handle date click for adding new event
  const handleDateClick = (info: any) => {
    setNewEvent({
      ...newEvent,
      start: new Date(info.date),
      end: new Date(info.date),
    });
    setIsAddEventModalOpen(true);
  };

  // Handle view change
  const handleViewChange = (view: string) => {
    setCurrentView(view);
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.changeView(view);
    }
  };

  // Handle today button click
  const handleTodayClick = () => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.today();
    }
  };

  // Handle prev button click
  const handlePrevClick = () => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.prev();
    }
  };

  // Handle next button click
  const handleNextClick = () => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.next();
    }
  };

  // Handle filter change
  const handleFilterChange = (type: string) => {
    if (selectedFilters.includes(type)) {
      setSelectedFilters(selectedFilters.filter(t => t !== type));
    } else {
      setSelectedFilters([...selectedFilters, type]);
    }
  };

  // Handle client filter change
  const handleClientFilterChange = (clientId: string) => {
    if (selectedClients.includes(clientId)) {
      setSelectedClients(selectedClients.filter(id => id !== clientId));
    } else {
      setSelectedClients([...selectedClients, clientId]);
    }
  };

  // Handle add event
  const handleAddEvent = () => {
    // Here you would typically save the event to your database
    // For now, we'll just close the modal
    setIsAddEventModalOpen(false);
    setNewEvent({
      title: '',
      start: null,
      end: null,
      allDay: true,
      type: 'meeting',
      description: '',
      clientId: '',
    });
  };

  // Handle advanced search
  const handleAdvancedSearch = (query: any) => {
    // Filter events based on search query
    if (query.keyword) {
      // Filter by keyword
    }

    if (query.dateRange.from || query.dateRange.to) {
      // Filter by date range
    }

    if (query.clients.length > 0) {
      setSelectedClients(query.clients);
    }

    if (query.categories.length > 0) {
      setSelectedFilters(query.categories);
    }

    // Apply filters to calendar
    if (calendarRef.current) {
      calendarRef.current.getApi().refetchEvents();
    }
  };

  // Handle calendar settings update
  const handleSettingsUpdate = async () => {
    if (!user) return;

    try {
      // Set the user in the calendar service
      calendarService.setUser(user);

      // Check if Google Calendar is connected
      const isConnected = await calendarService.isGoogleCalendarConnected();
      setIsGoogleCalendarEnabled(isConnected);

      // If connected, fetch events
      if (isConnected) {
        // Get the current date range from the calendar
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 2, 0);

        // Format dates for the API
        const timeMin = start.toISOString();
        const timeMax = end.toISOString();

        // Fetch events
        const events = await calendarService.getGoogleCalendarEvents(timeMin, timeMax);
        setGoogleCalendarEvents(events);
      } else {
        setGoogleCalendarEvents([]);
      }

      // Refresh calendar
      if (calendarRef.current) {
        calendarRef.current.getApi().refetchEvents();
      }
    } catch (error) {
      console.error("Error updating calendar settings:", error);
    }
  };

  // Add or update day note
  const addDayNote = (date: Date, note: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    setDayNotes(prev => ({
      ...prev,
      [dateStr]: note
    }));
  };

  // Get note for a specific day
  const getDayNote = (date: Date): string => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return dayNotes[dateStr] || '';
  };

  return (
    <div className={`animate-in space-y-6 ${calendarTheme === 'dark' ? 'dark' : ''}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-serif font-bold">{t('calendar.title')}</h1>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddEventModalOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            {t('calendar.addEvent')}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAdvancedSearchOpen(true)}
          >
            <Search className="h-4 w-4 mr-1" />
            {t('calendar.search.title')}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCategoryManagerOpen(true)}
          >
            <FolderTree className="h-4 w-4 mr-1" />
            {t('calendar.categories.title')}
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-1" />
                {t('calendar.filter')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">{t('calendar.eventTypes')}</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(EVENT_TYPES).map(([type, { label, color }]) => (
                      <Badge
                        key={type}
                        variant={selectedFilters.includes(type) ? "default" : "outline"}
                        className="cursor-pointer"
                        style={{
                          backgroundColor: selectedFilters.includes(type) ? color : 'transparent',
                          color: selectedFilters.includes(type) ? 'white' : 'inherit',
                          borderColor: color
                        }}
                        onClick={() => handleFilterChange(type)}
                      >
                        {label}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">{t('calendar.clients')}</h4>
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                    {clients.map(client => (
                      <Badge
                        key={client.id}
                        variant={selectedClients.includes(client.id) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => handleClientFilterChange(client.id)}
                      >
                        {client.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAnalyticsOpen(true)}
          >
            <BarChart className="h-4 w-4 mr-1" />
            {t('calendar.analytics.title')}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSettingsOpen(true)}
          >
            <Settings className="h-4 w-4 mr-1" />
            {t('calendar.settings.title')}
          </Button>
        </div>
      </div>

      <Card className="border shadow-sm">
        <CardHeader className="pb-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePrevClick}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleTodayClick}>
                {t('calendar.today')}
              </Button>
              <Button variant="outline" size="sm" onClick={handleNextClick}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Persistent Date Header */}
            <div className="flex-1 text-center px-4">
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-foreground tracking-tight">
                {getFormattedDateHeader()}
              </h2>
            </div>

            <Select value={currentView} onValueChange={handleViewChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('calendar.selectView')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dayGridMonth">{t('calendar.monthView')}</SelectItem>
                <SelectItem value="timeGridWeek">{t('calendar.weekView')}</SelectItem>
                <SelectItem value="timeGridDay">{t('calendar.dayView')}</SelectItem>
                <SelectItem value="listWeek">{t('calendar.listView')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-[700px]">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin, googleCalendarPlugin]}
              initialView="dayGridMonth"
              headerToolbar={false} // We're using our custom header
              datesSet={handleDatesSet}
              eventClick={handleEventClick}
              dateClick={handleDateClick}
              eventColor="#3b82f6" // Default color
              eventDidMount={(info) => {
                const type = info.event.extendedProps?.type as keyof typeof EVENT_TYPES;
                if (type && EVENT_TYPES[type]) {
                  // Apply the color to the event element
                  info.el.style.backgroundColor = EVENT_TYPES[type].color;
                  info.el.style.borderColor = EVENT_TYPES[type].color;
                }
              }}
              // Google Calendar integration
              events={[
                ...filteredEvents,
                ...(isGoogleCalendarEnabled ? googleCalendarEvents.map(event => ({
                  id: event.id,
                  title: event.summary,
                  start: event.start.dateTime || event.start.date,
                  end: event.end.dateTime || event.end.date,
                  allDay: !event.start.dateTime,
                  url: event.htmlLink,
                  extendedProps: {
                    type: 'google',
                    description: event.description || '',
                    location: event.location || '',
                  },
                  className: 'google-calendar-event',
                  backgroundColor: '#4285F4',
                  borderColor: '#4285F4',
                })) : [])
              ]}
              // Additional options
              weekends={true}
              showNonCurrentDates={true}
              fixedWeekCount={false}
              eventContent={(arg) => {
                const type = arg.event.extendedProps?.type as keyof typeof EVENT_TYPES;
                return (
                  <div className="flex items-center gap-1 p-1 overflow-hidden">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: EVENT_TYPES[type]?.color || '#3b82f6' }}
                    />
                    <div className="truncate text-xs">{arg.event.title}</div>
                  </div>
                );
              }}
              height="100%"
              editable={true}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={true}
            />
          </div>
        </CardContent>
      </Card>

      {/* Event Details Modal */}
      <Dialog open={isEventModalOpen} onOpenChange={setIsEventModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
            <DialogDescription>
              {selectedEvent?.extendedProps?.type && (
                <Badge
                  style={{
                    backgroundColor: EVENT_TYPES[selectedEvent.extendedProps.type]?.color || '#3b82f6',
                    color: 'white'
                  }}
                  className="mt-2"
                >
                  {EVENT_TYPES[selectedEvent.extendedProps.type]?.label}
                </Badge>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium">{t('calendar.date')}</h4>
              <p className="text-sm">
                {selectedEvent?.start && format(new Date(selectedEvent.start), 'PPP')}
                {selectedEvent?.end && selectedEvent.end !== selectedEvent.start &&
                  ` - ${format(new Date(selectedEvent.end), 'PPP')}`}
              </p>
            </div>

            {selectedEvent?.extendedProps?.clientName && (
              <div>
                <h4 className="text-sm font-medium">{t('calendar.client')}</h4>
                <p className="text-sm">{selectedEvent.extendedProps.clientName}</p>
              </div>
            )}

            {selectedEvent?.extendedProps?.description && (
              <div>
                <h4 className="text-sm font-medium">{t('calendar.description')}</h4>
                <p className="text-sm">{selectedEvent.extendedProps.description}</p>
              </div>
            )}

            {selectedEvent?.extendedProps?.status && (
              <div>
                <h4 className="text-sm font-medium">{t('calendar.status')}</h4>
                <p className="text-sm">{selectedEvent.extendedProps.status}</p>
              </div>
            )}

            {selectedEvent?.extendedProps?.priority && (
              <div>
                <h4 className="text-sm font-medium">{t('calendar.priority')}</h4>
                <p className="text-sm">{selectedEvent.extendedProps.priority}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEventModalOpen(false)}>
              {t('common.close')}
            </Button>
            {selectedEvent?.extendedProps?.taskId && (
              <Button>
                {t('calendar.editTask')}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Event Modal */}
      <Dialog open={isAddEventModalOpen} onOpenChange={setIsAddEventModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t('calendar.addEvent')}</DialogTitle>
            <DialogDescription>
              {t('calendar.addEventDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">{t('calendar.eventTitle')}</Label>
              <Input
                id="title"
                value={newEvent.title}
                onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                placeholder={t('calendar.eventTitlePlaceholder')}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">{t('calendar.startDate')}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="start-date"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !newEvent.start && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newEvent.start ? format(newEvent.start, "PPP") : <span>{t('calendar.selectDate')}</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={newEvent.start || undefined}
                      onSelect={(date) => setNewEvent({...newEvent, start: date || null})}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="end-date">{t('calendar.endDate')}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="end-date"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !newEvent.end && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newEvent.end ? format(newEvent.end, "PPP") : <span>{t('calendar.selectDate')}</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={newEvent.end || undefined}
                      onSelect={(date) => setNewEvent({...newEvent, end: date || null})}
                      initialFocus
                      disabled={(date) => newEvent.start ? date < newEvent.start : false}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-type">{t('calendar.eventType')}</Label>
              <Select
                value={newEvent.type}
                onValueChange={(value: any) => setNewEvent({...newEvent, type: value})}
              >
                <SelectTrigger id="event-type">
                  <SelectValue placeholder={t('calendar.selectEventType')} />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EVENT_TYPES).map(([type, { label }]) => (
                    <SelectItem key={type} value={type}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="client">{t('calendar.client')}</Label>
              <Select
                value={newEvent.clientId}
                onValueChange={(value) => setNewEvent({...newEvent, clientId: value})}
              >
                <SelectTrigger id="client">
                  <SelectValue placeholder={t('calendar.selectClient')} />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name} {client.partnerName ? `& ${client.partnerName}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('calendar.description')}</Label>
              <Textarea
                id="description"
                value={newEvent.description}
                onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                placeholder={t('calendar.descriptionPlaceholder')}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddEventModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleAddEvent}>
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mini Calendar for Mobile */}
      <div className="block lg:hidden">
        <Card>
          <CardHeader>
            <CardTitle>{t('calendar.miniCalendar')}</CardTitle>
          </CardHeader>
          <CardContent>
            <CalendarComponent
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
            />
          </CardContent>
        </Card>
      </div>

      {/* Calendar Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-4xl">
          <CalendarSettings onClose={() => setIsSettingsOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Category Manager Dialog */}
      <Dialog open={isCategoryManagerOpen} onOpenChange={setIsCategoryManagerOpen}>
        <DialogContent className="max-w-4xl">
          <CategoryManager onClose={() => setIsCategoryManagerOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Advanced Search Dialog */}
      <Dialog open={isAdvancedSearchOpen} onOpenChange={setIsAdvancedSearchOpen}>
        <DialogContent className="max-w-4xl">
          <AdvancedSearch
            onSearch={handleAdvancedSearch}
            onClose={() => setIsAdvancedSearchOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Day Notes Dialog */}
      <Dialog>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t('calendar.dayNotes.title')}</DialogTitle>
            <DialogDescription>
              {t('calendar.dayNotes.description')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="day-note">{t('calendar.dayNotes.note')}</Label>
              <Textarea
                id="day-note"
                placeholder={t('calendar.dayNotes.notePlaceholder')}
                rows={5}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline">
              {t('common.cancel')}
            </Button>
            <Button>
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Calendar Analytics Dialog */}
      <Dialog open={isAnalyticsOpen} onOpenChange={setIsAnalyticsOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>{t('calendar.analytics.title')}</DialogTitle>
            <DialogDescription>
              {t('calendar.analytics.description')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Busy Time Analysis with real data */}
              <BusyTimeAnalysis events={filteredEvents} />

              {/* Event Distribution with real data */}
              <EventDistribution events={filteredEvents} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Client Activity with real data */}
              <ClientActivity events={filteredEvents} />

              {/* Time Tracking with real data */}
              <TimeTracking events={filteredEvents} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline">
              {t('common.close')}
            </Button>
            <Button>
              {t('calendar.analytics.exportData')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Calendar;
