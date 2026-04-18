# Email Simulation in Knot To It

This document explains the current email simulation approach in the Knot To It application.

## Overview

Due to CORS restrictions when trying to use the Supabase Edge Function or Resend API directly from the browser, the application is currently using a simulation approach for sending emails.

## How It Works

The email service (`src/services/emailService.ts`) has been configured to:

1. Skip the actual API calls to Supabase Edge Functions or Resend API
2. Simulate email sending by logging the email details to the console
3. Return success to allow the application to continue functioning

## Email Templates

Even though emails are simulated, the application still generates proper HTML email templates for:

1. **Signature Requests**: Emails sent to request signatures on documents
2. **Signature Confirmations**: Emails sent to confirm that documents have been signed
3. **Test Emails**: Simple emails to test the email system

## Console Output

When an email is "sent", you'll see output in the browser console like:

```
=== SIMULATED EMAIL SENDING ===
To: recipient@example.com
Subject: Document Signature Request
From: Knot To It <signatures@knottoit.com>
Signature URL: http://localhost:8080/sign/token123
Email Content:
<!DOCTYPE html>...
=== END SIMULATED EMAIL ===
```

## Future Implementation

To implement actual email sending in the future, you have several options:

### Option 1: Server-side Proxy

Create a simple server-side proxy that forwards requests to the Resend API. This avoids CORS issues since the proxy would be on the same domain as your application.

### Option 2: Fix Supabase Edge Function CORS

Deploy the Supabase Edge Function with proper CORS headers to allow requests from your application domain.

### Option 3: Use Supabase Auth Hooks

Configure Supabase Auth Hooks to send emails automatically when certain events occur (like signature requests).

## Testing

You can test the email simulation by:

1. Using the Test Email button in the application
2. Creating a signature request
3. Checking the browser console for the simulated email output

## Environment Variables

The application is still configured to use the Resend API key from your environment variables:

```
VITE_RESEND_API_KEY=re_RrTyet8W_894eJUvcj5r5yohQeSkD7Ezc
```

This will be used when you implement actual email sending in the future.
