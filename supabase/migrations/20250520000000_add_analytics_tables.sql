-- Create analytics tables for revenue tracking and forecasting

-- Create lead_status enum type
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_status') THEN
    CREATE TYPE lead_status AS ENUM ('inquiry', 'contacted', 'meeting_scheduled', 'proposal_sent', 'contract_sent', 'converted', 'lost');
  END IF;
END $$;

-- Create lead_source enum type
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_source') THEN
    CREATE TYPE lead_source AS ENUM ('website', 'referral', 'social_media', 'wedding_fair', 'advertisement', 'other');
  END IF;
END $$;

-- Create leads table to track potential clients
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  partner_name TEXT,
  email TEXT,
  phone TEXT,
  wedding_date DATE,
  venue TEXT,
  estimated_budget DECIMAL(10,2),
  notes TEXT,
  status lead_status DEFAULT 'inquiry',
  source lead_source DEFAULT 'website',
  first_contact_date DATE NOT NULL DEFAULT CURRENT_DATE,
  last_contact_date DATE,
  converted_date DATE,
  lost_date DATE,
  lost_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create revenue_forecasts table
CREATE TABLE IF NOT EXISTS revenue_forecasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  forecast_date DATE NOT NULL,
  confirmed_revenue DECIMAL(10,2) DEFAULT 0,
  projected_revenue DECIMAL(10,2) DEFAULT 0,
  potential_revenue DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, forecast_date)
);

-- Create revenue_sources table to track where revenue comes from
CREATE TABLE IF NOT EXISTS revenue_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  source_name TEXT NOT NULL,
  source_type TEXT NOT NULL, -- 'service', 'product', 'commission', etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, source_name)
);

-- Create revenue_entries table to track actual revenue
CREATE TABLE IF NOT EXISTS revenue_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  client_id UUID REFERENCES clients ON DELETE SET NULL,
  invoice_id UUID REFERENCES invoices ON DELETE SET NULL,
  source_id UUID REFERENCES revenue_sources ON DELETE SET NULL,
  entry_date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create business_metrics table for tracking KPIs
CREATE TABLE IF NOT EXISTS business_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  metric_date DATE NOT NULL,
  new_leads INTEGER DEFAULT 0,
  converted_leads INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  average_wedding_value DECIMAL(10,2) DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, metric_date)
);

-- Create popular_services table to track most requested services
CREATE TABLE IF NOT EXISTS popular_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  service_name TEXT NOT NULL,
  request_count INTEGER DEFAULT 0,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, service_name, month, year)
);

-- Add RLS policies
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE popular_services ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own leads"
  ON leads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own leads"
  ON leads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leads"
  ON leads FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own leads"
  ON leads FOR DELETE
  USING (auth.uid() = user_id);

-- Similar policies for other tables
CREATE POLICY "Users can view their own revenue forecasts"
  ON revenue_forecasts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own revenue forecasts"
  ON revenue_forecasts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own revenue forecasts"
  ON revenue_forecasts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own revenue forecasts"
  ON revenue_forecasts FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_leads_user_id ON leads(user_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_revenue_forecasts_user_id ON revenue_forecasts(user_id);
CREATE INDEX idx_revenue_forecasts_date ON revenue_forecasts(forecast_date);
CREATE INDEX idx_revenue_entries_user_id ON revenue_entries(user_id);
CREATE INDEX idx_revenue_entries_client_id ON revenue_entries(client_id);
CREATE INDEX idx_revenue_entries_date ON revenue_entries(entry_date);
CREATE INDEX idx_business_metrics_user_id ON business_metrics(user_id);
CREATE INDEX idx_business_metrics_date ON business_metrics(metric_date);
CREATE INDEX idx_popular_services_user_id ON popular_services(user_id);
CREATE INDEX idx_popular_services_month_year ON popular_services(month, year);
