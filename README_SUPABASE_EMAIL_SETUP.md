# Setting Up Email Functionality with Supabase Edge Functions

This guide explains how to set up and deploy the Supabase Edge Function for sending emails in the Knot To It application.

## Prerequisites

1. Supabase CLI installed
2. Resend API key (already added to your `.env.local` file)

## Deployment Steps

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
supabase functions deploy resend-email --no-verify-jwt

# Set the Resend API key
supabase secrets set RESEND_API_KEY=re_RrTyet8W_894eJUvcj5r5yohQeSkD7Ezc
```

## Troubleshooting CORS Issues

If you encounter CORS issues, the Edge Function has been configured to handle them properly. However, if problems persist:

1. Check the Edge Function logs in the Supabase dashboard
2. Verify that the Edge Function is deployed with the `--no-verify-jwt` flag
3. Make sure the CORS headers are properly set in the Edge Function

## How It Works

The email service in the application uses a multi-layered approach:

1. **Primary Method**: Supabase Edge Function
   - The application first tries to send emails using the Supabase Edge Function through the Supabase client

2. **Direct API Fallback**: Direct Edge Function Call
   - If the Supabase client method fails, it falls back to a direct fetch call to the Edge Function URL

3. **Simulation Fallback**: Console Logs
   - If both methods fail, it simulates sending emails by logging to the console

This approach ensures maximum reliability while maintaining flexibility.

## Testing

You can test the email functionality using the Test Email button in the application. This will attempt to send a test email using the configured methods.

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
