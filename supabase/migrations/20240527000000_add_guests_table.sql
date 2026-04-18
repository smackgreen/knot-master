-- Create guest_status enum type if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'guest_status') THEN
    CREATE TYPE guest_status AS ENUM ('invited', 'confirmed', 'declined', 'pending');
  END IF;
END $$;

-- Create guests table
CREATE TABLE IF NOT EXISTS guests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  client_id UUID REFERENCES clients ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'USA',
  status guest_status DEFAULT 'pending',
  rsvp_status TEXT,
  meal_preference TEXT,
  plus_one BOOLEAN DEFAULT false,
  plus_one_name TEXT,
  table_assignment TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_guests_user_id ON guests(user_id);
CREATE INDEX IF NOT EXISTS idx_guests_client_id ON guests(client_id);

-- Enable RLS
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'guests' AND policyname = 'Users can view their own guests'
  ) THEN
    CREATE POLICY "Users can view their own guests"
      ON guests FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'guests' AND policyname = 'Users can insert their own guests'
  ) THEN
    CREATE POLICY "Users can insert their own guests"
      ON guests FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'guests' AND policyname = 'Users can update their own guests'
  ) THEN
    CREATE POLICY "Users can update their own guests"
      ON guests FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'guests' AND policyname = 'Users can delete their own guests'
  ) THEN
    CREATE POLICY "Users can delete their own guests"
      ON guests FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;
