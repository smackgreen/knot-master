-- Create table_shape enum type if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'table_shape') THEN
    CREATE TYPE table_shape AS ENUM ('round', 'rectangular', 'square', 'custom');
  END IF;
END $$;

-- Create tables table for seating arrangements
CREATE TABLE IF NOT EXISTS tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  client_id UUID REFERENCES clients ON DELETE CASCADE,
  name TEXT NOT NULL,
  shape table_shape DEFAULT 'round',
  width NUMERIC DEFAULT 100,
  height NUMERIC DEFAULT 100,
  position_x NUMERIC DEFAULT 0,
  position_y NUMERIC DEFAULT 0,
  capacity INTEGER DEFAULT 8,
  rotation NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create seating_charts table to store floor plans
CREATE TABLE IF NOT EXISTS seating_charts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  client_id UUID REFERENCES clients ON DELETE CASCADE,
  name TEXT NOT NULL,
  width NUMERIC DEFAULT 1000,
  height NUMERIC DEFAULT 800,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Modify guests table to reference tables instead of just a string
ALTER TABLE guests
  ADD COLUMN IF NOT EXISTS table_id UUID REFERENCES tables ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS seat_position INTEGER;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tables_user_id ON tables(user_id);
CREATE INDEX IF NOT EXISTS idx_tables_client_id ON tables(client_id);
CREATE INDEX IF NOT EXISTS idx_seating_charts_user_id ON seating_charts(user_id);
CREATE INDEX IF NOT EXISTS idx_seating_charts_client_id ON seating_charts(client_id);

-- Enable RLS
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE seating_charts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own tables"
  ON tables FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tables"
  ON tables FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tables"
  ON tables FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tables"
  ON tables FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own seating charts"
  ON seating_charts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own seating charts"
  ON seating_charts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own seating charts"
  ON seating_charts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own seating charts"
  ON seating_charts FOR DELETE
  USING (auth.uid() = user_id);
