-- Add company profile fields to the profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS company_address TEXT,
ADD COLUMN IF NOT EXISTS company_city TEXT,
ADD COLUMN IF NOT EXISTS company_phone TEXT,
ADD COLUMN IF NOT EXISTS company_email TEXT,
ADD COLUMN IF NOT EXISTS company_website TEXT,
ADD COLUMN IF NOT EXISTS company_logo TEXT,
ADD COLUMN IF NOT EXISTS company_description TEXT;
