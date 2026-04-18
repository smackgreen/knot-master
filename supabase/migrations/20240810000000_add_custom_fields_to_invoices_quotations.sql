-- Add customTitle and legalText columns to invoices table
DO $$
BEGIN
  -- Add customTitle column to invoices if it doesn't exist
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'invoices'
    AND column_name = 'custom_title'
  ) THEN
    ALTER TABLE invoices ADD COLUMN custom_title TEXT;
  END IF;

  -- Add legalText column to invoices if it doesn't exist
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'invoices'
    AND column_name = 'legal_text'
  ) THEN
    ALTER TABLE invoices ADD COLUMN legal_text TEXT;
  END IF;

  -- Add customTitle column to quotations if it doesn't exist
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'quotations'
    AND column_name = 'custom_title'
  ) THEN
    ALTER TABLE quotations ADD COLUMN custom_title TEXT;
  END IF;

  -- Add legalText column to quotations if it doesn't exist
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'quotations'
    AND column_name = 'legal_text'
  ) THEN
    ALTER TABLE quotations ADD COLUMN legal_text TEXT;
  END IF;
END $$;

-- Add comment to columns for documentation
COMMENT ON COLUMN invoices.custom_title IS 'Custom title to display in the top-right corner of the invoice PDF';
COMMENT ON COLUMN invoices.legal_text IS 'Legal text to display at the bottom of each page in the invoice PDF';
COMMENT ON COLUMN quotations.custom_title IS 'Custom title to display in the top-right corner of the quotation PDF';
COMMENT ON COLUMN quotations.legal_text IS 'Legal text to display at the bottom of each page in the quotation PDF';
