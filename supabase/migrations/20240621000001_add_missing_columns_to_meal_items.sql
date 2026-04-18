-- Add missing columns to meal_items table
DO $$
BEGIN
  -- Add image_url column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'meal_items'
    AND column_name = 'image_url'
  ) THEN
    ALTER TABLE meal_items ADD COLUMN image_url TEXT;
  END IF;

  -- Add seasonality column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'meal_items'
    AND column_name = 'seasonality'
  ) THEN
    ALTER TABLE meal_items ADD COLUMN seasonality TEXT[];
  END IF;

  -- Add region column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'meal_items'
    AND column_name = 'region'
  ) THEN
    ALTER TABLE meal_items ADD COLUMN region TEXT;
  END IF;
END $$;
