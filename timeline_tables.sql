-- Create tables for advanced timeline management

-- Create timelines table for wedding day schedules
CREATE TABLE IF NOT EXISTS timelines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  client_id UUID REFERENCES clients ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  wedding_date DATE,
  is_template BOOLEAN NOT NULL DEFAULT FALSE,
  template_category TEXT, -- Only used if is_template is true
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create timeline_events table for individual events in a timeline
CREATE TABLE IF NOT EXISTS timeline_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timeline_id UUID REFERENCES timelines ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  location TEXT,
  responsible_party TEXT,
  is_critical_path BOOLEAN NOT NULL DEFAULT FALSE,
  sequence_number INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create timeline_event_dependencies table for tracking dependencies between events
CREATE TABLE IF NOT EXISTS timeline_event_dependencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  predecessor_event_id UUID REFERENCES timeline_events ON DELETE CASCADE NOT NULL,
  successor_event_id UUID REFERENCES timeline_events ON DELETE CASCADE NOT NULL,
  dependency_type TEXT NOT NULL, -- 'finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish'
  lag_time INTEGER NOT NULL DEFAULT 0, -- In minutes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(predecessor_event_id, successor_event_id)
);

-- Create timeline_participants table for tracking who is involved in each event
CREATE TABLE IF NOT EXISTS timeline_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES timeline_events ON DELETE CASCADE NOT NULL,
  participant_type TEXT NOT NULL, -- 'client', 'vendor', 'guest', 'staff'
  participant_id UUID, -- Could reference clients, vendors, guests, or staff
  participant_name TEXT NOT NULL,
  role TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create timeline_notifications table for sending reminders about timeline events
CREATE TABLE IF NOT EXISTS timeline_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES timeline_events ON DELETE CASCADE NOT NULL,
  recipient_type TEXT NOT NULL, -- 'client', 'vendor', 'staff'
  recipient_id UUID,
  recipient_email TEXT,
  notification_type TEXT NOT NULL, -- 'email', 'sms', 'push'
  notification_time TIMESTAMPTZ NOT NULL,
  sent BOOLEAN NOT NULL DEFAULT FALSE,
  sent_at TIMESTAMPTZ,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create timeline_shares table for sharing timelines with clients, vendors, etc.
CREATE TABLE IF NOT EXISTS timeline_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timeline_id UUID REFERENCES timelines ON DELETE CASCADE NOT NULL,
  shared_by UUID REFERENCES auth.users NOT NULL,
  shared_with_email TEXT NOT NULL,
  shared_with_name TEXT,
  access_type TEXT NOT NULL DEFAULT 'view', -- 'view', 'edit'
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create timeline_exports table for tracking timeline exports
CREATE TABLE IF NOT EXISTS timeline_exports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timeline_id UUID REFERENCES timelines ON DELETE CASCADE NOT NULL,
  exported_by UUID REFERENCES auth.users NOT NULL,
  export_format TEXT NOT NULL, -- 'pdf', 'excel', 'ics'
  file_url TEXT,
  include_details BOOLEAN NOT NULL DEFAULT TRUE,
  include_critical_path BOOLEAN NOT NULL DEFAULT TRUE,
  include_responsible_parties BOOLEAN NOT NULL DEFAULT TRUE,
  include_notes BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE timelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_event_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_exports ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own timelines"
  ON timelines FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own timelines"
  ON timelines FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own timelines"
  ON timelines FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own timelines"
  ON timelines FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for timeline_events based on parent timeline
CREATE POLICY "Users can view events for their timelines"
  ON timeline_events FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM timelines
    WHERE timelines.id = timeline_events.timeline_id
    AND timelines.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert events for their timelines"
  ON timeline_events FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM timelines
    WHERE timelines.id = timeline_events.timeline_id
    AND timelines.user_id = auth.uid()
  ));

CREATE POLICY "Users can update events for their timelines"
  ON timeline_events FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM timelines
    WHERE timelines.id = timeline_events.timeline_id
    AND timelines.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete events for their timelines"
  ON timeline_events FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM timelines
    WHERE timelines.id = timeline_events.timeline_id
    AND timelines.user_id = auth.uid()
  ));

-- Create indexes for better performance
CREATE INDEX idx_timelines_user_id ON timelines(user_id);
CREATE INDEX idx_timelines_client_id ON timelines(client_id);
CREATE INDEX idx_timelines_is_template ON timelines(is_template);
CREATE INDEX idx_timeline_events_timeline_id ON timeline_events(timeline_id);
CREATE INDEX idx_timeline_events_start_time ON timeline_events(start_time);
CREATE INDEX idx_timeline_events_is_critical_path ON timeline_events(is_critical_path);
CREATE INDEX idx_timeline_event_dependencies_predecessor ON timeline_event_dependencies(predecessor_event_id);
CREATE INDEX idx_timeline_event_dependencies_successor ON timeline_event_dependencies(successor_event_id);
CREATE INDEX idx_timeline_participants_event_id ON timeline_participants(event_id);
CREATE INDEX idx_timeline_notifications_event_id ON timeline_notifications(event_id);
CREATE INDEX idx_timeline_notifications_notification_time ON timeline_notifications(notification_time);
CREATE INDEX idx_timeline_shares_timeline_id ON timeline_shares(timeline_id);
CREATE INDEX idx_timeline_shares_token ON timeline_shares(token);
CREATE INDEX idx_timeline_exports_timeline_id ON timeline_exports(timeline_id);
