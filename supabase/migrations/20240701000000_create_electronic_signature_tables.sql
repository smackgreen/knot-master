-- Create a new table for document storage
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
  status TEXT NOT NULL DEFAULT 'pending', -- pending, signed, expired, cancelled
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Ensure at least one of contract_id, quotation_id, or invoice_id is not null
  CONSTRAINT document_reference_check CHECK (
    (contract_id IS NOT NULL)::integer +
    (quotation_id IS NOT NULL)::integer +
    (invoice_id IS NOT NULL)::integer = 1
  )
);

-- Create a new table for electronic signatures
CREATE TABLE IF NOT EXISTS electronic_signatures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
  signer_name TEXT NOT NULL,
  signer_email TEXT NOT NULL,
  signer_role TEXT NOT NULL, -- client, vendor, planner
  signature_image TEXT NOT NULL, -- Base64 encoded signature image
  ip_address TEXT,
  consent_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a new table for signature requests
CREATE TABLE IF NOT EXISTS signature_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  recipient_role TEXT NOT NULL, -- client, vendor, planner
  status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, expired, cancelled
  token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a new table for signature events
CREATE TABLE IF NOT EXISTS signature_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL, -- created, viewed, signed, expired, cancelled
  actor TEXT, -- email of the person who performed the action
  actor_role TEXT, -- client, vendor, planner, system
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own documents"
  ON documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents"
  ON documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents"
  ON documents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
  ON documents FOR DELETE
  USING (auth.uid() = user_id);

-- Add RLS policies for electronic_signatures
ALTER TABLE electronic_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view signatures for their documents"
  ON electronic_signatures FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM documents
    WHERE documents.id = electronic_signatures.document_id
    AND documents.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert signatures for their documents"
  ON electronic_signatures FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM documents
    WHERE documents.id = electronic_signatures.document_id
    AND documents.user_id = auth.uid()
  ));

-- Add RLS policies for signature_requests
ALTER TABLE signature_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view signature requests for their documents"
  ON signature_requests FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM documents
    WHERE documents.id = signature_requests.document_id
    AND documents.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert signature requests for their documents"
  ON signature_requests FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM documents
    WHERE documents.id = signature_requests.document_id
    AND documents.user_id = auth.uid()
  ));

CREATE POLICY "Users can update signature requests for their documents"
  ON signature_requests FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM documents
    WHERE documents.id = signature_requests.document_id
    AND documents.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete signature requests for their documents"
  ON signature_requests FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM documents
    WHERE documents.id = signature_requests.document_id
    AND documents.user_id = auth.uid()
  ));

-- Add RLS policies for signature_events
ALTER TABLE signature_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view signature events for their documents"
  ON signature_events FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM documents
    WHERE documents.id = signature_events.document_id
    AND documents.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert signature events for their documents"
  ON signature_events FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM documents
    WHERE documents.id = signature_events.document_id
    AND documents.user_id = auth.uid()
  ));
