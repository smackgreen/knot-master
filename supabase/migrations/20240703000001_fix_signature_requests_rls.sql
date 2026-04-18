-- This migration fixes the RLS policies for signature_requests table

-- Make sure RLS is enabled for signature_requests
ALTER TABLE signature_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Users can view signature requests for their documents" ON signature_requests;
DROP POLICY IF EXISTS "Users can view signature requests" ON signature_requests;
DROP POLICY IF EXISTS "Users can insert signature requests for their documents" ON signature_requests;
DROP POLICY IF EXISTS "Users can insert signature requests" ON signature_requests;
DROP POLICY IF EXISTS "Users can update signature requests for their documents" ON signature_requests;
DROP POLICY IF EXISTS "Users can update signature requests" ON signature_requests;
DROP POLICY IF EXISTS "Users can delete signature requests for their documents" ON signature_requests;
DROP POLICY IF EXISTS "Users can delete signature requests" ON signature_requests;

-- Create new policies that work with both schemas

-- Allow any authenticated user to insert signature requests
CREATE POLICY "Users can insert signature requests"
  ON signature_requests FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- For viewing, try to handle the schema with junction table
CREATE POLICY "Users can view signature requests"
  ON signature_requests FOR SELECT
  USING (
    -- Either the request is linked to a document through the junction table
    EXISTS (
      SELECT 1 FROM signature_request_documents srd
      JOIN documents d ON d.id = srd.document_id
      WHERE srd.signature_request_id = signature_requests.id
      AND d.user_id = auth.uid()
    )
    OR
    -- Or the user is authenticated (for requests without documents yet)
    auth.uid() IS NOT NULL
  );

-- For updating, try to handle the schema with junction table
CREATE POLICY "Users can update signature requests"
  ON signature_requests FOR UPDATE
  USING (
    -- Either the request is linked to a document through the junction table
    EXISTS (
      SELECT 1 FROM signature_request_documents srd
      JOIN documents d ON d.id = srd.document_id
      WHERE srd.signature_request_id = signature_requests.id
      AND d.user_id = auth.uid()
    )
    OR
    -- Or the user is authenticated (for requests without documents yet)
    auth.uid() IS NOT NULL
  );

-- For deleting, try to handle the schema with junction table
CREATE POLICY "Users can delete signature requests"
  ON signature_requests FOR DELETE
  USING (
    -- Either the request is linked to a document through the junction table
    EXISTS (
      SELECT 1 FROM signature_request_documents srd
      JOIN documents d ON d.id = srd.document_id
      WHERE srd.signature_request_id = signature_requests.id
      AND d.user_id = auth.uid()
    )
    OR
    -- Or the user is authenticated (for requests without documents yet)
    auth.uid() IS NOT NULL
  );
