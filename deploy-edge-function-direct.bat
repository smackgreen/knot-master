@echo off
echo Deploying Supabase Edge Function for Email Sending

echo.
echo Step 1: Logging in to Supabase (if not already logged in)
echo If you're already logged in, you can skip this step by pressing Ctrl+C when prompted
supabase login

echo.
echo Step 2: Deploying the resend-email function directly to Supabase
supabase functions deploy resend-email --project-ref zkrtaixltensetceanmv --no-verify-jwt

echo.
echo Step 3: Setting the Resend API key
supabase secrets set RESEND_API_KEY=re_RrTyet8W_894eJUvcj5r5yohQeSkD7Ezc --project-ref zkrtaixltensetceanmv

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
