# Supabase Email Integration with Resend

This document explains how to set up and use the Supabase Edge Function for sending emails using Resend in the Knot To It application.

## Overview

The application uses Supabase Edge Functions to send emails through the Resend email service. This approach allows for server-side email sending without requiring a dedicated backend server.

## Setup Instructions

### 1. Deploy the Edge Function

The Edge Function code is located in the `supabase/functions/resend-email` directory. To deploy it:

1. Install the Supabase CLI if you haven't already:
   ```
   npm install -g supabase
   ```

2. Link your project:
   ```
   supabase link --project-ref ocrjmlizddgjlcwxpqmq
   ```

3. Deploy the function:
   ```
   supabase functions deploy resend-email
   ```

### 2. Set Environment Variables

You need to set the Resend API key as an environment variable for the Edge Function:

```
supabase secrets set RESEND_API_KEY=your_resend_api_key
```

Replace `your_resend_api_key` with your actual Resend API key.

### 3. Test the Function

You can test the function using the Supabase dashboard or by using the `sendTestEmail` function in the application.

## Usage

The email service provides three main functions:

1. `sendSignatureRequestEmail` - Sends an email to request a signature
2. `sendSignatureConfirmationEmail` - Sends a confirmation email after documents are signed
3. `sendTestEmail` - Sends a test email to verify the email system is working

### Example Usage

```typescript
// Import the email service
import { sendTestEmail } from '@/services/emailService';

// Send a test email
const success = await sendTestEmail('recipient@example.com', 'Recipient Name');

if (success) {
  console.log('Email sent successfully');
} else {
  console.error('Failed to send email');
}
```

## Edge Function API

The Edge Function accepts the following parameters:

```typescript
interface EmailRequest {
  to: string;              // Required: Recipient email address
  subject: string;         // Required: Email subject
  html?: string;           // Optional: HTML content (if not using a template)
  text?: string;           // Optional: Plain text content (if not using a template)
  from?: string;           // Optional: Sender email (defaults to Knot To It <signatures@knottoit.com>)
  name?: string;           // Optional: Recipient name (required for templates)
  templateType?: string;   // Optional: Template type ('signature_request', 'signature_confirmation', 'test')
  signatureUrl?: string;   // Optional: URL for signing (required for signature_request template)
  documentNames?: string[]; // Optional: Document names (required for signature_confirmation template)
}
```

## Fallback Mechanism

If the Edge Function fails for any reason, the email service will fall back to simulating email sending by logging the email details to the console. This ensures that the application can continue to function even if there are issues with the email service.

## Troubleshooting

### Common Issues

1. **Function not found**: Make sure you've deployed the function correctly.
2. **Authentication errors**: Check that your Supabase API key has the necessary permissions.
3. **Missing environment variables**: Ensure the RESEND_API_KEY is set correctly.
4. **CORS errors**: If you encounter CORS errors, try the following:
   - Make sure the Edge Function is properly handling OPTIONS requests
   - Check that the CORS headers are being set correctly
   - Verify that your local development server is using the correct URL
   - Try using the deployment script provided: `deploy-email-function.bat`

### CORS Configuration

The Edge Function includes CORS headers to allow requests from any origin. If you're still experiencing CORS issues, you can try:

1. Updating the CORS headers in `supabase/functions/_shared/cors.ts` to specifically allow your development domain:
   ```typescript
   export const corsHeaders = {
     'Access-Control-Allow-Origin': 'http://localhost:8080',
     // other headers...
   };
   ```

2. Checking the Supabase dashboard for any CORS-related settings that might be overriding your function's headers.

3. Using the Supabase CLI to test the function locally:
   ```
   supabase functions serve resend-email
   ```

### Logs

You can view the Edge Function logs in the Supabase dashboard under Functions > Logs. These logs will show any errors that occur when the function is executed, including CORS-related issues.

## Development

During development, you can use the local Supabase CLI to run the function locally:

```
supabase functions serve resend-email
```

This will start a local server that you can use to test the function.
