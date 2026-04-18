-- Create tables for advanced analytics dashboard

-- Create leads table for tracking potential clients
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  estimated_budget DECIMAL(10,2),
  wedding_date DATE,
  lead_source TEXT, -- 'website', 'referral', 'social_media', 'wedding_fair', 'advertisement'
  lead_status TEXT NOT NULL DEFAULT 'inquiry', -- 'inquiry', 'contacted', 'meeting_scheduled', 'proposal_sent', 'contract_sent', 'converted', 'lost'
  first_contact_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_contact_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  converted BOOLEAN NOT NULL DEFAULT FALSE,
  converted_date TIMESTAMPTZ,
  converted_client_id UUID REFERENCES clients,
  lost_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create lead_activities table for tracking interactions with leads
CREATE TABLE IF NOT EXISTS lead_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  lead_id UUID REFERENCES leads ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL, -- 'email', 'call', 'meeting', 'proposal', 'contract', 'follow_up'
  activity_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  description TEXT,
  outcome TEXT,
  next_steps TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create revenue_forecasts table for tracking projected revenue
CREATE TABLE IF NOT EXISTS revenue_forecasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  month DATE NOT NULL, -- First day of the month
  confirmed_revenue DECIMAL(10,2) NOT NULL DEFAULT 0,
  projected_revenue DECIMAL(10,2) NOT NULL DEFAULT 0,
  potential_revenue DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month)
);

-- Create business_metrics table for tracking key performance indicators
CREATE TABLE IF NOT EXISTS business_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  metric_date DATE NOT NULL,
  metric_type TEXT NOT NULL, -- 'revenue', 'leads', 'conversions', 'average_wedding_value', 'client_satisfaction'
  metric_value DECIMAL(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, metric_date, metric_type)
);

-- Create popular_services table for tracking most requested services
CREATE TABLE IF NOT EXISTS popular_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  service_name TEXT NOT NULL,
  category TEXT,
  request_count INTEGER NOT NULL DEFAULT 0,
  revenue_generated DECIMAL(10,2) NOT NULL DEFAULT 0,
  month DATE NOT NULL, -- First day of the month
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, service_name, month)
);

-- Create seasonal_trends table for tracking wedding patterns throughout the year
CREATE TABLE IF NOT EXISTS seasonal_trends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,
  wedding_count INTEGER NOT NULL DEFAULT 0,
  inquiry_count INTEGER NOT NULL DEFAULT 0,
  average_budget DECIMAL(10,2),
  popular_venues TEXT[],
  popular_themes TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month, year)
);

-- Create client_satisfaction table for tracking client feedback
CREATE TABLE IF NOT EXISTS client_satisfaction (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  client_id UUID REFERENCES clients ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  feedback TEXT,
  survey_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE popular_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasonal_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_satisfaction ENABLE ROW LEVEL SECURITY;

-- Create policies (only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own leads') THEN
    CREATE POLICY "Users can view their own leads"
      ON leads FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own leads') THEN
    CREATE POLICY "Users can insert their own leads"
      ON leads FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own leads') THEN
    CREATE POLICY "Users can update their own leads"
      ON leads FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own leads') THEN
    CREATE POLICY "Users can delete their own leads"
      ON leads FOR DELETE
      USING (auth.uid() = user_id);
  END IF;

  -- Similar policies for other tables
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own lead activities') THEN
    CREATE POLICY "Users can view their own lead activities"
      ON lead_activities FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own lead activities') THEN
    CREATE POLICY "Users can insert their own lead activities"
      ON lead_activities FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own lead activities') THEN
    CREATE POLICY "Users can update their own lead activities"
      ON lead_activities FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own lead activities') THEN
    CREATE POLICY "Users can delete their own lead activities"
      ON lead_activities FOR DELETE
      USING (auth.uid() = user_id);
  END IF;

  -- Policies for revenue_forecasts
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own revenue forecasts') THEN
    CREATE POLICY "Users can view their own revenue forecasts"
      ON revenue_forecasts FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own revenue forecasts') THEN
    CREATE POLICY "Users can insert their own revenue forecasts"
      ON revenue_forecasts FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own revenue forecasts') THEN
    CREATE POLICY "Users can update their own revenue forecasts"
      ON revenue_forecasts FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own revenue forecasts') THEN
    CREATE POLICY "Users can delete their own revenue forecasts"
      ON revenue_forecasts FOR DELETE
      USING (auth.uid() = user_id);
  END IF;

  -- Policies for business_metrics
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own business metrics') THEN
    CREATE POLICY "Users can view their own business metrics"
      ON business_metrics FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own business metrics') THEN
    CREATE POLICY "Users can insert their own business metrics"
      ON business_metrics FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own business metrics') THEN
    CREATE POLICY "Users can update their own business metrics"
      ON business_metrics FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own business metrics') THEN
    CREATE POLICY "Users can delete their own business metrics"
      ON business_metrics FOR DELETE
      USING (auth.uid() = user_id);
  END IF;

  -- Policies for popular_services
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own popular services') THEN
    CREATE POLICY "Users can view their own popular services"
      ON popular_services FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own popular services') THEN
    CREATE POLICY "Users can insert their own popular services"
      ON popular_services FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own popular services') THEN
    CREATE POLICY "Users can update their own popular services"
      ON popular_services FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own popular services') THEN
    CREATE POLICY "Users can delete their own popular services"
      ON popular_services FOR DELETE
      USING (auth.uid() = user_id);
  END IF;

  -- Policies for seasonal_trends
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own seasonal trends') THEN
    CREATE POLICY "Users can view their own seasonal trends"
      ON seasonal_trends FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own seasonal trends') THEN
    CREATE POLICY "Users can insert their own seasonal trends"
      ON seasonal_trends FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own seasonal trends') THEN
    CREATE POLICY "Users can update their own seasonal trends"
      ON seasonal_trends FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own seasonal trends') THEN
    CREATE POLICY "Users can delete their own seasonal trends"
      ON seasonal_trends FOR DELETE
      USING (auth.uid() = user_id);
  END IF;

  -- Policies for client_satisfaction
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own client satisfaction') THEN
    CREATE POLICY "Users can view their own client satisfaction"
      ON client_satisfaction FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own client satisfaction') THEN
    CREATE POLICY "Users can insert their own client satisfaction"
      ON client_satisfaction FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own client satisfaction') THEN
    CREATE POLICY "Users can update their own client satisfaction"
      ON client_satisfaction FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own client satisfaction') THEN
    CREATE POLICY "Users can delete their own client satisfaction"
      ON client_satisfaction FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create indexes for better performance
DO $$
BEGIN
  -- Create indexes for leads table
  CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);

  -- Check if lead_status column exists before creating index
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'leads'
    AND column_name = 'lead_status'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_leads_lead_status ON leads(lead_status);
  ELSIF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'leads'
    AND column_name = 'status'
  ) THEN
    -- If the column is named 'status' instead of 'lead_status'
    CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
  END IF;

  -- Check if wedding_date column exists before creating index
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'leads'
    AND column_name = 'wedding_date'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_leads_wedding_date ON leads(wedding_date);
  END IF;

  -- Check if converted column exists before creating index
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'leads'
    AND column_name = 'converted'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_leads_converted ON leads(converted);
  END IF;

  -- Create indexes for lead_activities table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lead_activities') THEN
    CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON lead_activities(lead_id);
    CREATE INDEX IF NOT EXISTS idx_lead_activities_activity_date ON lead_activities(activity_date);
  END IF;

  -- Create indexes for revenue_forecasts table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'revenue_forecasts') THEN
    -- Check which column exists: month or forecast_date
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'revenue_forecasts'
      AND column_name = 'month'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_revenue_forecasts_user_id_month ON revenue_forecasts(user_id, month);
    ELSIF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'revenue_forecasts'
      AND column_name = 'forecast_date'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_revenue_forecasts_user_id_date ON revenue_forecasts(user_id, forecast_date);
    END IF;
  END IF;

  -- Create indexes for business_metrics table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'business_metrics') THEN
    -- Check if metric_date column exists
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'business_metrics'
      AND column_name = 'metric_date'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_business_metrics_user_id_date ON business_metrics(user_id, metric_date);
    END IF;

    -- Check if metric_type column exists
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'business_metrics'
      AND column_name = 'metric_type'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_business_metrics_metric_type ON business_metrics(metric_type);
    END IF;
  END IF;

  -- Create indexes for popular_services table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'popular_services') THEN
    -- Check if month column exists as DATE or INTEGER
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'popular_services'
      AND column_name = 'month'
      AND data_type = 'date'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_popular_services_user_id_month ON popular_services(user_id, month);
    ELSIF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'popular_services'
      AND column_name = 'month'
      AND data_type = 'integer'
    ) THEN
      -- If month is integer, check if year exists too
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'popular_services'
        AND column_name = 'year'
      ) THEN
        CREATE INDEX IF NOT EXISTS idx_popular_services_user_id_month_year ON popular_services(user_id, month, year);
      ELSE
        CREATE INDEX IF NOT EXISTS idx_popular_services_user_id_month ON popular_services(user_id, month);
      END IF;
    END IF;
  END IF;

  -- Create indexes for seasonal_trends table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'seasonal_trends') THEN
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'seasonal_trends'
      AND column_name = 'year'
    ) AND EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'seasonal_trends'
      AND column_name = 'month'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_seasonal_trends_user_id_year_month ON seasonal_trends(user_id, year, month);
    END IF;
  END IF;

  -- Create indexes for client_satisfaction table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_satisfaction') THEN
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'client_satisfaction'
      AND column_name = 'client_id'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_client_satisfaction_client_id ON client_satisfaction(client_id);
    END IF;
  END IF;
END $$;
