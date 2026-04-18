-- Create meal_type enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'meal_type') THEN
    CREATE TYPE meal_type AS ENUM ('breakfast', 'lunch', 'dinner', 'cocktail');
  END IF;
END $$;

-- Create meal_plans table
CREATE TABLE IF NOT EXISTS meal_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  client_id UUID REFERENCES clients ON DELETE CASCADE,
  name TEXT NOT NULL,
  event_date DATE,
  meal_type meal_type NOT NULL,
  guest_count INTEGER,
  budget_per_person DECIMAL(10,2),
  location TEXT,
  season TEXT,
  cultural_requirements TEXT,
  preferences TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create meal_items table
CREATE TABLE IF NOT EXISTS meal_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meal_plan_id UUID REFERENCES meal_plans ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  course TEXT NOT NULL, -- 'starter', 'main', 'dessert', 'beverage', 'snack'
  is_vegetarian BOOLEAN DEFAULT false,
  is_vegan BOOLEAN DEFAULT false,
  is_gluten_free BOOLEAN DEFAULT false,
  is_dairy_free BOOLEAN DEFAULT false,
  is_nut_free BOOLEAN DEFAULT false,
  contains_alcohol BOOLEAN DEFAULT false,
  estimated_cost_per_person DECIMAL(10,2),
  image_url TEXT,
  seasonality TEXT[], -- Array of seasons when this dish is best
  region TEXT, -- Region or cuisine type
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create dietary_restrictions table to track guest dietary needs
CREATE TABLE IF NOT EXISTS dietary_restrictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guest_id UUID REFERENCES guests ON DELETE CASCADE,
  restriction_type TEXT NOT NULL, -- 'vegetarian', 'vegan', 'gluten_free', 'dairy_free', 'nut_allergy', 'shellfish_allergy', 'kosher', 'halal', etc.
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE dietary_restrictions ENABLE ROW LEVEL SECURITY;

-- Create policies for meal_plans
CREATE POLICY "Users can view their own meal plans"
  ON meal_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meal plans"
  ON meal_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meal plans"
  ON meal_plans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meal plans"
  ON meal_plans FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for meal_items
CREATE POLICY "Users can view their own meal items"
  ON meal_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM meal_plans
      WHERE meal_plans.id = meal_items.meal_plan_id
      AND meal_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own meal items"
  ON meal_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM meal_plans
      WHERE meal_plans.id = meal_items.meal_plan_id
      AND meal_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own meal items"
  ON meal_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM meal_plans
      WHERE meal_plans.id = meal_items.meal_plan_id
      AND meal_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own meal items"
  ON meal_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM meal_plans
      WHERE meal_plans.id = meal_items.meal_plan_id
      AND meal_plans.user_id = auth.uid()
    )
  );

-- Create policies for dietary_restrictions
CREATE POLICY "Users can view their guests' dietary restrictions"
  ON dietary_restrictions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM guests
      JOIN clients ON guests.client_id = clients.id
      WHERE guests.id = dietary_restrictions.guest_id
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their guests' dietary restrictions"
  ON dietary_restrictions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM guests
      JOIN clients ON guests.client_id = clients.id
      WHERE guests.id = dietary_restrictions.guest_id
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their guests' dietary restrictions"
  ON dietary_restrictions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM guests
      JOIN clients ON guests.client_id = clients.id
      WHERE guests.id = dietary_restrictions.guest_id
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their guests' dietary restrictions"
  ON dietary_restrictions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM guests
      JOIN clients ON guests.client_id = clients.id
      WHERE guests.id = dietary_restrictions.guest_id
      AND clients.user_id = auth.uid()
    )
  );
