-- =============================================================
-- CONSOLIDATED FIX: Clean up and recreate ALL RLS policies for
-- the electronic signature flow
-- =============================================================
-- PURPOSE:
--   This script resolves the "noDocumentsFound" error on the
--   public /sign/:token route by:
--   1. Dropping ALL existing RLS policies on signature-related
--      tables (from multiple conflicting migrations)
--   2. Creating a clean, minimal set of policies that work for
--      BOTH authenticated users AND public (anonymous) signers
--
-- BACKGROUND:
--   Policies were created by 5+ different migrations/scripts:
--   - 20240701000000_create_electronic_signature_tables.sql
--   - 20240702000000_add_sms_verification_and_multi_document_support.sql
--   - 20240703000000_fix_signature_request_documents_relationship.sql
--   - 20240703000001_fix_signature_requests_rls.sql
--   - 20240704000000_fix_public_signature_rls.sql
--   - complete_schema.sql
--   - fix_documents_rls_policies.sql
--   - fix_storage_bucket_policies.sql
--   This caused conflicting/duplicate policies.
--
-- RUN THIS IN THE SUPABASE SQL EDITOR:
--   https://app.supabase.com/project/_/sql
-- =============================================================

-- =============================================================
-- STEP 0: Create SECURITY DEFINER helper functions
-- =============================================================
-- These functions bypass RLS, preventing infinite recursion
-- when policies reference each other across tables.
-- =============================================================

-- Check if a document is part of a pending, non-expired signature request
CREATE OR REPLACE FUNCTION is_document_in_pending_signature_request(doc_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM signature_request_documents srd
    JOIN signature_requests sr ON sr.id = srd.signature_request_id
    WHERE srd.document_id = doc_id
    AND sr.status = 'pending'
    AND sr.expires_at > now()
  );
$$;

-- Check if a signature request is pending and not expired
CREATE OR REPLACE FUNCTION is_signature_request_pending(req_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM signature_requests
    WHERE id = req_id
    AND status = 'pending'
    AND expires_at > now()
  );
$$;

-- Check if a storage object path belongs to a document in a pending signature request
CREATE OR REPLACE FUNCTION is_storage_object_in_pending_signature_request(obj_name TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM documents d
    JOIN signature_request_documents srd ON srd.document_id = d.id
    JOIN signature_requests sr ON sr.id = srd.signature_request_id
    WHERE d.file_path = obj_name
    AND sr.status = 'pending'
    AND sr.expires_at > now()
  );
$$;


-- =============================================================
-- STEP 1: Drop ALL existing policies on signature-related tables
-- =============================================================
-- We drop every known policy name from every migration to ensure
-- a clean slate. "IF EXISTS" makes this safe to re-run.
-- =============================================================

-- ---------- documents ----------
DROP POLICY IF EXISTS "Users can view their own documents" ON documents;
DROP POLICY IF EXISTS "Users can insert their own documents" ON documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON documents;
DROP POLICY IF EXISTS "Public can view documents for pending signature requests" ON documents;
DROP POLICY IF EXISTS "documents_select" ON documents;
DROP POLICY IF EXISTS "documents_insert" ON documents;
DROP POLICY IF EXISTS "documents_update" ON documents;
DROP POLICY IF EXISTS "documents_delete" ON documents;
DROP POLICY IF EXISTS "d_select" ON documents;
DROP POLICY IF EXISTS "d_insert" ON documents;
DROP POLICY IF EXISTS "d_update" ON documents;
DROP POLICY IF EXISTS "d_delete" ON documents;

-- ---------- signature_requests ----------
DROP POLICY IF EXISTS "Users can view signature requests for their documents" ON signature_requests;
DROP POLICY IF EXISTS "Users can insert signature requests for their documents" ON signature_requests;
DROP POLICY IF EXISTS "Users can update signature requests for their documents" ON signature_requests;
DROP POLICY IF EXISTS "Users can delete signature requests for their documents" ON signature_requests;
DROP POLICY IF EXISTS "Users can view signature requests" ON signature_requests;
DROP POLICY IF EXISTS "Users can insert signature requests" ON signature_requests;
DROP POLICY IF EXISTS "Users can update signature requests" ON signature_requests;
DROP POLICY IF EXISTS "Users can delete signature requests" ON signature_requests;
DROP POLICY IF EXISTS "Public can view pending signature requests by token" ON signature_requests;
DROP POLICY IF EXISTS "Public can update pending signature requests" ON signature_requests;
DROP POLICY IF EXISTS "sr_select" ON signature_requests;
DROP POLICY IF EXISTS "sr_insert" ON signature_requests;
DROP POLICY IF EXISTS "sr_update" ON signature_requests;
DROP POLICY IF EXISTS "sr_delete" ON signature_requests;

-- ---------- signature_request_documents ----------
DROP POLICY IF EXISTS "Users can view their own signature request documents" ON signature_request_documents;
DROP POLICY IF EXISTS "Users can insert their own signature request documents" ON signature_request_documents;
DROP POLICY IF EXISTS "Users can delete their own signature request documents" ON signature_request_documents;
DROP POLICY IF EXISTS "Public can view signature request documents for pending requests" ON signature_request_documents;
DROP POLICY IF EXISTS "srd_select" ON signature_request_documents;
DROP POLICY IF EXISTS "srd_insert" ON signature_request_documents;
DROP POLICY IF EXISTS "srd_delete" ON signature_request_documents;

-- ---------- electronic_signatures ----------
DROP POLICY IF EXISTS "Users can view signatures for their documents" ON electronic_signatures;
DROP POLICY IF EXISTS "Users can insert signatures for their documents" ON electronic_signatures;
DROP POLICY IF EXISTS "Public can insert signatures for pending signature requests" ON electronic_signatures;
DROP POLICY IF EXISTS "Public can view signatures for pending signature requests" ON electronic_signatures;
DROP POLICY IF EXISTS "es_select" ON electronic_signatures;
DROP POLICY IF EXISTS "es_insert" ON electronic_signatures;

-- ---------- signature_events ----------
DROP POLICY IF EXISTS "Users can view signature events for their documents" ON signature_events;
DROP POLICY IF EXISTS "Users can insert signature events for their documents" ON signature_events;
DROP POLICY IF EXISTS "Public can insert signature events for pending signature requests" ON signature_events;
DROP POLICY IF EXISTS "sev_select" ON signature_events;
DROP POLICY IF EXISTS "sev_insert" ON signature_events;

-- ---------- storage.objects (documents bucket only) ----------
DROP POLICY IF EXISTS "documents_owner_select" ON storage.objects;
DROP POLICY IF EXISTS "documents_owner_insert" ON storage.objects;
DROP POLICY IF EXISTS "documents_owner_update" ON storage.objects;
DROP POLICY IF EXISTS "documents_owner_delete" ON storage.objects;
DROP POLICY IF EXISTS "documents_public_select_for_signing" ON storage.objects;
-- Also drop any unnamed/unknown policies for the documents bucket
-- (We'll recreate only the ones we need)


-- =============================================================
-- STEP 2: Ensure RLS is enabled on all tables
-- =============================================================
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE signature_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE signature_request_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE electronic_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE signature_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;


-- =============================================================
-- STEP 3: Create clean, minimal policies
-- =============================================================
-- Design principles:
--   - Authenticated users (document owners) can CRUD their own data
--   - Anonymous/public signers can READ pending signature requests
--     and INSERT signatures via the /sign/:token route
--   - SECURITY DEFINER functions break circular RLS references
--   - All policies are PERMISSIVE (OR'd together)
-- =============================================================

-- ==================== documents ====================

-- Owners can manage their own documents
CREATE POLICY "doc_owner_select" ON documents
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "doc_owner_insert" ON documents
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "doc_owner_update" ON documents
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "doc_owner_delete" ON documents
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Public signers can view documents linked to pending signature requests
-- (No TO clause = applies to all roles including anon)
CREATE POLICY "doc_public_signing_select" ON documents
  FOR SELECT
  USING (
    is_document_in_pending_signature_request(documents.id)
  );


-- ==================== signature_requests ====================

-- Authenticated users can manage signature requests for their documents
CREATE POLICY "sr_auth_select" ON signature_requests
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM signature_request_documents srd
      JOIN documents d ON d.id = srd.document_id
      WHERE srd.signature_request_id = signature_requests.id
      AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "sr_auth_insert" ON signature_requests
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "sr_auth_update" ON signature_requests
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM signature_request_documents srd
      JOIN documents d ON d.id = srd.document_id
      WHERE srd.signature_request_id = signature_requests.id
      AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "sr_auth_delete" ON signature_requests
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM signature_request_documents srd
      JOIN documents d ON d.id = srd.document_id
      WHERE srd.signature_request_id = signature_requests.id
      AND d.user_id = auth.uid()
    )
  );

-- Public signers can view and update pending signature requests
CREATE POLICY "sr_public_select" ON signature_requests
  FOR SELECT
  USING (
    status = 'pending'
    AND expires_at > now()
  );

CREATE POLICY "sr_public_update" ON signature_requests
  FOR UPDATE
  USING (
    status = 'pending'
    AND expires_at > now()
  )
  WITH CHECK (
    status IN ('pending', 'completed')
    AND expires_at > now()
  );


-- ==================== signature_request_documents ====================

-- Authenticated users (document owners) can manage junction entries
CREATE POLICY "srd_auth_select" ON signature_request_documents
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = signature_request_documents.document_id
      AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "srd_auth_insert" ON signature_request_documents
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = signature_request_documents.document_id
      AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "srd_auth_delete" ON signature_request_documents
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = signature_request_documents.document_id
      AND d.user_id = auth.uid()
    )
  );

-- Public signers can view junction entries for pending requests
CREATE POLICY "srd_public_select" ON signature_request_documents
  FOR SELECT
  USING (
    is_signature_request_pending(signature_request_documents.signature_request_id)
  );


-- ==================== electronic_signatures ====================

-- Authenticated users (document owners) can view/insert signatures
CREATE POLICY "es_auth_select" ON electronic_signatures
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = electronic_signatures.document_id
      AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "es_auth_insert" ON electronic_signatures
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = electronic_signatures.document_id
      AND d.user_id = auth.uid()
    )
  );

-- Public signers can view and insert signatures for pending requests
CREATE POLICY "es_public_select" ON electronic_signatures
  FOR SELECT
  USING (
    is_document_in_pending_signature_request(electronic_signatures.document_id)
  );

CREATE POLICY "es_public_insert" ON electronic_signatures
  FOR INSERT
  WITH CHECK (
    is_document_in_pending_signature_request(electronic_signatures.document_id)
  );


-- ==================== signature_events ====================

-- Authenticated users (document owners) can view/insert events
CREATE POLICY "sev_auth_select" ON signature_events
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = signature_events.document_id
      AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "sev_auth_insert" ON signature_events
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = signature_events.document_id
      AND d.user_id = auth.uid()
    )
  );

-- Public signers can insert events for audit trail
CREATE POLICY "sev_public_insert" ON signature_events
  FOR INSERT
  WITH CHECK (
    is_document_in_pending_signature_request(signature_events.document_id)
  );


-- ==================== storage.objects (documents bucket) ====================

-- Authenticated users can manage files in their own folder
CREATE POLICY "documents_owner_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "documents_owner_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "documents_owner_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "documents_owner_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Public signers can read documents for pending signature requests
-- (needed for signed URLs / PDF viewer)
CREATE POLICY "documents_public_signing_select" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'documents'
    AND is_storage_object_in_pending_signature_request(name)
  );


-- =============================================================
-- STEP 4: Verify — Run these queries to check the result
-- =============================================================
-- SELECT tablename, policyname, cmd, permissive, roles
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND tablename IN ('documents', 'signature_requests',
--     'signature_request_documents', 'electronic_signatures',
--     'signature_events')
-- ORDER BY tablename, policyname;
--
-- Expected:
--   documents:                    5 policies (4 owner + 1 public signing)
--   signature_requests:           6 policies (4 auth + 2 public)
--   signature_request_documents:  4 policies (3 auth + 1 public)
--   electronic_signatures:        4 policies (2 auth + 2 public)
--   signature_events:             3 policies (2 auth + 1 public)
--
-- For storage.objects (documents bucket):
-- SELECT policyname, cmd, permissive, roles
-- FROM pg_policies
-- WHERE schemaname = 'storage' AND tablename = 'objects'
--   AND policyname LIKE 'documents%';
--
-- Expected: 5 policies (4 owner + 1 public signing)
-- =============================================================


-- =============================================================
-- STEP 5: Test with the actual token
-- =============================================================
-- Replace the token below with the actual one from the URL:
--
-- SELECT 'signature_request' as check_type, sr.id, sr.token, sr.status, sr.expires_at,
--   now() as current_time, sr.expires_at > now() as is_not_expired
-- FROM signature_requests sr
-- WHERE sr.token = '0cf9ed63-808b-481e-9c56-7aa83b637ed5';
--
-- SELECT 'junction_entries' as check_type, srd.*
-- FROM signature_request_documents srd
-- JOIN signature_requests sr ON sr.id = srd.signature_request_id
-- WHERE sr.token = '0cf9ed63-808b-481e-9c56-7aa83b637ed5';
--
-- SELECT 'linked_documents' as check_type, d.id, d.name, d.file_path
-- FROM documents d
-- JOIN signature_request_documents srd ON srd.document_id = d.id
-- JOIN signature_requests sr ON sr.id = srd.signature_request_id
-- WHERE sr.token = '0cf9ed63-808b-481e-9c56-7aa83b637ed5';
--
-- SELECT 'test_definer_function' as check_type,
--   is_document_in_pending_signature_request(d.id) as function_result
-- FROM documents d
-- JOIN signature_request_documents srd ON srd.document_id = d.id
-- JOIN signature_requests sr ON sr.id = srd.signature_request_id
-- WHERE sr.token = '0cf9ed63-808b-481e-9c56-7aa83b637ed5';
-- =============================================================
