-- Create contract_status enum type if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contract_status') THEN
    CREATE TYPE contract_status AS ENUM ('draft', 'sent', 'signed', 'expired', 'cancelled');
  END IF;
END
$$;

-- Create contract_category enum type if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contract_category') THEN
    CREATE TYPE contract_category AS ENUM ('client', 'vendor', 'planning', 'other');
  END IF;
END
$$;

-- Create contract_templates table
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

-- Create contracts table
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

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contract_templates_user_id ON contract_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_contract_templates_category ON contract_templates(category);
CREATE INDEX IF NOT EXISTS idx_contracts_user_id ON contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_contracts_client_id ON contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_contracts_vendor_id ON contracts(vendor_id);
CREATE INDEX IF NOT EXISTS idx_contracts_template_id ON contracts(template_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);

-- Add RLS policies for contract_templates
ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own contract templates"
  ON contract_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contract templates"
  ON contract_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contract templates"
  ON contract_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contract templates"
  ON contract_templates FOR DELETE
  USING (auth.uid() = user_id);

-- Add RLS policies for contracts
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own contracts"
  ON contracts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contracts"
  ON contracts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contracts"
  ON contracts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contracts"
  ON contracts FOR DELETE
  USING (auth.uid() = user_id);

-- Add triggers to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contract_templates_updated_at
BEFORE UPDATE ON contract_templates
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at
BEFORE UPDATE ON contracts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
