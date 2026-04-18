-- Create tables for advanced guest management with QR code check-in

-- Modify existing guests table to add QR code related fields
ALTER TABLE guests ADD COLUMN IF NOT EXISTS qr_code_id TEXT UNIQUE;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS qr_code_url TEXT;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS group_id UUID;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS is_group_primary BOOLEAN DEFAULT FALSE;

-- Create guest_groups table for managing family/couple groups
CREATE TABLE IF NOT EXISTS guest_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  client_id UUID REFERENCES clients ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  group_type TEXT NOT NULL, -- 'family', 'couple', 'friends', 'colleagues'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraint to guests table
ALTER TABLE guests ADD CONSTRAINT fk_guest_group
  FOREIGN KEY (group_id) REFERENCES guest_groups(id)
  ON DELETE SET NULL;

-- Create check_in_events table for different wedding events that require check-in
CREATE TABLE IF NOT EXISTS check_in_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  client_id UUID REFERENCES clients ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  location TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create guest_check_ins table for tracking when guests check in
CREATE TABLE IF NOT EXISTS guest_check_ins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES check_in_events ON DELETE CASCADE NOT NULL,
  guest_id UUID REFERENCES guests ON DELETE CASCADE NOT NULL,
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  checked_in_by UUID REFERENCES auth.users,
  check_in_method TEXT NOT NULL, -- 'qr_code', 'manual', 'group'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, guest_id)
);

-- Create guest_badges table for printing name badges
CREATE TABLE IF NOT EXISTS guest_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guest_id UUID REFERENCES guests ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES check_in_events ON DELETE CASCADE NOT NULL,
  badge_template TEXT,
  badge_data JSONB, -- Stores custom fields for the badge
  printed BOOLEAN NOT NULL DEFAULT FALSE,
  printed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(guest_id, event_id)
);

-- Create check_in_settings table for configuring check-in options
CREATE TABLE IF NOT EXISTS check_in_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  event_id UUID REFERENCES check_in_events ON DELETE CASCADE NOT NULL,
  allow_group_check_in BOOLEAN NOT NULL DEFAULT TRUE,
  require_photo BOOLEAN NOT NULL DEFAULT FALSE,
  collect_signature BOOLEAN NOT NULL DEFAULT FALSE,
  custom_fields JSONB,
  notification_email TEXT,
  send_notifications BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

-- Create check_in_stations table for tracking different check-in stations
CREATE TABLE IF NOT EXISTS check_in_stations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  event_id UUID REFERENCES check_in_events ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  device_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create guest_accommodations table for tracking special needs
CREATE TABLE IF NOT EXISTS guest_accommodations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guest_id UUID REFERENCES guests ON DELETE CASCADE NOT NULL,
  accommodation_type TEXT NOT NULL, -- 'dietary', 'accessibility', 'seating', 'other'
  description TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE guest_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_in_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_in_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_in_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_accommodations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own guest groups"
  ON guest_groups FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own guest groups"
  ON guest_groups FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own guest groups"
  ON guest_groups FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own guest groups"
  ON guest_groups FOR DELETE
  USING (auth.uid() = user_id);

-- Similar policies for check_in_events
CREATE POLICY "Users can view their own check-in events"
  ON check_in_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own check-in events"
  ON check_in_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own check-in events"
  ON check_in_events FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own check-in events"
  ON check_in_events FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for guest_check_ins based on parent event
CREATE POLICY "Users can view check-ins for their events"
  ON guest_check_ins FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM check_in_events
    WHERE check_in_events.id = guest_check_ins.event_id
    AND check_in_events.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert check-ins for their events"
  ON guest_check_ins FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM check_in_events
    WHERE check_in_events.id = guest_check_ins.event_id
    AND check_in_events.user_id = auth.uid()
  ));

-- Create indexes for better performance
CREATE INDEX idx_guests_qr_code_id ON guests(qr_code_id);
CREATE INDEX idx_guests_group_id ON guests(group_id);
CREATE INDEX idx_guest_groups_user_id ON guest_groups(user_id);
CREATE INDEX idx_guest_groups_client_id ON guest_groups(client_id);
CREATE INDEX idx_check_in_events_user_id ON check_in_events(user_id);
CREATE INDEX idx_check_in_events_client_id ON check_in_events(client_id);
CREATE INDEX idx_check_in_events_event_date ON check_in_events(event_date);
CREATE INDEX idx_guest_check_ins_event_id ON guest_check_ins(event_id);
CREATE INDEX idx_guest_check_ins_guest_id ON guest_check_ins(guest_id);
CREATE INDEX idx_guest_check_ins_checked_in_at ON guest_check_ins(checked_in_at);
CREATE INDEX idx_guest_badges_guest_id ON guest_badges(guest_id);
CREATE INDEX idx_guest_badges_event_id ON guest_badges(event_id);
CREATE INDEX idx_check_in_settings_event_id ON check_in_settings(event_id);
CREATE INDEX idx_check_in_stations_event_id ON check_in_stations(event_id);
CREATE INDEX idx_guest_accommodations_guest_id ON guest_accommodations(guest_id);
