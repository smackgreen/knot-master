-- =====================================================================
-- Knot To It - Wedding Planner CRM : COMPLETE DATABASE SCHEMA
-- Consolidated from all migrations. Run this in a fresh Supabase project.
-- =====================================================================

-- =====================================================================
-- EXTENSIONS
-- =====================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================================
-- ENUM TYPES
-- =====================================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vendor_category') THEN
    CREATE TYPE vendor_category AS ENUM (
      'venue','catering','photography','videography','florist','music',
      'cake','attire','hair_makeup','transportation','rentals','stationery',
      'gifts','other'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'client_status') THEN
    CREATE TYPE client_status AS ENUM ('active','completed','cancelled');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
    CREATE TYPE task_status AS ENUM ('not_started','in_progress','completed','overdue');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_priority') THEN
    CREATE TYPE task_priority AS ENUM ('low','medium','high');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_status') THEN
    CREATE TYPE invoice_status AS ENUM ('draft','sent','paid','overdue');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quotation_status') THEN
    CREATE TYPE quotation_status AS ENUM ('draft','sent','accepted','rejected');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'guest_status') THEN
    CREATE TYPE guest_status AS ENUM ('invited','confirmed','declined','pending');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'table_shape') THEN
    CREATE TYPE table_shape AS ENUM ('round','rectangular','square','custom');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contract_status') THEN
    CREATE TYPE contract_status AS ENUM ('draft','sent','signed','expired','cancelled');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contract_category') THEN
    CREATE TYPE contract_category AS ENUM ('client','vendor','planning','other');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_plan') THEN
    CREATE TYPE subscription_plan AS ENUM ('free','starter','pro');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
    CREATE TYPE subscription_status AS ENUM ('active','canceled','past_due','trialing');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'color_scheme_type') THEN
    CREATE TYPE color_scheme_type AS ENUM ('primary','accent','neutral');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'meal_type') THEN
    CREATE TYPE meal_type AS ENUM ('breakfast','lunch','dinner','cocktail');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_status') THEN
    CREATE TYPE lead_status AS ENUM ('inquiry','contacted','meeting_scheduled','proposal_sent','contract_sent','converted','lost');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_source') THEN
    CREATE TYPE lead_source AS ENUM ('website','referral','social_media','wedding_fair','advertisement','other');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dependency_type') THEN
    CREATE TYPE dependency_type AS ENUM ('finish_to_start','start_to_start','finish_to_finish','start_to_finish');
  END IF;
END $$;

-- =====================================================================
-- SHARED FUNCTIONS
-- =====================================================================
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- PROFILES (extends auth.users)
-- =====================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT UNIQUE,
  name TEXT,
  profile_image TEXT,
  wedding_date DATE,
  company_name TEXT,
  company_address TEXT,
  company_city TEXT,
  company_phone TEXT,
  company_email TEXT,
  company_website TEXT,
  company_logo TEXT,
  company_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- CLIENTS (core entity)
-- =====================================================================
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  partner_name TEXT,
  email TEXT,
  phone TEXT,
  wedding_date DATE,
  venue TEXT,
  notes TEXT,
  status client_status DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  client_id UUID REFERENCES clients ON DELETE CASCADE,
  name TEXT NOT NULL,
  category vendor_category NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  notes TEXT,
  cost DECIMAL(10,2),
  is_paid BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);



-- =====================================================================
-- TASKS
-- =====================================================================
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  client_id UUID REFERENCES clients ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  status task_status DEFAULT 'not_started',
  priority task_priority DEFAULT 'medium',
  category vendor_category,
  duration INTEGER DEFAULT 60,
  is_critical_path BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- BUDGETS
-- =====================================================================
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  client_id UUID REFERENCES clients ON DELETE CASCADE UNIQUE,
  total_budget DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS budget_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  budget_id UUID REFERENCES budgets ON DELETE CASCADE,
  category vendor_category NOT NULL,
  allocated DECIMAL(10,2) NOT NULL DEFAULT 0,
  spent DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(budget_id, category)
);

-- =====================================================================
-- INVOICES & QUOTATIONS
-- =====================================================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  client_id UUID REFERENCES clients ON DELETE CASCADE,
  number TEXT UNIQUE NOT NULL,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  status invoice_status DEFAULT 'draft',
  subtotal DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  notes TEXT,
  custom_title TEXT,
  legal_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  client_id UUID REFERENCES clients ON DELETE CASCADE,
  number TEXT UNIQUE NOT NULL,
  issue_date DATE NOT NULL,
  valid_until DATE NOT NULL,
  status quotation_status DEFAULT 'draft',
  subtotal DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  notes TEXT,
  custom_title TEXT,
  legal_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quotation_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_id UUID REFERENCES quotations ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- SEATING CHARTS & TABLES
-- =====================================================================
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


-- =====================================================================
-- GUESTS (supports couples, children, QR check-in, seating)
-- =====================================================================
CREATE TABLE IF NOT EXISTS guest_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  client_id UUID REFERENCES clients ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'family',
  qr_code TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS guests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  client_id UUID REFERENCES clients ON DELETE CASCADE,
  table_id UUID REFERENCES tables ON DELETE SET NULL,
  group_id UUID REFERENCES guest_groups ON DELETE SET NULL,
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
  is_couple BOOLEAN DEFAULT false,
  partner_first_name TEXT,
  partner_last_name TEXT,
  partner_email TEXT,
  partner_meal_preference TEXT,
  has_children BOOLEAN DEFAULT false,
  children JSONB,
  table_assignment TEXT,
  seat_position INTEGER,
  qr_code TEXT,
  checked_in BOOLEAN DEFAULT false,
  check_in_time TIMESTAMPTZ,
  check_in_notes TEXT,
  special_accommodations TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS check_in_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES check_in_events ON DELETE CASCADE NOT NULL,
  guest_id UUID REFERENCES guests ON DELETE CASCADE NOT NULL,
  check_in_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  checked_in_by TEXT,
  method TEXT DEFAULT 'qr',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, guest_id)
);

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

-- =====================================================================
-- CONTRACTS
-- =====================================================================
CREATE TABLE IF NOT EXISTS contract_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  category contract_category NOT NULL DEFAULT 'client',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  template_id UUID REFERENCES contract_templates(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  status contract_status NOT NULL DEFAULT 'draft',
  client_signature JSONB,
  vendor_signature JSONB,
  planner_signature JSONB,
  sent_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================================
-- DOCUMENTS & E-SIGNATURE
-- =====================================================================
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  quotation_id UUID REFERENCES quotations(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT document_reference_check CHECK (
    (contract_id IS NOT NULL)::integer +
    (quotation_id IS NOT NULL)::integer +
    (invoice_id IS NOT NULL)::integer = 1
  )
);


CREATE TABLE IF NOT EXISTS electronic_signatures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
  signer_name TEXT NOT NULL,
  signer_email TEXT NOT NULL,
  signer_role TEXT NOT NULL,
  signature_image TEXT NOT NULL,
  ip_address TEXT,
  consent_timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS signature_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_email TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  recipient_role TEXT NOT NULL,
  recipient_phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS signature_request_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  signature_request_id UUID REFERENCES signature_requests(id) ON DELETE CASCADE NOT NULL,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(signature_request_id, document_id)
);

CREATE TABLE IF NOT EXISTS signature_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL,
  actor TEXT,
  actor_role TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS verification_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number TEXT NOT NULL,
  code TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  verified BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- SUBSCRIPTIONS & BILLING
-- =====================================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id subscription_plan NOT NULL DEFAULT 'free',
  status subscription_status NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  payment_method_id TEXT,
  billing_cycle TEXT DEFAULT 'monthly',
  trial_end TIMESTAMPTZ,
  price_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_payment_method_id TEXT NOT NULL,
  card_brand TEXT,
  card_last4 TEXT,
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO subscription_limits (
  plan_id, max_clients, max_vendors, max_guests,
  budget_tracking, invoicing, seating_charts, meal_planning, design_suggestions
) VALUES
  ('free',    3,      5,      30,     false, false, false, false, false),
  ('starter', 999999, 999999, 150,    true,  true,  false, false, false),
  ('pro',     999999, 999999, 999999, true,  true,  true,  true,  true)
ON CONFLICT (plan_id) DO UPDATE SET
  max_clients        = EXCLUDED.max_clients,
  max_vendors        = EXCLUDED.max_vendors,
  max_guests         = EXCLUDED.max_guests,
  budget_tracking    = EXCLUDED.budget_tracking,
  invoicing          = EXCLUDED.invoicing,
  seating_charts     = EXCLUDED.seating_charts,
  meal_planning      = EXCLUDED.meal_planning,
  design_suggestions = EXCLUDED.design_suggestions,
  updated_at         = NOW();

-- =====================================================================
-- OAUTH & CALENDARS
-- =====================================================================
CREATE TABLE IF NOT EXISTS oauth_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_type TEXT,
  expires_at TIMESTAMPTZ,
  scope TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

CREATE TABLE IF NOT EXISTS connected_calendars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL,
  calendar_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  is_selected BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider, calendar_id)
);


-- =====================================================================
-- DESIGN SUGGESTIONS (AI)
-- =====================================================================
CREATE TABLE IF NOT EXISTS design_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  client_id UUID REFERENCES clients ON DELETE CASCADE,
  name TEXT NOT NULL,
  theme TEXT,
  season TEXT,
  preferences TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS color_schemes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  suggestion_id UUID REFERENCES design_suggestions ON DELETE CASCADE,
  name TEXT NOT NULL,
  type color_scheme_type NOT NULL,
  hex_value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS decor_ideas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  suggestion_id UUID REFERENCES design_suggestions ON DELETE CASCADE,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS visualization_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  suggestion_id UUID REFERENCES design_suggestions ON DELETE CASCADE,
  name TEXT NOT NULL,
  venue_image_url TEXT,
  modified_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- MEAL PLANNING (AI)
-- =====================================================================
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

CREATE TABLE IF NOT EXISTS meal_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meal_plan_id UUID REFERENCES meal_plans ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  course TEXT NOT NULL,
  is_vegetarian BOOLEAN DEFAULT false,
  is_vegan BOOLEAN DEFAULT false,
  is_gluten_free BOOLEAN DEFAULT false,
  is_dairy_free BOOLEAN DEFAULT false,
  is_nut_free BOOLEAN DEFAULT false,
  contains_alcohol BOOLEAN DEFAULT false,
  estimated_cost_per_person DECIMAL(10,2),
  image_url TEXT,
  seasonality TEXT[],
  region TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dietary_restrictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guest_id UUID REFERENCES guests ON DELETE CASCADE,
  restriction_type TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- ANALYTICS : LEADS & REVENUE
-- =====================================================================
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

CREATE TABLE IF NOT EXISTS revenue_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  source_name TEXT NOT NULL,
  source_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, source_name)
);

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

-- =====================================================================
-- TIMELINE MANAGEMENT
-- =====================================================================
CREATE TABLE IF NOT EXISTS task_dependencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  predecessor_task_id UUID REFERENCES tasks ON DELETE CASCADE NOT NULL,
  successor_task_id UUID REFERENCES tasks ON DELETE CASCADE NOT NULL,
  dependency_type dependency_type DEFAULT 'finish_to_start',
  lag_time INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(predecessor_task_id, successor_task_id)
);

CREATE TABLE IF NOT EXISTS timeline_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS timeline_template_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES timeline_templates ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  relative_day INTEGER NOT NULL,
  duration INTEGER DEFAULT 60,
  status task_status DEFAULT 'not_started',
  priority task_priority DEFAULT 'medium',
  category vendor_category,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS timeline_template_dependencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES timeline_templates ON DELETE CASCADE NOT NULL,
  predecessor_task_id UUID REFERENCES timeline_template_tasks ON DELETE CASCADE NOT NULL,
  successor_task_id UUID REFERENCES timeline_template_tasks ON DELETE CASCADE NOT NULL,
  dependency_type dependency_type DEFAULT 'finish_to_start',
  lag_time INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(predecessor_task_id, successor_task_id)
);

CREATE TABLE IF NOT EXISTS wedding_day_timelines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  client_id UUID REFERENCES clients ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  wedding_date DATE NOT NULL,
  description TEXT,
  is_shared BOOLEAN DEFAULT false,
  share_token TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wedding_day_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timeline_id UUID REFERENCES wedding_day_timelines ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  location TEXT,
  category TEXT,
  responsible_party TEXT,
  notes TEXT,
  is_critical_path BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS timeline_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timeline_id UUID REFERENCES wedding_day_timelines ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  access_level TEXT NOT NULL DEFAULT 'view',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(timeline_id, email)
);

-- =====================================================================
-- RESOURCE MANAGEMENT : INVENTORY, STAFF, EQUIPMENT, VEHICLES
-- =====================================================================
CREATE TABLE IF NOT EXISTS resource_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  category_id UUID REFERENCES resource_categories ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_cost DECIMAL(10,2),
  replacement_cost DECIMAL(10,2),
  rental_fee DECIMAL(10,2),
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'available',
  location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  client_id UUID REFERENCES clients ON DELETE CASCADE,
  item_id UUID REFERENCES inventory_items ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT NOT NULL,
  hourly_rate DECIMAL(10,2),
  skills TEXT[],
  availability TEXT,
  notes TEXT,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS staff_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  staff_id UUID REFERENCES staff ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES clients ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS equipment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  category_id UUID REFERENCES resource_categories ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  serial_number TEXT,
  purchase_date DATE,
  purchase_cost DECIMAL(10,2),
  current_value DECIMAL(10,2),
  status TEXT NOT NULL DEFAULT 'operational',
  maintenance_schedule TEXT,
  last_maintenance_date DATE,
  next_maintenance_date DATE,
  location TEXT,
  notes TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS equipment_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  equipment_id UUID REFERENCES equipment ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES clients ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  make TEXT,
  model TEXT,
  year INTEGER,
  license_plate TEXT,
  capacity INTEGER,
  status TEXT NOT NULL DEFAULT 'available',
  notes TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transportation_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  vehicle_id UUID REFERENCES vehicles ON DELETE CASCADE NOT NULL,
  driver_id UUID REFERENCES staff ON DELETE SET NULL,
  client_id UUID REFERENCES clients ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  pickup_location TEXT,
  dropoff_location TEXT,
  pickup_time TIMESTAMPTZ NOT NULL,
  dropoff_time TIMESTAMPTZ NOT NULL,
  passenger_count INTEGER,
  status TEXT NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS maintenance_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  equipment_id UUID REFERENCES equipment ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles ON DELETE CASCADE,
  maintenance_date DATE NOT NULL,
  maintenance_type TEXT NOT NULL,
  description TEXT,
  cost DECIMAL(10,2),
  performed_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK ((equipment_id IS NOT NULL AND vehicle_id IS NULL) OR (equipment_id IS NULL AND vehicle_id IS NOT NULL))
);

-- =====================================================================
-- INDEXES
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON vendors(user_id);
CREATE INDEX IF NOT EXISTS idx_vendors_client_id ON vendors(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_client_id ON budgets(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_quotations_user_id ON quotations(user_id);
CREATE INDEX IF NOT EXISTS idx_quotations_client_id ON quotations(client_id);
CREATE INDEX IF NOT EXISTS idx_guests_user_id ON guests(user_id);
CREATE INDEX IF NOT EXISTS idx_guests_client_id ON guests(client_id);
CREATE INDEX IF NOT EXISTS idx_guests_group_id ON guests(group_id);
CREATE INDEX IF NOT EXISTS idx_guests_qr_code ON guests(qr_code);
CREATE INDEX IF NOT EXISTS idx_tables_user_id ON tables(user_id);
CREATE INDEX IF NOT EXISTS idx_tables_client_id ON tables(client_id);
CREATE INDEX IF NOT EXISTS idx_seating_charts_user_id ON seating_charts(user_id);
CREATE INDEX IF NOT EXISTS idx_seating_charts_client_id ON seating_charts(client_id);
CREATE INDEX IF NOT EXISTS idx_contract_templates_user_id ON contract_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_contract_templates_category ON contract_templates(category);
CREATE INDEX IF NOT EXISTS idx_contracts_user_id ON contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_contracts_client_id ON contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_contracts_vendor_id ON contracts(vendor_id);
CREATE INDEX IF NOT EXISTS idx_contracts_template_id ON contracts(template_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_verification_codes_phone_number ON verification_codes(phone_number);
CREATE INDEX IF NOT EXISTS idx_signature_request_documents_sr_id ON signature_request_documents(signature_request_id);
CREATE INDEX IF NOT EXISTS idx_signature_request_documents_doc_id ON signature_request_documents(document_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_revenue_forecasts_user_id ON revenue_forecasts(user_id);
CREATE INDEX IF NOT EXISTS idx_revenue_forecasts_date ON revenue_forecasts(forecast_date);
CREATE INDEX IF NOT EXISTS idx_revenue_entries_user_id ON revenue_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_revenue_entries_client_id ON revenue_entries(client_id);
CREATE INDEX IF NOT EXISTS idx_revenue_entries_date ON revenue_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_business_metrics_user_id ON business_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_business_metrics_date ON business_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_popular_services_user_id ON popular_services(user_id);
CREATE INDEX IF NOT EXISTS idx_popular_services_month_year ON popular_services(month, year);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_user_id ON task_dependencies(user_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_predecessor ON task_dependencies(predecessor_task_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_successor ON task_dependencies(successor_task_id);
CREATE INDEX IF NOT EXISTS idx_timeline_templates_user_id ON timeline_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_timeline_template_tasks_template_id ON timeline_template_tasks(template_id);
CREATE INDEX IF NOT EXISTS idx_wedding_day_timelines_user_id ON wedding_day_timelines(user_id);
CREATE INDEX IF NOT EXISTS idx_wedding_day_timelines_client_id ON wedding_day_timelines(client_id);
CREATE INDEX IF NOT EXISTS idx_wedding_day_events_timeline_id ON wedding_day_events(timeline_id);
CREATE INDEX IF NOT EXISTS idx_timeline_shares_timeline_id ON timeline_shares(timeline_id);
CREATE INDEX IF NOT EXISTS idx_timeline_shares_email ON timeline_shares(email);
CREATE INDEX IF NOT EXISTS idx_guest_groups_client_id ON guest_groups(client_id);
CREATE INDEX IF NOT EXISTS idx_check_in_events_client_id ON check_in_events(client_id);
CREATE INDEX IF NOT EXISTS idx_check_in_records_event_id ON check_in_records(event_id);
CREATE INDEX IF NOT EXISTS idx_check_in_records_guest_id ON check_in_records(guest_id);
CREATE INDEX IF NOT EXISTS idx_check_in_stations_event_id ON check_in_stations(event_id);
CREATE INDEX IF NOT EXISTS idx_resource_categories_user_id ON resource_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_user_id ON inventory_items(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_category_id ON inventory_items(category_id);
CREATE INDEX IF NOT EXISTS idx_inventory_bookings_user_id ON inventory_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_bookings_client_id ON inventory_bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_inventory_bookings_item_id ON inventory_bookings(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_bookings_date_range ON inventory_bookings(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_staff_user_id ON staff(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_assignments_user_id ON staff_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_assignments_staff_id ON staff_assignments(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_assignments_client_id ON staff_assignments(client_id);
CREATE INDEX IF NOT EXISTS idx_staff_assignments_time_range ON staff_assignments(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_equipment_user_id ON equipment(user_id);
CREATE INDEX IF NOT EXISTS idx_equipment_category_id ON equipment(category_id);
CREATE INDEX IF NOT EXISTS idx_equipment_bookings_user_id ON equipment_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_equipment_bookings_equipment_id ON equipment_bookings(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_bookings_client_id ON equipment_bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_equipment_bookings_time_range ON equipment_bookings(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_transportation_schedules_user_id ON transportation_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_transportation_schedules_vehicle_id ON transportation_schedules(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_transportation_schedules_driver_id ON transportation_schedules(driver_id);
CREATE INDEX IF NOT EXISTS idx_transportation_schedules_client_id ON transportation_schedules(client_id);
CREATE INDEX IF NOT EXISTS idx_transportation_schedules_time_range ON transportation_schedules(pickup_time, dropoff_time);
CREATE INDEX IF NOT EXISTS idx_maintenance_logs_user_id ON maintenance_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_logs_equipment_id ON maintenance_logs(equipment_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_logs_vehicle_id ON maintenance_logs(vehicle_id);

-- =====================================================================
-- TRIGGERS (updated_at on all tables)
-- =====================================================================
DO $$
DECLARE
  t TEXT;
  trigger_tables TEXT[] := ARRAY[
    'profiles','clients','vendors','tasks','budgets','budget_categories',
    'invoices','invoice_items','quotations','quotation_items','guests',
    'guest_groups','tables','seating_charts','contract_templates','contracts',
    'documents','signature_requests','subscriptions','payment_methods',
    'oauth_tokens','connected_calendars','design_suggestions','visualization_projects',
    'meal_plans','leads','revenue_forecasts','revenue_sources','revenue_entries',
    'business_metrics','popular_services','task_dependencies','timeline_templates',
    'timeline_template_tasks','timeline_template_dependencies','wedding_day_timelines',
    'wedding_day_events','timeline_shares','check_in_events','check_in_records',
    'check_in_stations','resource_categories','inventory_items','inventory_bookings',
    'staff','staff_assignments','equipment','equipment_bookings','vehicles',
    'transportation_schedules','maintenance_logs'
  ];
BEGIN
  FOREACH t IN ARRAY trigger_tables LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_%I_updated_at ON %I;', t, t);
    EXECUTE format(
      'CREATE TRIGGER set_%I_updated_at BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION set_updated_at();',
      t, t
    );
  END LOOP;
END $$;

-- =====================================================================
-- HELPER FUNCTIONS (subscription access)
-- =====================================================================
CREATE OR REPLACE FUNCTION get_user_subscription_plan(user_uuid UUID)
RETURNS subscription_plan AS $$
DECLARE
  plan subscription_plan;
BEGIN
  SELECT plan_id INTO plan
  FROM subscriptions
  WHERE user_id = user_uuid AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;
  RETURN COALESCE(plan, 'free'::subscription_plan);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION has_feature_access(user_uuid UUID, feature_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  plan subscription_plan;
  has_access BOOLEAN;
BEGIN
  plan := get_user_subscription_plan(user_uuid);
  SELECT
    CASE
      WHEN feature_name = 'budget_tracking'    THEN budget_tracking
      WHEN feature_name = 'invoicing'          THEN invoicing
      WHEN feature_name = 'seating_charts'     THEN seating_charts
      WHEN feature_name = 'meal_planning'      THEN meal_planning
      WHEN feature_name = 'design_suggestions' THEN design_suggestions
      ELSE false
    END INTO has_access
  FROM subscription_limits
  WHERE plan_id = plan;
  RETURN COALESCE(has_access, false);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION is_within_plan_limits(user_uuid UUID, resource_type TEXT, count INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  plan subscription_plan;
  max_limit INTEGER;
BEGIN
  plan := get_user_subscription_plan(user_uuid);
  SELECT
    CASE
      WHEN resource_type = 'clients' THEN max_clients
      WHEN resource_type = 'vendors' THEN max_vendors
      WHEN resource_type = 'guests'  THEN max_guests
      ELSE 0
    END INTO max_limit
  FROM subscription_limits
  WHERE plan_id = plan;
  RETURN count <= max_limit;
END;
$$ LANGUAGE plpgsql;


-- =====================================================================
-- ROW LEVEL SECURITY : ENABLE ON ALL TABLES
-- =====================================================================
DO $$
DECLARE
  t TEXT;
  rls_tables TEXT[] := ARRAY[
    'profiles','clients','vendors','tasks','budgets','budget_categories',
    'invoices','invoice_items','quotations','quotation_items','guests',
    'guest_groups','tables','seating_charts','contract_templates','contracts',
    'documents','electronic_signatures','signature_requests',
    'signature_request_documents','signature_events','verification_codes',
    'subscriptions','payment_methods','oauth_tokens','connected_calendars',
    'design_suggestions','color_schemes','decor_ideas','visualization_projects',
    'meal_plans','meal_items','dietary_restrictions',
    'leads','revenue_forecasts','revenue_sources','revenue_entries',
    'business_metrics','popular_services',
    'task_dependencies','timeline_templates','timeline_template_tasks',
    'timeline_template_dependencies','wedding_day_timelines','wedding_day_events',
    'timeline_shares','check_in_events','check_in_records','check_in_stations',
    'resource_categories','inventory_items','inventory_bookings',
    'staff','staff_assignments','equipment','equipment_bookings',
    'vehicles','transportation_schedules','maintenance_logs'
  ];
BEGIN
  FOREACH t IN ARRAY rls_tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
  END LOOP;
END $$;

-- =====================================================================
-- RLS POLICIES : user_id-based (applies to majority of tables)
-- =====================================================================
DO $$
DECLARE
  t TEXT;
  uid_tables TEXT[] := ARRAY[
    'clients','vendors','tasks','budgets','invoices','quotations','guests',
    'guest_groups','tables','seating_charts','contract_templates','contracts',
    'documents','subscriptions','payment_methods','oauth_tokens',
    'connected_calendars','design_suggestions','meal_plans',
    'leads','revenue_forecasts','revenue_sources','revenue_entries',
    'business_metrics','popular_services','task_dependencies',
    'timeline_templates','wedding_day_timelines','check_in_events',
    'check_in_stations','resource_categories','inventory_items',
    'inventory_bookings','staff','staff_assignments','equipment',
    'equipment_bookings','vehicles','transportation_schedules','maintenance_logs'
  ];
BEGIN
  FOREACH t IN ARRAY uid_tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS "owner_select_%s" ON %I;', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "owner_insert_%s" ON %I;', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "owner_update_%s" ON %I;', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "owner_delete_%s" ON %I;', t, t);

    EXECUTE format('CREATE POLICY "owner_select_%s" ON %I FOR SELECT USING (auth.uid() = user_id);', t, t);
    EXECUTE format('CREATE POLICY "owner_insert_%s" ON %I FOR INSERT WITH CHECK (auth.uid() = user_id);', t, t);
    EXECUTE format('CREATE POLICY "owner_update_%s" ON %I FOR UPDATE USING (auth.uid() = user_id);', t, t);
    EXECUTE format('CREATE POLICY "owner_delete_%s" ON %I FOR DELETE USING (auth.uid() = user_id);', t, t);
  END LOOP;
END $$;

-- profiles (uses "id" instead of "user_id")
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- =====================================================================
-- RLS POLICIES : child tables (derive access through parent)
-- =====================================================================
-- budget_categories -> budgets
CREATE POLICY "bc_select" ON budget_categories FOR SELECT USING (
  EXISTS (SELECT 1 FROM budgets b WHERE b.id = budget_categories.budget_id AND b.user_id = auth.uid())
);
CREATE POLICY "bc_insert" ON budget_categories FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM budgets b WHERE b.id = budget_categories.budget_id AND b.user_id = auth.uid())
);
CREATE POLICY "bc_update" ON budget_categories FOR UPDATE USING (
  EXISTS (SELECT 1 FROM budgets b WHERE b.id = budget_categories.budget_id AND b.user_id = auth.uid())
);
CREATE POLICY "bc_delete" ON budget_categories FOR DELETE USING (
  EXISTS (SELECT 1 FROM budgets b WHERE b.id = budget_categories.budget_id AND b.user_id = auth.uid())
);

-- invoice_items -> invoices
CREATE POLICY "ii_select" ON invoice_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM invoices i WHERE i.id = invoice_items.invoice_id AND i.user_id = auth.uid())
);
CREATE POLICY "ii_insert" ON invoice_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM invoices i WHERE i.id = invoice_items.invoice_id AND i.user_id = auth.uid())
);
CREATE POLICY "ii_update" ON invoice_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM invoices i WHERE i.id = invoice_items.invoice_id AND i.user_id = auth.uid())
);
CREATE POLICY "ii_delete" ON invoice_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM invoices i WHERE i.id = invoice_items.invoice_id AND i.user_id = auth.uid())
);

-- quotation_items -> quotations
CREATE POLICY "qi_select" ON quotation_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM quotations q WHERE q.id = quotation_items.quotation_id AND q.user_id = auth.uid())
);
CREATE POLICY "qi_insert" ON quotation_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM quotations q WHERE q.id = quotation_items.quotation_id AND q.user_id = auth.uid())
);
CREATE POLICY "qi_update" ON quotation_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM quotations q WHERE q.id = quotation_items.quotation_id AND q.user_id = auth.uid())
);
CREATE POLICY "qi_delete" ON quotation_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM quotations q WHERE q.id = quotation_items.quotation_id AND q.user_id = auth.uid())
);

-- electronic_signatures / signature_events -> documents
CREATE POLICY "es_select" ON electronic_signatures FOR SELECT USING (
  EXISTS (SELECT 1 FROM documents d WHERE d.id = electronic_signatures.document_id AND d.user_id = auth.uid())
);
CREATE POLICY "es_insert" ON electronic_signatures FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM documents d WHERE d.id = electronic_signatures.document_id AND d.user_id = auth.uid())
);

CREATE POLICY "sev_select" ON signature_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM documents d WHERE d.id = signature_events.document_id AND d.user_id = auth.uid())
);
CREATE POLICY "sev_insert" ON signature_events FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM documents d WHERE d.id = signature_events.document_id AND d.user_id = auth.uid())
);

-- signature_requests : any authenticated user can insert; reads join via junction table
CREATE POLICY "sr_insert" ON signature_requests FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "sr_select" ON signature_requests FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM signature_request_documents srd
    JOIN documents d ON d.id = srd.document_id
    WHERE srd.signature_request_id = signature_requests.id AND d.user_id = auth.uid()
  ) OR auth.uid() IS NOT NULL
);
CREATE POLICY "sr_update" ON signature_requests FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "sr_delete" ON signature_requests FOR DELETE USING (auth.uid() IS NOT NULL);


-- signature_request_documents -> documents
CREATE POLICY "srd_select" ON signature_request_documents FOR SELECT USING (
  EXISTS (SELECT 1 FROM documents d WHERE d.id = signature_request_documents.document_id AND d.user_id = auth.uid())
);
CREATE POLICY "srd_insert" ON signature_request_documents FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM documents d WHERE d.id = signature_request_documents.document_id AND d.user_id = auth.uid())
);
CREATE POLICY "srd_delete" ON signature_request_documents FOR DELETE USING (
  EXISTS (SELECT 1 FROM documents d WHERE d.id = signature_request_documents.document_id AND d.user_id = auth.uid())
);

-- verification_codes : any authenticated user (used during signature verification)
CREATE POLICY "vc_all" ON verification_codes FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- meal_items -> meal_plans
CREATE POLICY "mi_select" ON meal_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM meal_plans m WHERE m.id = meal_items.meal_plan_id AND m.user_id = auth.uid())
);
CREATE POLICY "mi_insert" ON meal_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM meal_plans m WHERE m.id = meal_items.meal_plan_id AND m.user_id = auth.uid())
);
CREATE POLICY "mi_update" ON meal_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM meal_plans m WHERE m.id = meal_items.meal_plan_id AND m.user_id = auth.uid())
);
CREATE POLICY "mi_delete" ON meal_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM meal_plans m WHERE m.id = meal_items.meal_plan_id AND m.user_id = auth.uid())
);

-- dietary_restrictions -> guests
CREATE POLICY "dr_select" ON dietary_restrictions FOR SELECT USING (
  EXISTS (SELECT 1 FROM guests g WHERE g.id = dietary_restrictions.guest_id AND g.user_id = auth.uid())
);
CREATE POLICY "dr_insert" ON dietary_restrictions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM guests g WHERE g.id = dietary_restrictions.guest_id AND g.user_id = auth.uid())
);
CREATE POLICY "dr_update" ON dietary_restrictions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM guests g WHERE g.id = dietary_restrictions.guest_id AND g.user_id = auth.uid())
);
CREATE POLICY "dr_delete" ON dietary_restrictions FOR DELETE USING (
  EXISTS (SELECT 1 FROM guests g WHERE g.id = dietary_restrictions.guest_id AND g.user_id = auth.uid())
);

-- color_schemes / decor_ideas / visualization_projects -> design_suggestions
DO $$
DECLARE
  t TEXT;
  ds_children TEXT[] := ARRAY['color_schemes','decor_ideas','visualization_projects'];
BEGIN
  FOREACH t IN ARRAY ds_children LOOP
    EXECUTE format(
      'CREATE POLICY "%s_select" ON %I FOR SELECT USING (EXISTS (SELECT 1 FROM design_suggestions s WHERE s.id = %I.suggestion_id AND s.user_id = auth.uid()));',
      t, t, t);
    EXECUTE format(
      'CREATE POLICY "%s_insert" ON %I FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM design_suggestions s WHERE s.id = %I.suggestion_id AND s.user_id = auth.uid()));',
      t, t, t);
    EXECUTE format(
      'CREATE POLICY "%s_update" ON %I FOR UPDATE USING (EXISTS (SELECT 1 FROM design_suggestions s WHERE s.id = %I.suggestion_id AND s.user_id = auth.uid()));',
      t, t, t);
    EXECUTE format(
      'CREATE POLICY "%s_delete" ON %I FOR DELETE USING (EXISTS (SELECT 1 FROM design_suggestions s WHERE s.id = %I.suggestion_id AND s.user_id = auth.uid()));',
      t, t, t);
  END LOOP;
END $$;

-- timeline_template_tasks / timeline_template_dependencies -> timeline_templates
DO $$
DECLARE
  t TEXT;
  tpl_children TEXT[] := ARRAY['timeline_template_tasks','timeline_template_dependencies'];
BEGIN
  FOREACH t IN ARRAY tpl_children LOOP
    EXECUTE format(
      'CREATE POLICY "%s_select" ON %I FOR SELECT USING (EXISTS (SELECT 1 FROM timeline_templates tt WHERE tt.id = %I.template_id AND tt.user_id = auth.uid()));',
      t, t, t);
    EXECUTE format(
      'CREATE POLICY "%s_insert" ON %I FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM timeline_templates tt WHERE tt.id = %I.template_id AND tt.user_id = auth.uid()));',
      t, t, t);
    EXECUTE format(
      'CREATE POLICY "%s_update" ON %I FOR UPDATE USING (EXISTS (SELECT 1 FROM timeline_templates tt WHERE tt.id = %I.template_id AND tt.user_id = auth.uid()));',
      t, t, t);
    EXECUTE format(
      'CREATE POLICY "%s_delete" ON %I FOR DELETE USING (EXISTS (SELECT 1 FROM timeline_templates tt WHERE tt.id = %I.template_id AND tt.user_id = auth.uid()));',
      t, t, t);
  END LOOP;
END $$;

-- wedding_day_events / timeline_shares -> wedding_day_timelines
DO $$
DECLARE
  t TEXT;
  wdt_children TEXT[] := ARRAY['wedding_day_events','timeline_shares'];
BEGIN
  FOREACH t IN ARRAY wdt_children LOOP
    EXECUTE format(
      'CREATE POLICY "%s_select" ON %I FOR SELECT USING (EXISTS (SELECT 1 FROM wedding_day_timelines w WHERE w.id = %I.timeline_id AND w.user_id = auth.uid()));',
      t, t, t);
    EXECUTE format(
      'CREATE POLICY "%s_insert" ON %I FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM wedding_day_timelines w WHERE w.id = %I.timeline_id AND w.user_id = auth.uid()));',
      t, t, t);
    EXECUTE format(
      'CREATE POLICY "%s_update" ON %I FOR UPDATE USING (EXISTS (SELECT 1 FROM wedding_day_timelines w WHERE w.id = %I.timeline_id AND w.user_id = auth.uid()));',
      t, t, t);
    EXECUTE format(
      'CREATE POLICY "%s_delete" ON %I FOR DELETE USING (EXISTS (SELECT 1 FROM wedding_day_timelines w WHERE w.id = %I.timeline_id AND w.user_id = auth.uid()));',
      t, t, t);
  END LOOP;
END $$;

-- check_in_records -> check_in_events
CREATE POLICY "cir_select" ON check_in_records FOR SELECT USING (
  EXISTS (SELECT 1 FROM check_in_events e WHERE e.id = check_in_records.event_id AND e.user_id = auth.uid())
);
CREATE POLICY "cir_insert" ON check_in_records FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM check_in_events e WHERE e.id = check_in_records.event_id AND e.user_id = auth.uid())
);
CREATE POLICY "cir_update" ON check_in_records FOR UPDATE USING (
  EXISTS (SELECT 1 FROM check_in_events e WHERE e.id = check_in_records.event_id AND e.user_id = auth.uid())
);
CREATE POLICY "cir_delete" ON check_in_records FOR DELETE USING (
  EXISTS (SELECT 1 FROM check_in_events e WHERE e.id = check_in_records.event_id AND e.user_id = auth.uid())
);

-- subscription_limits : read-only reference table (public to authenticated users)
ALTER TABLE subscription_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sl_select" ON subscription_limits FOR SELECT USING (auth.uid() IS NOT NULL);

-- =====================================================================
-- ADMIN ROLES, COUPONS & ADMIN RLS OVERRIDES
-- =====================================================================

-- Add role column to profiles (user | admin)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
  CHECK (role IN ('user', 'admin'));
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Helper: is the current user an admin?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Coupons: promotional codes admins can generate to grant plan upgrades
-- or extend subscription periods.
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  -- Grant type: 'plan_upgrade' (sets plan_id) or 'extend_days' (adds days to period)
  grant_type TEXT NOT NULL CHECK (grant_type IN ('plan_upgrade', 'extend_days')),
  grant_plan subscription_plan,             -- used when grant_type = 'plan_upgrade'
  grant_days INTEGER,                       -- used when grant_type = 'extend_days'
  max_redemptions INTEGER,                  -- NULL = unlimited
  redemption_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,                   -- NULL = never expires
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active);

DROP TRIGGER IF EXISTS set_coupons_updated_at ON coupons;
CREATE TRIGGER set_coupons_updated_at
  BEFORE UPDATE ON coupons
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Track which user redeemed which coupon (idempotency + analytics)
CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (coupon_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_user ON coupon_redemptions(user_id);

-- RLS for coupons: admins full access, authenticated users can SELECT active coupons by code
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_redemptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coupons_admin_all" ON coupons;
DROP POLICY IF EXISTS "coupons_user_select_active" ON coupons;
CREATE POLICY "coupons_admin_all" ON coupons FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "coupons_user_select_active" ON coupons FOR SELECT
  USING (is_active = TRUE AND (expires_at IS NULL OR expires_at > NOW()));

DROP POLICY IF EXISTS "cr_admin_all" ON coupon_redemptions;
DROP POLICY IF EXISTS "cr_user_select_own" ON coupon_redemptions;
DROP POLICY IF EXISTS "cr_user_insert_own" ON coupon_redemptions;
CREATE POLICY "cr_admin_all" ON coupon_redemptions FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "cr_user_select_own" ON coupon_redemptions FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "cr_user_insert_own" ON coupon_redemptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admin override policies: allow admins to read/update every user's
-- subscription and profile rows (in addition to existing owner policies).
DROP POLICY IF EXISTS "admin_select_subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "admin_update_subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "admin_insert_subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "admin_delete_subscriptions" ON subscriptions;
CREATE POLICY "admin_select_subscriptions" ON subscriptions FOR SELECT USING (public.is_admin());
CREATE POLICY "admin_insert_subscriptions" ON subscriptions FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "admin_update_subscriptions" ON subscriptions FOR UPDATE USING (public.is_admin());
CREATE POLICY "admin_delete_subscriptions" ON subscriptions FOR DELETE USING (public.is_admin());

DROP POLICY IF EXISTS "admin_select_profiles" ON profiles;
DROP POLICY IF EXISTS "admin_update_profiles" ON profiles;
CREATE POLICY "admin_select_profiles" ON profiles FOR SELECT USING (public.is_admin());
CREATE POLICY "admin_update_profiles" ON profiles FOR UPDATE USING (public.is_admin());

-- Admin-side coupon redemption function: applies a coupon to a user's
-- subscription atomically. Returns the resulting subscription row id.
CREATE OR REPLACE FUNCTION public.redeem_coupon(p_code TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_coupon coupons%ROWTYPE;
  v_sub_id UUID;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO v_coupon FROM coupons
    WHERE code = p_code AND is_active = TRUE
      AND (expires_at IS NULL OR expires_at > NOW())
    FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Invalid or expired coupon'; END IF;
  IF v_coupon.max_redemptions IS NOT NULL
     AND v_coupon.redemption_count >= v_coupon.max_redemptions THEN
    RAISE EXCEPTION 'Coupon redemption limit reached';
  END IF;

  INSERT INTO coupon_redemptions (coupon_id, user_id)
    VALUES (v_coupon.id, v_user);

  IF v_coupon.grant_type = 'plan_upgrade' THEN
    INSERT INTO subscriptions (user_id, plan_id, status, current_period_start,
                               current_period_end, billing_cycle)
      VALUES (v_user, v_coupon.grant_plan, 'active', NOW(),
              NOW() + INTERVAL '1 year', 'monthly')
      RETURNING id INTO v_sub_id;
  ELSIF v_coupon.grant_type = 'extend_days' THEN
    UPDATE subscriptions
      SET current_period_end = COALESCE(current_period_end, NOW())
                               + (v_coupon.grant_days || ' days')::INTERVAL,
          status = 'active',
          updated_at = NOW()
      WHERE user_id = v_user
      RETURNING id INTO v_sub_id;
  END IF;

  UPDATE coupons SET redemption_count = redemption_count + 1,
                     updated_at = NOW()
    WHERE id = v_coupon.id;

  RETURN v_sub_id;
END $$;

-- =====================================================================
-- END OF SCHEMA
-- =====================================================================
