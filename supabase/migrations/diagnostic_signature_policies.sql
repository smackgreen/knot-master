-- =============================================================
-- DIAGNOSTIC: Inspect all RLS policies on signature-related tables
-- =============================================================
-- Run this in the Supabase SQL Editor to see all existing policies
-- and identify conflicts or duplicates.
-- =============================================================

-- 1. List ALL policies on the 'documents' table
SELECT 'documents table policies' as check_type, policyname, cmd, permissive, roles,
  pg_get_expr(qual, polrelid) as using_expr,
  pg_get_expr(with_check, polrelid) as with_check_expr
FROM pg_policy p
JOIN pg_class c ON c.oid = p.polrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname = 'documents';

-- 2. List ALL policies on 'signature_request_documents'
SELECT 'signature_request_documents policies' as check_type, policyname, cmd, permissive, roles,
  pg_get_expr(qual, polrelid) as using_expr,
  pg_get_expr(with_check, polrelid) as with_check_expr
FROM pg_policy p
JOIN pg_class c ON c.oid = p.polrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname = 'signature_request_documents';

-- 3. List ALL policies on 'signature_requests'
SELECT 'signature_requests policies' as check_type, policyname, cmd, permissive, roles,
  pg_get_expr(qual, polrelid) as using_expr,
  pg_get_expr(with_check, polrelid) as with_check_expr
FROM pg_policy p
JOIN pg_CLASS c ON c.oid = p.polrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname = 'signature_requests';

-- 4. List ALL policies on 'electronic_signatures'
SELECT 'electronic_signatures policies' as check_type, policyname, cmd, permissive, roles,
  pg_get_expr(qual, polrelid) as using_expr,
  pg_get_expr(with_check, polrelid) as with_check_expr
FROM pg_policy p
JOIN pg_class c ON c.oid = p.polrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname = 'electronic_signatures';

-- 5. List ALL policies on 'signature_events'
SELECT 'signature_events policies' as check_type, policyname, cmd, permissive, roles,
  pg_get_expr(qual, polrelid) as using_expr,
  pg_get_expr(with_check, polrelid) as with_check_expr
FROM pg_policy p
JOIN pg_class c ON c.oid = p.polrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname = 'signature_events';

-- 6. List ALL policies on storage.objects for the 'documents' bucket
SELECT 'storage.objects policies' as check_type, policyname, cmd, permissive, roles,
  pg_get_expr(qual, polrelid) as using_expr,
  pg_get_expr(with_check, polrelid) as with_check_expr
FROM pg_policy p
JOIN pg_class c ON c.oid = p.polrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'storage' AND c.relname = 'objects'
AND policyname LIKE '%document%';

-- 7. Check if the SECURITY DEFINER functions exist
SELECT 'security definer functions' as check_type, routine_name, routine_type
FROM information_schema.routines
WHERE routine_name IN (
  'is_document_in_pending_signature_request',
  'is_signature_request_pending',
  'is_storage_object_in_pending_signature_request'
);

-- 8. Check the actual data for the token
SELECT 'signature_request data' as check_type,
  sr.id, sr.token, sr.status, sr.expires_at, sr.recipient_email,
  now() as current_time,
  sr.expires_at > now() as is_not_expired,
  (SELECT count(*) FROM signature_request_documents srd WHERE srd.signature_request_id = sr.id) as junction_count
FROM signature_requests sr
WHERE sr.token = '0cf9ed63-808b-481e-9c56-7aa83b637ed5';

-- 9. Check junction entries for this signature request
SELECT 'junction entries' as check_type, srd.*
FROM signature_request_documents srd
JOIN signature_requests sr ON sr.id = srd.signature_request_id
WHERE sr.token = '0cf9ed63-808b-481e-9c56-7aa83b637ed5';

-- 10. Check documents linked to this signature request
SELECT 'linked documents' as check_type, d.*
FROM documents d
JOIN signature_request_documents srd ON srd.document_id = d.id
JOIN signature_requests sr ON sr.id = srd.signature_request_id
WHERE sr.token = '0cf9ed63-808b-481e-9c56-7aa83b637ed5';

-- 11. Test the SECURITY DEFINER function directly
SELECT 'test definer function' as check_type,
  is_document_in_pending_signature_request(d.id) as function_result,
  d.id, d.name
FROM documents d
JOIN signature_request_documents srd ON srd.document_id = d.id
JOIN signature_requests sr ON sr.id = srd.signature_request_id
WHERE sr.token = '0cf9ed63-808b-481e-9c56-7aa83b637ed5';
