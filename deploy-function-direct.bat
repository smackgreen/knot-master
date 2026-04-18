@echo off
echo Deploying Supabase Edge Function for Email Sending

echo.
echo Step 1: Deploying the resend-email function directly to Supabase
supabase functions deploy resend-email --project-ref zkrtaixltensetceanmv --no-verify-jwt

echo.
echo Step 2: Setting the Resend API key
supabase secrets set RESEND_API_KEY=re_RrTyet8W_894eJUvcj5r5yohQeSkD7Ezc --project-ref zkrtaixltensetceanmv

echo.
echo Deployment complete!
echo.
echo The Edge Function has been deployed with the following configuration:
echo - Function name: resend-email
echo - JWT verification: disabled
echo - Resend API key: set
echo - Sender email: onboarding@resend.dev (Resend's default sender)
echo.
echo You can now test the Edge Function by using the Test Email button in your application.
echo.

pause
