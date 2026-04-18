
-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create custom types
CREATE TYPE vendor_category AS ENUM (
  'venue', 'catering', 'photography', 'videography', 'florist', 'music',
  'cake', 'attire', 'hair_makeup', 'transportation', 'rentals', 'stationery',
  'gifts', 'other'
);

CREATE TYPE client_status AS ENUM ('active', 'completed', 'cancelled');
CREATE TYPE task_status AS ENUM ('not_started', 'in_progress', 'completed', 'overdue');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue');
CREATE TYPE quotation_status AS ENUM ('draft', 'sent', 'accepted', 'rejected');

-- Create profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT,
  profile_image TEXT,
  wedding_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  partner_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  wedding_date DATE,
  venue TEXT,
  notes TEXT,
  status client_status DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create vendors table
CREATE TABLE vendors (
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  client_id UUID REFERENCES clients ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  status task_status DEFAULT 'not_started',
  priority task_priority DEFAULT 'medium',
  category vendor_category,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create budgets table
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  client_id UUID REFERENCES clients ON DELETE CASCADE UNIQUE,
  total_budget DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create budget_categories table
CREATE TABLE budget_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  budget_id UUID REFERENCES budgets ON DELETE CASCADE,
  category vendor_category NOT NULL,
  allocated DECIMAL(10,2) NOT NULL DEFAULT 0,
  spent DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(budget_id, category)
);

-- Create invoices table
CREATE TABLE invoices (
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create invoice_items table
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create quotations table
CREATE TABLE quotations (
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create quotation_items table
CREATE TABLE quotation_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_id UUID REFERENCES quotations ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can view own clients"
  ON clients FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clients"
  ON clients FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clients"
  ON clients FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own clients"
  ON clients FOR DELETE
  USING (auth.uid() = user_id);

-- Similar policies for vendors
CREATE POLICY "Users can view own vendors"
  ON vendors FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vendors"
  ON vendors FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vendors"
  ON vendors FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own vendors"
  ON vendors FOR DELETE
  USING (auth.uid() = user_id);

-- Similar policies for tasks
CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);

-- Similar policies for budgets and categories
CREATE POLICY "Users can view own budgets"
  ON budgets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own budgets"
  ON budgets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budgets"
  ON budgets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own budgets"
  ON budgets FOR DELETE
  USING (auth.uid() = user_id);

-- Budget categories inherit from budget policies through foreign key

-- Similar policies for invoices and items
CREATE POLICY "Users can view own invoices"
  ON invoices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own invoices"
  ON invoices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own invoices"
  ON invoices FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own invoices"
  ON invoices FOR DELETE
  USING (auth.uid() = user_id);

-- Invoice items inherit from invoice policies through foreign key

-- Similar policies for quotations and items
CREATE POLICY "Users can view own quotations"
  ON quotations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quotations"
  ON quotations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quotations"
  ON quotations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own quotations"
  ON quotations FOR DELETE
  USING (auth.uid() = user_id);

-- Quotation items inherit from quotation policies through foreign key

-- Create indexes for better performance
CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_vendors_user_id ON vendors(user_id);
CREATE INDEX idx_vendors_client_id ON vendors(client_id);
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_client_id ON tasks(client_id);
CREATE INDEX idx_budgets_user_id ON budgets(user_id);
CREATE INDEX idx_budgets_client_id ON budgets(client_id);
CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_quotations_user_id ON quotations(user_id);
CREATE INDEX idx_quotations_client_id ON quotations(client_id);
