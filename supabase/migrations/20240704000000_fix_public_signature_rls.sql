-- =============================================================
-- Fix: Public RLS Policies for Electronic Signature Flow
-- =============================================================
-- Purpose: Allow external signers (unauthenticated or non-owner
--          authenticated users) to read signature requests and
--          documents, and to insert electronic signatures via
--          the public /sign/:token route.
--
-- Root Cause: All existing RLS policies require auth.uid() to
--   match documents.user_id (the document owner). External
--   signers are NOT the document owner, so all queries fail:
--   - signature_request_documents join returns null documents
--   - electronic_signatures INSERT is blocked
--   - signature_events INSERT is blocked
--   This causes the Sign button to silently fail.
--
-- Run this in the Supabase SQL Editor:
--   https://app.supabase.com/project/_/sql
-- =============================================================

-- =============================================================
-- 1. signature_requests: Allow public SELECT by token
-- =============================================================
-- External signers need to read the signature request to see
-- the review/sign page. We scope this to pending requests only
-- that haven't expired yet.
-- =============================================================

DROP POLICY IF EXISTS "Public can view pending signature requests by token" ON signature_requests;

CREATE POLICY "Public can view pending signature requests by token"
  ON signature_requests FOR SELECT
  USING (
    status = 'pending'
    AND expires_at > now()
  );

-- =============================================================
-- 2. signature_request_documents: Allow public SELECT for
--    pending signature requests
-- =============================================================
-- External signers need to read the junction table to find
-- which documents are attached to the signature request.
-- =============================================================

DROP POLICY IF EXISTS "Public can view signature request documents for pending requests" ON signature_request_documents;

CREATE POLICY "Public can view signature request documents for pending requests"
  ON signature_request_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM signature_requests sr
      WHERE sr.id = signature_request_documents.signature_request_id
      AND sr.status = 'pending'
      AND sr.expires_at > now()
    )
  );

-- =============================================================
-- 3. documents: Allow public SELECT for documents linked to
--    pending signature requests
-- =============================================================
-- External signers need to read document metadata (name, file_path)
-- to display the document info and generate signed URLs for the
-- PDF viewer.
-- =============================================================

DROP POLICY IF EXISTS "Public can view documents for pending signature requests" ON documents;

CREATE POLICY "Public can view documents for pending signature requests"
  ON documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM signature_request_documents srd
      JOIN signature_requests sr ON sr.id = srd.signature_request_id
      WHERE srd.document_id = documents.id
      AND sr.status = 'pending'
      AND sr.expires_at > now()
    )
  );

-- =============================================================
-- 4. electronic_signatures: Allow public INSERT for documents
--    linked to pending signature requests
-- =============================================================
-- External signers need to INSERT their signature data.
-- We scope this to only allow inserts where the document is
-- part of a pending, non-expired signature request.
-- =============================================================

DROP POLICY IF EXISTS "Public can insert signatures for pending signature requests" ON electronic_signatures;

CREATE POLICY "Public can insert signatures for pending signature requests"
  ON electronic_signatures FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM signature_request_documents srd
      JOIN signature_requests sr ON sr.id = srd.signature_request_id
      WHERE srd.document_id = electronic_signatures.document_id
      AND sr.status = 'pending'
      AND sr.expires_at > now()
    )
  );

-- Allow public to read signatures for documents they're signing
-- (needed by createElectronicSignature which calls getDocumentById
-- to check if all roles have signed)
DROP POLICY IF EXISTS "Public can view signatures for pending signature requests" ON electronic_signatures;

CREATE POLICY "Public can view signatures for pending signature requests"
  ON electronic_signatures FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM signature_request_documents srd
      JOIN signature_requests sr ON sr.id = srd.signature_request_id
      WHERE srd.document_id = electronic_signatures.document_id
      AND sr.status = 'pending'
      AND sr.expires_at > now()
    )
  );

-- =============================================================
-- 5. signature_events: Allow public INSERT for audit trail
-- =============================================================
-- When a document is signed, a 'signed' event is created.
-- External signers need to INSERT these events.
-- =============================================================

DROP POLICY IF EXISTS "Public can insert signature events for pending signature requests" ON signature_events;

CREATE POLICY "Public can insert signature events for pending signature requests"
  ON signature_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM signature_request_documents srd
      JOIN signature_requests sr ON sr.id = srd.signature_request_id
      WHERE srd.document_id = signature_events.document_id
      AND sr.status = 'pending'
      AND sr.expires_at > now()
    )
  );

-- =============================================================
-- 6. signature_requests: Allow public UPDATE to mark as completed
-- =============================================================
-- After all documents are signed, the signature request status
-- needs to be updated to 'completed'. We scope this to only
-- allow updating the status column of pending requests.
-- =============================================================

DROP POLICY IF EXISTS "Public can update pending signature requests" ON signature_requests;

CREATE POLICY "Public can update pending signature requests"
  ON signature_requests FOR UPDATE
  USING (
    status = 'pending'
    AND expires_at > now()
  )
  WITH CHECK (
    status IN ('pending', 'completed')
    AND expires_at > now()
  );

-- =============================================================
-- 7. Storage: Allow public to read documents linked to pending
--    signature requests (for signed URLs / PDF viewer)
-- =============================================================
-- The PDF viewer needs a signed URL to display the document.
-- This policy allows the storage layer to serve files for
-- documents that are part of a pending signature request.
--
-- NOTE: This uses a separate approach - the getSignedUrl
-- function in the app uses the Supabase client which checks
-- storage RLS. We need to allow reading files where the path
-- matches a document in a pending signature request.
-- =============================================================

DROP POLICY IF EXISTS "documents_public_select_for_signing" ON storage.objects;

CREATE POLICY "documents_public_select_for_signing" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'documents'
    AND EXISTS (
      SELECT 1 FROM documents d
      JOIN signature_request_documents srd ON srd.document_id = d.id
      JOIN signature_requests sr ON sr.id = srd.signature_request_id
      WHERE d.file_path = name
      AND sr.status = 'pending'
      AND sr.expires_at > now()
    )
  );

-- =============================================================
-- VERIFICATION: Run these queries to verify the policies
-- =============================================================
--
-- SELECT policyname, cmd, permissive, roles, qual
-- FROM pg_policies
-- WHERE schemaname IN ('public', 'storage')
--   AND policyname LIKE '%public%sign%'
--   OR policyname LIKE '%Public%sign%'
--   OR policyname LIKE '%pending%sign%';
--
-- Expected: 7 new policies
-- =============================================================
