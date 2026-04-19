# Email Integration with Resend API

This document explains how to set up and use the email integration in the Knot To It application.

## Overview

The application sends emails through a **Supabase Edge Function** that uses the Resend API. The Resend API key is stored securely as a Supabase secret and is **never exposed to the frontend**.

## Architecture

```
Frontend (emailService.ts)
  → supabase.functions.invoke('resend-email')
    → Supabase Edge Function (Deno)
      → Resend API (server-side, API key in secrets)
        → Email Delivery
```

## Setup Instructions

### 1. Resend API Key (Server-Side Only)

The Resend API key must be set as a **Supabase Edge Function secret**. It is NOT stored in the frontend `.env` file.

1. Sign up at [Resend.com](https://resend.com)
2. Create an API key in your dashboard
3. Set it as a Supabase secret:

```bash
supabase secrets set RESEND_API_KEY=your_resend_api_key --project-ref your-project-ref
```

### 2. Deploy the Edge Function

```bash
# Deploy the Edge Function
supabase functions deploy resend-email --project-ref your-project-ref --no-verify-jwt
```

Or use the deployment script (reads `RESEND_API_KEY` from your system environment):

```bash
deploy-resend-function.bat
```

## Usage

The email service provides three main functions:

1. `sendSignatureRequestEmail` — Sends an email to request a signature
2. `sendSignatureConfirmationEmail` — Sends a confirmation email after documents are signed
3. `sendTestEmail` — Sends a test email to verify the email system is working

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

## Email Templates

All HTML email templates are rendered **server-side** in the Edge Function (`supabase/functions/resend-email/index.ts`). The supported template types are:

| Template Type | Description |
|---------------|-------------|
| `signature_request` | Email requesting a document signature |
| `signature_confirmation` | Confirmation that documents were signed |
| `test` | Test email to verify configuration |

## Security

- **No API keys in the frontend**: The `VITE_RESEND_API_KEY` variable has been removed from `.env`. The Resend API key exists only as a Supabase Edge Function secret.
- **JWT Authentication**: The Edge Function validates the Supabase JWT token from the request.
- **CORS Protection**: The Edge Function validates request origins.

## Troubleshooting

### Common Issues

1. **"Email service is not configured"**: Ensure `RESEND_API_KEY` is set as a Supabase secret (`supabase secrets list`).
2. **"Unauthorized"**: The user must be authenticated. The Edge Function validates the Supabase JWT.
3. **Emails only sent to verified email**: When using Resend's default sender (`onboarding@resend.dev`), emails can only be sent to your account's verified email. To send to any address, verify a custom domain at [resend.com/domains](https://resend.com/domains).

### Checking Email Status

You can check the status of your emails in the [Resend dashboard](https://resend.com/emails).

## Development

During development, you can use the `sendTestEmail` function to verify that your email setup is working correctly:

```typescript
import { sendTestEmail } from '@/services/emailService';

// Send a test email to yourself
await sendTestEmail('your-email@example.com', 'Your Name');
```
