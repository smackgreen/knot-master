@echo off
echo Deploying Supabase Edge Function for Email Sending

echo.
echo Step 1: Linking to Supabase project
supabase link --project-ref zkrtaixltensetceanmv

echo.
echo Step 2: Deploying the resend-email function
supabase functions deploy resend-email

echo.
echo Deployment complete!
echo.
echo To set the Resend API key, run:
echo supabase secrets set RESEND_API_KEY=your_resend_api_key
echo.
echo To test the function, run:
echo node test-email-function.js
echo.

pause
