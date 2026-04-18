-- Create tables for advanced guest management with QR code check-in

-- Add check-in related fields to existing guests table
ALTER TABLE guests ADD COLUMN IF NOT EXISTS qr_code TEXT;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS checked_in BOOLEAN DEFAULT false;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS check_in_time TIMESTAMPTZ;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS check_in_notes TEXT;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS special_accommodations TEXT;

-- Create guest_groups table for family/couple grouping
CREATE TABLE IF NOT EXISTS guest_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  client_id UUID REFERENCES clients ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'family', -- 'family', 'couple', 'individual', etc.
  qr_code TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add group_id to guests table
ALTER TABLE guests ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES guest_groups ON DELETE SET NULL;

-- Create check_in_events table to track check-in events
CREATE TABLE IF NOT EXISTS check_in_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  client_id UUID REFERENCES clients ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  event_date DATE NOT NULL,
  location TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create check_in_records table to track individual check-ins
CREATE TABLE IF NOT EXISTS check_in_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES check_in_events ON DELETE CASCADE NOT NULL,
  guest_id UUID REFERENCES guests ON DELETE CASCADE NOT NULL,
  check_in_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  checked_in_by TEXT, -- Name or email of person who checked in the guest
  method TEXT DEFAULT 'qr', -- 'qr', 'manual', etc.
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, guest_id)
);

-- Create check_in_stations table to track devices used for check-in
CREATE TABLE IF NOT EXISTS check_in_stations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  event_id UUID REFERENCES check_in_events ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  device_id TEXT,
  is_active BOOLEAN DEFAULT true,
  last_active TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE guest_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_in_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_in_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_in_stations ENABLE ROW LEVEL SECURITY;

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

-- Similar policies for other tables
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

-- Create indexes for better performance
CREATE INDEX idx_guests_group_id ON guests(group_id);
CREATE INDEX idx_guests_qr_code ON guests(qr_code);
CREATE INDEX idx_guest_groups_client_id ON guest_groups(client_id);
CREATE INDEX idx_check_in_events_client_id ON check_in_events(client_id);
CREATE INDEX idx_check_in_records_event_id ON check_in_records(event_id);
CREATE INDEX idx_check_in_records_guest_id ON check_in_records(guest_id);
CREATE INDEX idx_check_in_stations_event_id ON check_in_stations(event_id);
