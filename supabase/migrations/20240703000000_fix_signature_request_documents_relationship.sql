-- This migration ensures the signature_request_documents table exists and fixes any issues with the relationship

-- First, check if the signature_request_documents table exists, if not create it
CREATE TABLE IF NOT EXISTS signature_request_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  signature_request_id UUID REFERENCES signature_requests(id) ON DELETE CASCADE NOT NULL,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(signature_request_id, document_id)
);

-- Add recipient_phone column to signature_requests if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'signature_requests'
    AND column_name = 'recipient_phone'
  ) THEN
    ALTER TABLE signature_requests ADD COLUMN recipient_phone TEXT;
  END IF;
END
$$;

-- Add indexes for better performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_signature_request_documents_signature_request_id ON signature_request_documents(signature_request_id);
CREATE INDEX IF NOT EXISTS idx_signature_request_documents_document_id ON signature_request_documents(document_id);

-- Add RLS policies for signature_request_documents if they don't exist
ALTER TABLE signature_request_documents ENABLE ROW LEVEL SECURITY;

-- Make sure RLS is enabled for signature_requests
ALTER TABLE signature_requests ENABLE ROW LEVEL SECURITY;

-- Add a policy to allow any authenticated user to insert signature requests
-- This is needed regardless of whether the document_id column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'signature_requests'
    AND policyname = 'Users can insert signature requests'
  ) THEN
    CREATE POLICY "Users can insert signature requests"
      ON signature_requests FOR INSERT
      WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END
$$;

-- Check if the policy already exists before creating it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'signature_request_documents'
    AND policyname = 'Users can view their own signature request documents'
  ) THEN
    CREATE POLICY "Users can view their own signature request documents"
      ON signature_request_documents FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM documents d
          WHERE d.id = signature_request_documents.document_id
          AND d.user_id = auth.uid()
        )
      );
  END IF;
END
$$;

-- Check if the policy already exists before creating it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'signature_request_documents'
    AND policyname = 'Users can insert their own signature request documents'
  ) THEN
    CREATE POLICY "Users can insert their own signature request documents"
      ON signature_request_documents FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM documents d
          WHERE d.id = signature_request_documents.document_id
          AND d.user_id = auth.uid()
        )
      );
  END IF;
END
$$;

-- Check if the policy already exists before creating it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'signature_request_documents'
    AND policyname = 'Users can delete their own signature request documents'
  ) THEN
    CREATE POLICY "Users can delete their own signature request documents"
      ON signature_request_documents FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM documents d
          WHERE d.id = signature_request_documents.document_id
          AND d.user_id = auth.uid()
        )
      );
  END IF;
END
$$;

-- Check if document_id column exists in signature_requests table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'signature_requests'
    AND column_name = 'document_id'
  ) THEN
    -- Migrate existing data from signature_requests.document_id to signature_request_documents
    INSERT INTO signature_request_documents (signature_request_id, document_id)
    SELECT id, document_id FROM signature_requests
    WHERE document_id IS NOT NULL
    ON CONFLICT DO NOTHING;

    -- Drop the existing RLS policies that depend on document_id
    DROP POLICY IF EXISTS "Users can view signature requests for their documents" ON signature_requests;
    DROP POLICY IF EXISTS "Users can view signature requests" ON signature_requests;
    DROP POLICY IF EXISTS "Users can insert signature requests for their documents" ON signature_requests;
    DROP POLICY IF EXISTS "Users can insert signature requests" ON signature_requests;
    DROP POLICY IF EXISTS "Users can update signature requests for their documents" ON signature_requests;
    DROP POLICY IF EXISTS "Users can update signature requests" ON signature_requests;
    DROP POLICY IF EXISTS "Users can delete signature requests for their documents" ON signature_requests;
    DROP POLICY IF EXISTS "Users can delete signature requests" ON signature_requests;

    -- Then drop the column
    ALTER TABLE signature_requests DROP COLUMN document_id;

    -- Create new RLS policies for signature_requests that use the junction table
    CREATE POLICY "Users can view signature requests"
      ON signature_requests FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM signature_request_documents srd
          JOIN documents d ON d.id = srd.document_id
          WHERE srd.signature_request_id = signature_requests.id
          AND d.user_id = auth.uid()
        )
        OR
        EXISTS (
          SELECT 1 FROM auth.users
          WHERE auth.uid() = id
        )
      );

    -- Allow any authenticated user to insert signature requests
    CREATE POLICY "Users can insert signature requests"
      ON signature_requests FOR INSERT
      WITH CHECK (auth.uid() IS NOT NULL);

    CREATE POLICY "Users can update signature requests"
      ON signature_requests FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM signature_request_documents srd
          JOIN documents d ON d.id = srd.document_id
          WHERE srd.signature_request_id = signature_requests.id
          AND d.user_id = auth.uid()
        )
        OR
        EXISTS (
          SELECT 1 FROM auth.users
          WHERE auth.uid() = id
        )
      );

    CREATE POLICY "Users can delete signature requests"
      ON signature_requests FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM signature_request_documents srd
          JOIN documents d ON d.id = srd.document_id
          WHERE srd.signature_request_id = signature_requests.id
          AND d.user_id = auth.uid()
        )
        OR
        EXISTS (
          SELECT 1 FROM auth.users
          WHERE auth.uid() = id
        )
      );
  END IF;
END
$$;
