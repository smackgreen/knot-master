-- Create a new table for SMS verification codes
CREATE TABLE IF NOT EXISTS verification_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number TEXT NOT NULL,
  code TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  verified BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add phone number to signature requests
ALTER TABLE signature_requests 
ADD COLUMN IF NOT EXISTS recipient_phone TEXT;

-- Create a new table for signature request documents (many-to-many relationship)
CREATE TABLE IF NOT EXISTS signature_request_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  signature_request_id UUID REFERENCES signature_requests(id) ON DELETE CASCADE NOT NULL,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(signature_request_id, document_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_verification_codes_phone_number ON verification_codes(phone_number);
CREATE INDEX IF NOT EXISTS idx_signature_request_documents_signature_request_id ON signature_request_documents(signature_request_id);
CREATE INDEX IF NOT EXISTS idx_signature_request_documents_document_id ON signature_request_documents(document_id);

-- Add RLS policies for verification_codes
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert verification codes"
  ON verification_codes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update verification codes"
  ON verification_codes FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can select verification codes"
  ON verification_codes FOR SELECT
  USING (true);

-- Add RLS policies for signature_request_documents
ALTER TABLE signature_request_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own signature request documents"
  ON signature_request_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM signature_requests sr
      JOIN documents d ON sr.id = signature_request_documents.signature_request_id
      WHERE d.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own signature request documents"
  ON signature_request_documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = signature_request_documents.document_id
      AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own signature request documents"
  ON signature_request_documents FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = signature_request_documents.document_id
      AND d.user_id = auth.uid()
    )
  );

-- Remove document_id from signature_requests table (now using the junction table)
-- First, migrate existing data
INSERT INTO signature_request_documents (signature_request_id, document_id)
SELECT id, document_id FROM signature_requests
WHERE document_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Then drop the column
ALTER TABLE signature_requests DROP COLUMN IF EXISTS document_id;

-- Add a function to clean up expired verification codes
CREATE OR REPLACE FUNCTION cleanup_expired_verification_codes()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM verification_codes
  WHERE expires_at < NOW() - INTERVAL '1 day';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to clean up expired verification codes
CREATE TRIGGER cleanup_expired_verification_codes_trigger
AFTER INSERT ON verification_codes
EXECUTE FUNCTION cleanup_expired_verification_codes();
