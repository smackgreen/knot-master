/**
 * Calendar types and interfaces
 */

// Define event types with labels and colors
export const EVENT_TYPES = {
  wedding: { label: 'Wedding', color: '#f472b6' }, // pink
  task: { label: 'Task', color: '#60a5fa' }, // blue
  meeting: { label: 'Meeting', color: '#34d399' }, // green
  deadline: { label: 'Deadline', color: '#f97316' }, // orange
  appointment: { label: 'Appointment', color: '#a78bfa' }, // purple
};

// Extended properties for calendar events
export interface CalendarEventExtendedProps {
  type: keyof typeof EVENT_TYPES;
  description?: string;
  clientId?: string;
  clientName?: string;
  taskId?: string;
  status?: string;
  priority?: string;
  location?: string;
  attendees?: string[];
  notes?: string;
}

// Calendar event interface
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end?: Date;
  allDay?: boolean;
  url?: string;
  className?: string;
  editable?: boolean;
  startEditable?: boolean;
  durationEditable?: boolean;
  resourceEditable?: boolean;
  display?: string;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  extendedProps?: CalendarEventExtendedProps;
}

// Calendar view types
export type CalendarViewType = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek';

// Calendar theme types
export type CalendarTheme = 'light' | 'dark';

// Calendar settings interface
export interface CalendarSettings {
  theme: CalendarTheme;
  showWeekends: boolean;
  showDayNotes: boolean;
  defaultView: CalendarViewType;
  businessHours: {
    start: string;
    end: string;
    daysOfWeek: number[];
  };
  googleCalendar?: {
    enabled: boolean;
    apiKey?: string;
    calendarId?: string;
  };
}

// External calendar interface
export interface ExternalCalendar {
  id: string;
  name: string;
  type: 'google' | 'outlook' | 'apple';
  color: string;
  connected: boolean;
  selected: boolean;
}

// Calendar search query interface
export interface CalendarSearchQuery {
  keyword?: string;
  dateRange?: {
    from?: Date;
    to?: Date;
  };
  clients?: string[];
  categories?: string[];
  status?: string[];
  priority?: string[];
}

// Calendar analytics data interfaces
export interface ActivityData {
  date: Date;
  count: number;
  clientId?: string;
  clientName?: string;
}

export interface ChartData {
  name: string;
  value: number;
  color: string;
}
