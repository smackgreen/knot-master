-- Add company profile fields to the profiles table
DO $$
BEGIN
  -- Check if columns exist before adding them
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'company_name') THEN
    ALTER TABLE profiles ADD COLUMN company_name TEXT;
    COMMENT ON COLUMN profiles.company_name IS 'Company name for the user';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'company_address') THEN
    ALTER TABLE profiles ADD COLUMN company_address TEXT;
    COMMENT ON COLUMN profiles.company_address IS 'Company address';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'company_city') THEN
    ALTER TABLE profiles ADD COLUMN company_city TEXT;
    COMMENT ON COLUMN profiles.company_city IS 'Company city, state, and ZIP';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'company_phone') THEN
    ALTER TABLE profiles ADD COLUMN company_phone TEXT;
    COMMENT ON COLUMN profiles.company_phone IS 'Company phone number';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'company_email') THEN
    ALTER TABLE profiles ADD COLUMN company_email TEXT;
    COMMENT ON COLUMN profiles.company_email IS 'Company email address';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'company_website') THEN
    ALTER TABLE profiles ADD COLUMN company_website TEXT;
    COMMENT ON COLUMN profiles.company_website IS 'Company website URL';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'company_logo') THEN
    ALTER TABLE profiles ADD COLUMN company_logo TEXT;
    COMMENT ON COLUMN profiles.company_logo IS 'Company logo URL';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'company_description') THEN
    ALTER TABLE profiles ADD COLUMN company_description TEXT;
    COMMENT ON COLUMN profiles.company_description IS 'Company description';
  END IF;
END $$;