# Setting Up Email Functionality with Supabase Edge Functions

This guide explains how to set up and deploy the Supabase Edge Function for sending emails in the Knot To It application.

## Prerequisites

1. Supabase CLI installed
2. Resend API key (stored as a Supabase secret — **never in the frontend**)

## Security Architecture

The Resend API key is stored **exclusively** as a Supabase Edge Function secret. It is:

- ✅ Read by the Edge Function via `Deno.env.get('RESEND_API_KEY')`
- ❌ **NOT** in the frontend `.env` file (no `VITE_RESEND_API_KEY`)
- ❌ **NOT** bundled into the frontend JavaScript

This ensures the API key cannot be extracted from the browser.

## Deployment Steps

### 1. Deploy the Edge Function

We've created a batch file to simplify the deployment process. Run:

```
deploy-resend-function.bat
```

This script will:
1. Deploy the Edge Function with JWT verification disabled
2. Set the Resend API key as a secret (reads from your system `%RESEND_API_KEY%` environment variable)

**Important:** Before running the script, set the `RESEND_API_KEY` environment variable on your system:

```batch
set RESEND_API_KEY=your_resend_api_key
```

### 2. Manual Deployment (Alternative)

If you prefer to deploy manually:

```bash
# Deploy the Edge Function with JWT verification disabled
supabase functions deploy resend-email --project-ref zkrtaixltensetceanmv --no-verify-jwt

# Set the Resend API key as a secret
supabase secrets set RESEND_API_KEY=your_resend_api_key --project-ref zkrtaixltensetceanmv
```

## Troubleshooting CORS Issues

If you encounter CORS issues, the Edge Function has been configured to handle them properly. However, if problems persist:

1. Check the Edge Function logs in the Supabase dashboard
2. Verify that the Edge Function is deployed with the `--no-verify-jwt` flag
3. Make sure the CORS headers are properly set in the Edge Function

## How It Works

The email service uses the Supabase Edge Function:

1. **Frontend** (`emailService.ts`) calls `supabase.functions.invoke('resend-email', ...)`
2. **Edge Function** authenticates the request, renders the email template, and sends via Resend API
3. **Resend API** delivers the email

All email templates are rendered server-side in the Edge Function.

## Testing

You can test the email functionality using the Test Email button in the application. This will attempt to send a test email using the configured Edge Function.

## Edge Function Configuration

The Edge Function is configured to:

1. Accept requests from allowed origins (CORS)
2. Validate Supabase JWT tokens for authentication
3. Use the Resend API key stored as a Supabase secret
4. Support different email templates (signature request, confirmation, test)

## Updating the Edge Function

If you need to make changes to the Edge Function:

1. Edit the files in `supabase/functions/resend-email/`
2. Re-deploy using the deployment script or manual commands

Remember that any changes to the Edge Function require redeployment.
