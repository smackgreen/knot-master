-- Add image_url column to meal_items table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'meal_items'
    AND column_name = 'image_url'
  ) THEN
    ALTER TABLE meal_items ADD COLUMN image_url TEXT;
  END IF;
END $$;
