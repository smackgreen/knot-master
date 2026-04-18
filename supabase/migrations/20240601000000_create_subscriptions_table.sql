-- Create subscription plans enum
CREATE TYPE subscription_plan AS ENUM ('free', 'starter', 'pro');

-- Create subscription status enum
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'trialing');

-- Create subscriptions table
CREATE TABLE subscriptions (
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

-- Add RLS policies
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

-- Create function to set updated_at on update
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to set updated_at on update
CREATE TRIGGER set_subscriptions_updated_at
BEFORE UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Create index on user_id for faster lookups
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);

-- Create function to get user's current subscription plan
CREATE OR REPLACE FUNCTION get_user_subscription_plan(user_uuid UUID)
RETURNS subscription_plan AS $$
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
$$ LANGUAGE plpgsql;
