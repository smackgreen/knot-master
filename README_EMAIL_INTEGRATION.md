# Email Integration with Resend API

This document explains how to set up and use the email integration in the Knot To It application.

## Overview

The application uses a multi-layered approach to send emails:

1. **Primary Method**: Supabase Edge Function
2. **Fallback Method**: Direct Resend API
3. **Last Resort**: Simulated emails (console logs)

This approach ensures maximum reliability while maintaining flexibility.

## Setup Instructions

### 1. Resend API Key

You need to set up a Resend account and get an API key:

1. Sign up at [Resend.com](https://resend.com)
2. Create an API key in your dashboard
3. Add the API key to your environment variables:

Create a `.env.local` file in your project root with:
```
VITE_RESEND_API_KEY=your_resend_api_key
```

### 2. Supabase Edge Function (Optional)

If you want to use the Supabase Edge Function as the primary method:

1. Deploy the Edge Function:
   ```
   supabase functions deploy resend-email
   ```

2. Set the Resend API key as a secret:
   ```
   supabase secrets set RESEND_API_KEY=your_resend_api_key
   ```

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

## How It Works

### Multi-layered Approach

1. **First Attempt**: The system tries to send the email using the Supabase Edge Function.
2. **First Fallback**: If the Edge Function fails, it tries to send the email directly using the Resend API.
3. **Second Fallback**: If both methods fail, it simulates sending the email by logging the details to the console.

This approach ensures that the application can continue to function even if there are issues with the email service.

### Direct Resend API

The direct Resend API integration uses the following endpoint:
```
https://api.resend.com/emails
```

The API requires the following headers:
```
Authorization: Bearer your_resend_api_key
Content-Type: application/json
```

And the following body structure:
```json
{
  "from": "Knot To It <signatures@knottoit.com>",
  "to": ["recipient@example.com"],
  "subject": "Email Subject",
  "html": "<html>Email content</html>"
}
```

## Troubleshooting

### Common Issues

1. **Missing API Key**: Make sure you've set the `VITE_RESEND_API_KEY` environment variable.
2. **CORS Issues**: If you're using the Supabase Edge Function and encountering CORS issues, the system will automatically fall back to using the direct Resend API.
3. **Rate Limiting**: Resend has rate limits. If you exceed them, the system will fall back to simulated emails.

### Checking Email Status

You can check the status of your emails in the Resend dashboard. This is especially useful for debugging issues with email delivery.

## Development

During development, you can use the `sendTestEmail` function to verify that your email setup is working correctly:

```typescript
import { sendTestEmail } from '@/services/emailService';

// Send a test email to yourself
await sendTestEmail('your-email@example.com', 'Your Name');
```

This will attempt to send a test email using all available methods and will log the results to the console.
