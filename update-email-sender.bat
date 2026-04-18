@echo off
echo Updating Supabase Edge Function for Email Sending

echo.
echo Step 1: Deploying the updated resend-email function to Supabase
supabase functions deploy resend-email --project-ref zkrtaixltensetceanmv --no-verify-jwt

echo.
echo Step 2: Ensuring the Resend API key is set
supabase secrets set RESEND_API_KEY=re_RrTyet8W_894eJUvcj5r5yohQeSkD7Ezc --project-ref zkrtaixltensetceanmv

echo.
echo Update complete!
echo.
echo The Edge Function has been updated with the following configuration:
echo - Function name: resend-email
echo - JWT verification: disabled
echo - Resend API key: set
echo - Sender email: smackgreen0@gmail.com (Your verified email)
echo.
echo You can now test the email functionality in your application.
echo.

pause
