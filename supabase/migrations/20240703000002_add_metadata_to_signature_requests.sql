-- This migration adds a metadata column to the signature_requests table

-- Check if the metadata column exists in signature_requests table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'signature_requests' 
    AND column_name = 'metadata'
  ) THEN
    -- Add the metadata column as JSONB
    ALTER TABLE signature_requests ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  END IF;
END
$$;
