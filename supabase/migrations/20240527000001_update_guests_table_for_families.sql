-- Update guests table to support couples and children
ALTER TABLE guests 
  ADD COLUMN IF NOT EXISTS is_couple BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS partner_first_name TEXT,
  ADD COLUMN IF NOT EXISTS partner_last_name TEXT,
  ADD COLUMN IF NOT EXISTS partner_email TEXT,
  ADD COLUMN IF NOT EXISTS partner_meal_preference TEXT,
  ADD COLUMN IF NOT EXISTS has_children BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS children JSONB;

-- Drop the plus_one and plus_one_name columns (we'll migrate data in the application)
-- We're not actually dropping them here to avoid data loss, but in a real migration
-- you would add a migration script to move data from plus_one to is_couple and
-- plus_one_name to partner fields
-- ALTER TABLE guests DROP COLUMN plus_one;
-- ALTER TABLE guests DROP COLUMN plus_one_name;
