-- =============================================================
-- Fix: All Storage Bucket RLS Policies
-- =============================================================
-- Purpose: Create all missing storage buckets and their RLS
--          policies on storage.objects.
--
-- Currently only the 'documents' bucket has a dedicated fix
-- script (fix_documents_rls_policies.sql). This script covers
-- ALL six buckets defined in SUPABASE_STORAGE_SETUP.md.
--
-- Run this in the Supabase SQL Editor:
--   https://app.supabase.com/project/_/sql
--
-- This script is idempotent — it drops existing policies first,
-- then recreates them. Buckets use ON CONFLICT DO NOTHING.
-- =============================================================


-- =============================================================
-- STEP 1: Ensure RLS is enabled on storage.objects
-- =============================================================
-- RLS is enabled by default on storage.objects in Supabase,
-- but this ensures it's on:
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;


-- =============================================================
-- STEP 2: Create all storage buckets (if they don't exist)
-- =============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  -- 1. Documents (required — actively used)
  --    Private bucket: signed URLs required for access
  --    50 MB limit, 10 MIME types
  (
    'documents', 'documents', false, 52428800,
    ARRAY[
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv'
    ]
  ),

  -- 2. Avatars (recommended — profile pictures)
  --    Public bucket: anyone can see avatars
  --    2 MB limit, 4 image types
  (
    'avatars', 'avatars', true, 2097152,
    ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']
  ),

  -- 3. Logos (recommended — company logos)
  --    Public bucket: logos appear on shared invoices/quotations
  --    5 MB limit, 4 image types
  (
    'logos', 'logos', true, 5242880,
    ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
  ),

  -- 4. Signatures (optional — electronic signature images)
  --    Private bucket: sensitive legal data
  --    1 MB limit, 2 image types
  (
    'signatures', 'signatures', false, 1048576,
    ARRAY['image/png', 'image/svg+xml']
  ),

  -- 5. Resources (future — equipment, staff, inventory, vehicles)
  --    Public bucket: images may appear in client-facing views
  --    10 MB limit, 4 image types
  (
    'resources', 'resources', true, 10485760,
    ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
  ),

  -- 6. Meal images (future — meal item photos)
  --    Public bucket
  --    5 MB limit, 3 image types
  (
    'meal-images', 'meal-images', true, 5242880,
    ARRAY['image/png', 'image/jpeg', 'image/webp']
  )
ON CONFLICT (id) DO NOTHING;


-- =============================================================
-- STEP 3: Drop all existing storage policies (safe to re-run)
-- =============================================================

-- Documents policies
DROP POLICY IF EXISTS "documents_owner_select" ON storage.objects;
DROP POLICY IF EXISTS "documents_owner_insert" ON storage.objects;
DROP POLICY IF EXISTS "documents_owner_update" ON storage.objects;
DROP POLICY IF EXISTS "documents_owner_delete" ON storage.objects;

-- Avatars policies
DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
DROP POLICY IF EXISTS "avatars_owner_insert" ON storage.objects;
DROP POLICY IF EXISTS "avatars_owner_update" ON storage.objects;
DROP POLICY IF EXISTS "avatars_owner_delete" ON storage.objects;

-- Logos policies
DROP POLICY IF EXISTS "logos_public_read" ON storage.objects;
DROP POLICY IF EXISTS "logos_owner_insert" ON storage.objects;
DROP POLICY IF EXISTS "logos_owner_update" ON storage.objects;
DROP POLICY IF EXISTS "logos_owner_delete" ON storage.objects;

-- Signatures policies
DROP POLICY IF EXISTS "signatures_owner_select" ON storage.objects;
DROP POLICY IF EXISTS "signatures_owner_insert" ON storage.objects;
DROP POLICY IF EXISTS "signatures_owner_update" ON storage.objects;
DROP POLICY IF EXISTS "signatures_owner_delete" ON storage.objects;

-- Resources policies
DROP POLICY IF EXISTS "resources_public_read" ON storage.objects;
DROP POLICY IF EXISTS "resources_owner_insert" ON storage.objects;
DROP POLICY IF EXISTS "resources_owner_update" ON storage.objects;
DROP POLICY IF EXISTS "resources_owner_delete" ON storage.objects;

-- Meal-images policies
DROP POLICY IF EXISTS "meal-images_public_read" ON storage.objects;
DROP POLICY IF EXISTS "meal-images_owner_insert" ON storage.objects;
DROP POLICY IF EXISTS "meal-images_owner_update" ON storage.objects;
DROP POLICY IF EXISTS "meal-images_owner_delete" ON storage.objects;


-- =============================================================
-- STEP 4: Create RLS policies for all buckets
-- =============================================================

-- ---------------------------------------------------------------
-- 4.1 DOCUMENTS (private — owner-prefix access)
--     Path convention: {user_id}/{uuid}-{filename}
--     Access: signed URLs with 1-hour expiry
-- ---------------------------------------------------------------

-- SELECT: owner can read any file under their own user_id prefix
CREATE POLICY "documents_owner_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- INSERT: owner can write only under their own prefix
CREATE POLICY "documents_owner_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- UPDATE: owner only
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

-- DELETE: owner only
CREATE POLICY "documents_owner_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );


-- ---------------------------------------------------------------
-- 4.2 AVATARS (public read — owner-prefix write)
--     Path convention: {user_id}/avatar.{ext}
--     Access: public URLs (no signed URL needed)
-- ---------------------------------------------------------------

-- Public read (anyone can see avatars)
CREATE POLICY "avatars_public_read" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'avatars');

-- Owner-only insert
CREATE POLICY "avatars_owner_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Owner-only update
CREATE POLICY "avatars_owner_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Owner-only delete
CREATE POLICY "avatars_owner_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );


-- ---------------------------------------------------------------
-- 4.3 LOGOS (public read — owner-prefix write)
--     Path convention: {user_id}/logo.{ext}
--     Access: public URLs (logos appear on client-facing docs)
-- ---------------------------------------------------------------

-- Public read (logos appear on client-facing documents)
CREATE POLICY "logos_public_read" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'logos');

-- Owner-only insert
CREATE POLICY "logos_owner_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'logos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Owner-only update
CREATE POLICY "logos_owner_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'logos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Owner-only delete
CREATE POLICY "logos_owner_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'logos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );


-- ---------------------------------------------------------------
-- 4.4 SIGNATURES (private — owner-prefix access)
--     Path convention: {user_id}/{signature_request_id}/{signer_id}.png
--     Access: signed URLs (sensitive legal data)
-- ---------------------------------------------------------------

-- Owner-only read
CREATE POLICY "signatures_owner_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'signatures'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Owner-only insert
CREATE POLICY "signatures_owner_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'signatures'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Owner-only update
CREATE POLICY "signatures_owner_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'signatures'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Owner-only delete
CREATE POLICY "signatures_owner_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'signatures'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );


-- ---------------------------------------------------------------
-- 4.5 RESOURCES (public read — owner-prefix write)
--     Path convention: {user_id}/{resource_type}/{resource_id}.{ext}
--     Access: public URLs (may appear in client-facing views)
-- ---------------------------------------------------------------

-- Public read
CREATE POLICY "resources_public_read" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'resources');

-- Owner-only insert
CREATE POLICY "resources_owner_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'resources'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Owner-only update
CREATE POLICY "resources_owner_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'resources'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Owner-only delete
CREATE POLICY "resources_owner_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'resources'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );


-- ---------------------------------------------------------------
-- 4.6 MEAL-IMAGES (public read — owner-prefix write)
--     Path convention: {user_id}/meal-items/{item_id}.{ext}
--     Access: public URLs
-- ---------------------------------------------------------------

-- Public read
CREATE POLICY "meal-images_public_read" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'meal-images');

-- Owner-only insert
CREATE POLICY "meal-images_owner_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'meal-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Owner-only update
CREATE POLICY "meal-images_owner_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'meal-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Owner-only delete
CREATE POLICY "meal-images_owner_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'meal-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );


-- =============================================================
-- STEP 5: Verify all policies were created
-- =============================================================
-- Run this after executing the above to verify:
--
-- SELECT policyname, cmd, permissive, roles
-- FROM pg_policies
-- WHERE schemaname = 'storage'
--   AND tablename = 'objects'
-- ORDER BY policyname;
--
-- Expected output: 24 rows total
--   documents: 4 rows  (SELECT, INSERT, UPDATE, DELETE)
--   avatars:   4 rows  (SELECT, INSERT, UPDATE, DELETE)
--   logos:     4 rows  (SELECT, INSERT, UPDATE, DELETE)
--   signatures:4 rows  (SELECT, INSERT, UPDATE, DELETE)
--   resources: 4 rows  (SELECT, INSERT, UPDATE, DELETE)
--   meal-images:4 rows (SELECT, INSERT, UPDATE, DELETE)
-- =============================================================


-- =============================================================
-- STEP 6: Verify all buckets were created
-- =============================================================
-- SELECT id, name, public, file_size_limit, allowed_mime_types
-- FROM storage.buckets
-- ORDER BY id;
--
-- Expected output: 6 rows
--   documents    | public=false | 52428800  (50 MB)
--   avatars      | public=true  | 2097152   (2 MB)
--   logos        | public=true  | 5242880   (5 MB)
--   signatures   | public=false | 1048576   (1 MB)
--   resources    | public=true  | 10485760  (10 MB)
--   meal-images  | public=true  | 5242880   (5 MB)
-- =============================================================
