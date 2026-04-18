-- Check if subscription_plan type exists, if not create it
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_plan') THEN
    CREATE TYPE subscription_plan AS ENUM ('free', 'starter', 'pro');
  END IF;
END $$;

-- Check if subscription_status type exists, if not create it
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
    CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'trialing');
  END IF;
END $$;

-- Check if subscriptions table exists, if not create it
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id subscription_plan NOT NULL DEFAULT 'free',
  status subscription_status NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'subscriptions' AND policyname = 'Users can view their own subscriptions'
  ) THEN
    ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

    -- Allow users to view their own subscriptions
    CREATE POLICY "Users can view their own subscriptions"
      ON subscriptions
      FOR SELECT
      USING (auth.uid() = user_id);

    -- Allow users to insert their own subscriptions
    CREATE POLICY "Users can insert their own subscriptions"
      ON subscriptions
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);

    -- Allow users to update their own subscriptions
    CREATE POLICY "Users can update their own subscriptions"
      ON subscriptions
      FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Check if set_updated_at function exists, if not create it
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at') THEN
    -- Create function to set updated_at on update
    CREATE OR REPLACE FUNCTION set_updated_at()
    RETURNS TRIGGER AS $BODY$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $BODY$ LANGUAGE plpgsql;
  END IF;
END $$;

-- Create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'set_subscriptions_updated_at'
  ) THEN
    -- Create trigger to set updated_at on update
    CREATE TRIGGER set_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

-- Create index if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_subscriptions_user_id'
  ) THEN
    -- Create index on user_id for faster lookups
    CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
  END IF;
END $$;

-- Update subscriptions table to support payment processing
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS payment_method_id TEXT,
ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly',
ADD COLUMN IF NOT EXISTS trial_end TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS price_id TEXT;

-- Create payment_methods table to store payment information
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_payment_method_id TEXT NOT NULL,
  card_brand TEXT,
  card_last4 TEXT,
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies for payment_methods
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own payment methods
CREATE POLICY "Users can view their own payment methods"
  ON payment_methods
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert their own payment methods
CREATE POLICY "Users can insert their own payment methods"
  ON payment_methods
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own payment methods
CREATE POLICY "Users can update their own payment methods"
  ON payment_methods
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow users to delete their own payment methods
CREATE POLICY "Users can delete their own payment methods"
  ON payment_methods
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger to set updated_at on payment_methods update
CREATE TRIGGER set_payment_methods_updated_at
BEFORE UPDATE ON payment_methods
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Create index on user_id for faster lookups
CREATE INDEX idx_payment_methods_user_id ON payment_methods(user_id);

-- Create subscription_limits table to store plan limits
CREATE TABLE IF NOT EXISTS subscription_limits (
  plan_id subscription_plan PRIMARY KEY,
  max_clients INTEGER NOT NULL,
  max_vendors INTEGER NOT NULL,
  max_guests INTEGER NOT NULL,
  budget_tracking BOOLEAN NOT NULL,
  invoicing BOOLEAN NOT NULL,
  seating_charts BOOLEAN NOT NULL,
  meal_planning BOOLEAN NOT NULL,
  design_suggestions BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default subscription limits
INSERT INTO subscription_limits (
  plan_id,
  max_clients,
  max_vendors,
  max_guests,
  budget_tracking,
  invoicing,
  seating_charts,
  meal_planning,
  design_suggestions
) VALUES
('free', 3, 5, 30, false, false, false, false, false),
('starter', 999999, 999999, 150, true, true, false, false, false),
('pro', 999999, 999999, 999999, true, true, true, true, true)
ON CONFLICT (plan_id) DO UPDATE SET
  max_clients = EXCLUDED.max_clients,
  max_vendors = EXCLUDED.max_vendors,
  max_guests = EXCLUDED.max_guests,
  budget_tracking = EXCLUDED.budget_tracking,
  invoicing = EXCLUDED.invoicing,
  seating_charts = EXCLUDED.seating_charts,
  meal_planning = EXCLUDED.meal_planning,
  design_suggestions = EXCLUDED.design_suggestions,
  updated_at = now();

-- Create function to check if a user has access to a feature
CREATE OR REPLACE FUNCTION has_feature_access(user_uuid UUID, feature_name TEXT)
RETURNS BOOLEAN AS $FUNC$
DECLARE
  plan subscription_plan;
  has_access BOOLEAN;
BEGIN
  -- Get the user's current subscription plan
  SELECT plan_id INTO plan
  FROM subscriptions
  WHERE user_id = user_uuid
  AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;

  -- Default to free plan if no subscription found
  plan := COALESCE(plan, 'free'::subscription_plan);

  -- Check if the plan has access to the feature
  SELECT
    CASE
      WHEN feature_name = 'budget_tracking' THEN budget_tracking
      WHEN feature_name = 'invoicing' THEN invoicing
      WHEN feature_name = 'seating_charts' THEN seating_charts
      WHEN feature_name = 'meal_planning' THEN meal_planning
      WHEN feature_name = 'design_suggestions' THEN design_suggestions
      ELSE false
    END INTO has_access
  FROM subscription_limits
  WHERE plan_id = plan;

  RETURN COALESCE(has_access, false);
END;
$FUNC$ LANGUAGE plpgsql;

-- Create function to check if a user is within their plan limits
CREATE OR REPLACE FUNCTION is_within_plan_limits(user_uuid UUID, resource_type TEXT, count INTEGER)
RETURNS BOOLEAN AS $FUNC$
DECLARE
  plan subscription_plan;
  max_limit INTEGER;
BEGIN
  -- Get the user's current subscription plan
  SELECT plan_id INTO plan
  FROM subscriptions
  WHERE user_id = user_uuid
  AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;

  -- Default to free plan if no subscription found
  plan := COALESCE(plan, 'free'::subscription_plan);

  -- Get the limit for the resource type
  SELECT
    CASE
      WHEN resource_type = 'clients' THEN max_clients
      WHEN resource_type = 'vendors' THEN max_vendors
      WHEN resource_type = 'guests' THEN max_guests
      ELSE 0
    END INTO max_limit
  FROM subscription_limits
  WHERE plan_id = plan;

  -- Check if the count is within the limit
  RETURN count <= max_limit;
END;
$FUNC$ LANGUAGE plpgsql;

-- Create function to get user's current subscription plan if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_user_subscription_plan') THEN
    CREATE OR REPLACE FUNCTION get_user_subscription_plan(user_uuid UUID)
    RETURNS subscription_plan AS $BODY$
    DECLARE
      plan subscription_plan;
    BEGIN
      SELECT plan_id INTO plan
      FROM subscriptions
      WHERE user_id = user_uuid
      AND status = 'active'
      ORDER BY created_at DESC
      LIMIT 1;

      RETURN COALESCE(plan, 'free'::subscription_plan);
    END;
    $BODY$ LANGUAGE plpgsql;
  END IF;
END $$;
