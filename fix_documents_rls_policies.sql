-- =============================================================
-- Fix: Documents Bucket RLS Policies
-- =============================================================
-- Purpose: Resolve 403 Unauthorized error when uploading documents
--          via Uppy file uploader to the 'documents' bucket.
--
-- Error: "new row violates row-level security policy"
-- Cause:  Missing or incorrect RLS policies on storage.objects
--         for the 'documents' bucket.
--
-- Run this in the Supabase SQL Editor:
--   https://app.supabase.com/project/_/sql
-- =============================================================

-- =============================================================
-- STEP 0: Diagnostic — Check current state
-- =============================================================
-- Run this first to see what policies currently exist:
--
-- SELECT policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'storage' AND tablename = 'objects'
--   AND policyname LIKE 'documents%';
--
-- Check if the bucket exists:
-- SELECT * FROM storage.buckets WHERE id = 'documents';
-- =============================================================


-- =============================================================
-- STEP 1: Create the 'documents' bucket if it doesn't exist
-- =============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,  -- Private bucket: signed URLs required for access
  52428800,  -- 50 MB limit
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
)
ON CONFLICT (id) DO NOTHING;


-- =============================================================
-- STEP 2: Ensure RLS is enabled on storage.objects
-- =============================================================
-- RLS is enabled by default on storage.objects in Supabase,
-- but this ensures it's on:
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;


-- =============================================================
-- STEP 3: Drop any existing conflicting policies (safe to re-run)
-- =============================================================
DROP POLICY IF EXISTS "documents_owner_select" ON storage.objects;
DROP POLICY IF EXISTS "documents_owner_insert" ON storage.objects;
DROP POLICY IF EXISTS "documents_owner_update" ON storage.objects;
DROP POLICY IF EXISTS "documents_owner_delete" ON storage.objects;


-- =============================================================
-- STEP 4: Create the RLS policies
-- =============================================================

-- ---------------------------------------------------------------
-- 4a. SELECT: Users can read files only under their own user_id/
--      Path pattern: {user_id}/{uuid}-{filename}
--      storage.foldername(name) splits the path by '/'
--      [1] returns the first folder = user_id
-- ---------------------------------------------------------------
CREATE POLICY "documents_owner_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------
-- 4b. INSERT: Users can upload files only to their own folder
--      This is the critical policy that fixes the 403 error.
--
--      WITH CHECK is evaluated against the NEW row being inserted.
--      - bucket_id must be 'documents'
--      - The first path segment must match the authenticated user's ID
--
--      How it works:
--      1. Upload path: "{user_id}/{uuid}-{filename}"
--      2. storage.foldername(name) → ['{user_id}', '{uuid}-{filename}']
--      3. [1] → '{user_id}'
--      4. auth.uid()::text → '{user_id}' (the caller's UUID as text)
--      5. Match → INSERT allowed
--
--      If a user tries to upload to another user's folder:
--      1. Upload path: "{other_user_id}/{uuid}-{filename}"
--      2. [1] → '{other_user_id}'
--      3. auth.uid()::text → '{user_id}' (the caller's UUID)
--      4. No match → INSERT denied (403)
-- ---------------------------------------------------------------
CREATE POLICY "documents_owner_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------
-- 4c. UPDATE: Users can update only their own files
-- ---------------------------------------------------------------
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

-- ---------------------------------------------------------------
-- 4d. DELETE: Users can delete only their own files
-- ---------------------------------------------------------------
CREATE POLICY "documents_owner_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );


-- =============================================================
-- STEP 5: Verify the policies were created
-- =============================================================
-- Run this after executing the above to verify:
--
-- SELECT policyname, cmd, permissive, roles, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'storage'
--   AND tablename = 'objects'
--   AND policyname LIKE 'documents%';
--
-- Expected output: 4 rows
--   documents_owner_select | SELECT  | PERMISSIVE | {authenticated} | ...
--   documents_owner_insert | INSERT  | PERMISSIVE | {authenticated} | ...
--   documents_owner_update | UPDATE  | PERMISSIVE | {authenticated} | ...
--   documents_owner_delete | DELETE  | PERMISSIVE | {authenticated} | ...
-- =============================================================


-- =============================================================
-- STEP 6: Test the upload (optional)
-- =============================================================
-- After applying the policies, test by uploading a document
-- through the application at /app/documents
--
-- Or test via the Supabase JS client in the browser console:
--
-- const { data, error } = await supabase.storage
--   .from('documents')
--   .upload('YOUR_USER_ID/test.txt', new Blob(['test'], { type: 'text/plain' }));
-- console.log(data, error);
--
-- Replace YOUR_USER_ID with your actual auth.uid()
-- =============================================================
