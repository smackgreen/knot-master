@echo off
echo Deploying Supabase Edge Function for Email Sending

echo.
echo Step 1: Deploying the updated resend-email function to Supabase
supabase functions deploy resend-email --project-ref zkrtaixltensetceanmv --no-verify-jwt

echo.
echo Step 2: Ensuring the Resend API key is set
supabase secrets set RESEND_API_KEY=%RESEND_API_KEY% --project-ref zkrtaixltensetceanmv

echo.
echo Update complete!
echo.
echo The Edge Function has been updated with the following configuration:
echo - Function name: resend-email
echo - JWT verification: disabled
echo - Resend API key: set
echo - Sender email: onboarding@resend.dev (Resend's default sender)
echo.
echo IMPORTANT: When using Resend's default sender (onboarding@resend.dev),
echo all emails will be redirected to your verified email (smackgreen0@gmail.com).
echo This is because Resend only allows sending to verified emails when using their default sender.
echo.
echo To send to other emails, verify a domain at resend.com/domains
echo.

pause
