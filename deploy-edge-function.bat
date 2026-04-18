@echo off
echo Deploying Supabase Edge Function for Email Sending

echo.
echo Step 1: Linking to Supabase project
supabase link --project-ref zkrtaixltensetceanmv

echo.
echo Step 2: Deploying the resend-email function
supabase functions deploy resend-email --no-verify-jwt --import-map ./supabase/functions/resend-email/import_map.json

echo.
echo Step 3: Setting the Resend API key
supabase secrets set RESEND_API_KEY=re_RrTyet8W_894eJUvcj5r5yohQeSkD7Ezc

echo.
echo Deployment complete!
echo.
echo The Edge Function has been deployed with the following configuration:
echo - Function name: resend-email
echo - JWT verification: disabled
echo - Resend API key: set
echo.
echo You can now use the Edge Function to send emails.
echo.

pause
