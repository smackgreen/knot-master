# Supabase Edge Function for Email Sending

This document explains how to set up and use the Supabase Edge Function for sending emails in the Knot To It application.

## Overview

The application uses a multi-layered approach to send emails:

1. **Primary Method**: Supabase Client API (`supabase.functions.invoke()`)
2. **Fallback Method**: Direct fetch to Edge Function URL
3. **Last Resort**: Simulated emails (console logs)

This approach ensures maximum reliability while maintaining flexibility.

## Setup Instructions

### 1. Deploy the Edge Function

We've created a batch file to simplify the deployment process. Run:

```
deploy-edge-function.bat
```

This script will:
1. Link to your Supabase project
2. Deploy the Edge Function with JWT verification disabled
3. Set the Resend API key as a secret

### 2. Manual Deployment (Alternative)

If you prefer to deploy manually, follow these steps:

```bash
# Link to your Supabase project
supabase link --project-ref ocrjmlizddgjlcwxpqmq

# Deploy the Edge Function with JWT verification disabled
supabase functions deploy resend-email --no-verify-jwt --import-map ./supabase/functions/resend-email/import_map.json

# Set the Resend API key
supabase secrets set RESEND_API_KEY=re_RrTyet8W_894eJUvcj5r5yohQeSkD7Ezc
```

## How It Works

The email service in the application uses a multi-layered approach:

1. **First Attempt**: The system tries to send emails using the Supabase client's `functions.invoke()` method
2. **Second Attempt**: If that fails, it makes a direct fetch request to the Edge Function URL
3. **Last Resort**: If both methods fail, it simulates sending emails by logging to the console

This approach ensures maximum reliability and graceful degradation.

## Key Features

1. **Enhanced CORS Handling**: The Edge Function has been updated with more permissive CORS headers to work with all clients
2. **Consistent Response Headers**: All responses include the same CORS headers
3. **Proper OPTIONS Handling**: The Edge Function properly handles OPTIONS requests for CORS preflight
4. **Detailed Logging**: Both the Edge Function and client-side code include detailed logging for debugging
5. **Graceful Degradation**: The system falls back to simulation if all else fails

## Testing

You can test the email functionality using the Test Email button in the application. This will attempt to send a test email using all available methods.

## Troubleshooting

If you encounter issues:

1. **Check the Edge Function Logs**: Look at the Supabase dashboard for any errors
2. **Verify CORS Headers**: Make sure the Edge Function is returning the proper CORS headers
3. **Check Network Tab**: Look at the browser's network tab for any CORS errors
4. **Try Direct Fetch**: Test the Edge Function with a direct fetch request
5. **Verify API Key**: Make sure the Resend API key is set correctly

## Edge Function Configuration

The Edge Function is configured to:

1. Accept requests from any origin (CORS)
2. Not require JWT authentication
3. Use the Resend API key stored as a secret
4. Support different email templates (signature request, confirmation, test)

## Updating the Edge Function

If you need to make changes to the Edge Function:

1. Edit the files in `supabase/functions/resend-email/`
2. Re-deploy using the deployment script or manual commands

Remember that any changes to the Edge Function require redeployment.
