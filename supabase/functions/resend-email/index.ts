import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { Resend } from 'resend';

// Define CORS headers directly in this file for better control
// Use a more permissive configuration to ensure it works with all clients
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': '*',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'true',
};

// Initialize Resend with API key from environment variable
const resendApiKey = Deno.env.get('RESEND_API_KEY');
const resend = new Resend(resendApiKey);

// Default sender email - using Resend's default sender
const DEFAULT_FROM_EMAIL = 'onboarding@resend.dev';

interface EmailRequest {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  name?: string;
  templateType?: 'signature_request' | 'signature_confirmation' | 'test';
  signatureUrl?: string;
  documentNames?: string[];
  originalRecipient?: string; // For development mode redirection tracking
}

serve(async (req) => {
  // Log request details for debugging
  console.log(`Request method: ${req.method}`);
  console.log(`Request URL: ${req.url}`);
  console.log(`Request headers:`, Object.fromEntries(req.headers.entries()));

  // Always include CORS headers in every response
  const responseHeaders = {
    ...corsHeaders,
  };

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request for CORS preflight');
    return new Response(null, {
      status: 204, // No content status is better for OPTIONS
      headers: responseHeaders
    });
  }

  try {
    console.log('Received request:', req.method, req.url);
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));

    // Parse request body
    const body = await req.json();
    console.log('Request body:', JSON.stringify(body));

    const { to, subject, html, text, from, name, templateType, signatureUrl, documentNames, originalRecipient } = body as EmailRequest;

    // Use the actual recipient email directly
    // Note: If using Resend's default sender (onboarding@resend.dev), you MUST verify
    // a custom domain at https://resend.com/domains to send to any email address.
    // Without a verified domain, Resend only allows sending to your account's verified email.
    const actualRecipient = to;

    console.log(`Sending email to: ${actualRecipient}`);

    // Validate required fields
    if (!to) {
      return new Response(
        JSON.stringify({ error: 'Recipient email is required' }),
        { status: 400, headers: { ...responseHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!subject) {
      return new Response(
        JSON.stringify({ error: 'Subject is required' }),
        { status: 400, headers: { ...responseHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If no API key is provided, return an error
    if (!resendApiKey) {
      console.error('RESEND_API_KEY is not set');
      return new Response(
        JSON.stringify({ error: 'Email service is not configured' }),
        { status: 500, headers: { ...responseHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine email content based on template type or direct content
    let emailHtml = html;
    let emailText = text;

    if (templateType) {
      switch (templateType) {
        case 'signature_request':
          if (!signatureUrl || !name) {
            return new Response(
              JSON.stringify({ error: 'signatureUrl and name are required for signature_request template' }),
              { status: 400, headers: { ...responseHeaders, 'Content-Type': 'application/json' } }
            );
          }
          emailHtml = getSignatureRequestEmailTemplate(name, signatureUrl);
          break;
        case 'signature_confirmation':
          if (!documentNames || !name) {
            return new Response(
              JSON.stringify({ error: 'documentNames and name are required for signature_confirmation template' }),
              { status: 400, headers: { ...responseHeaders, 'Content-Type': 'application/json' } }
            );
          }
          emailHtml = getSignatureConfirmationEmailTemplate(name, documentNames);
          break;
        case 'test':
          emailHtml = getTestEmailTemplate(name || 'User');
          break;
        default:
          return new Response(
            JSON.stringify({ error: 'Invalid template type' }),
            { status: 400, headers: { ...responseHeaders, 'Content-Type': 'application/json' } }
          );
      }
    }

    // If neither template nor direct content is provided, return an error
    if (!emailHtml && !emailText) {
      return new Response(
        JSON.stringify({ error: 'Email content is required (either html, text, or a valid templateType)' }),
        { status: 400, headers: { ...responseHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: from || DEFAULT_FROM_EMAIL,
      to: [actualRecipient], // Use the actualRecipient (which may be redirected)
      subject: subject,
      html: emailHtml,
      text: emailText,
    });

    if (error) {
      console.error('Error sending email:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...responseHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ data }),
      { status: 200, headers: { ...responseHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...responseHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Get the HTML template for a signature request email
 * @param recipientName The name of the recipient
 * @param signatureUrl The URL for signing the documents
 * @returns The HTML template
 */
function getSignatureRequestEmailTemplate(
  recipientName: string,
  signatureUrl: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document Signature Request</title>
      <style>
        body {
          font-family: 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          max-width: 150px;
          margin-bottom: 20px;
        }
        .button {
          display: inline-block;
          background-color: #4F46E5;
          color: white;
          text-decoration: none;
          padding: 12px 24px;
          border-radius: 4px;
          margin: 20px 0;
          font-weight: bold;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          font-size: 12px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Document Signature Request</h1>
        </div>

        <p>Hello ${recipientName},</p>

        <p>You have been requested to sign documents. Please click the button below to view and sign the documents:</p>

        <p style="text-align: center;">
          <a href="${signatureUrl}" class="button">View & Sign Documents</a>
        </p>

        <p>If the button above doesn't work, you can copy and paste the following link into your browser:</p>
        <p style="word-break: break-all;">${signatureUrl}</p>

        <p>This link will expire in 7 days. If you have any questions, please contact the sender directly.</p>

        <p>Thank you,<br>Knot To It Team</p>

        <div class="footer">
          <p>This is an automated message, please do not reply to this email.</p>
          <p>&copy; ${new Date().getFullYear()} Knot To It. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Get the HTML template for a signature confirmation email
 * @param recipientName The name of the recipient
 * @param documentNames The names of the documents that were signed
 * @returns The HTML template
 */
function getSignatureConfirmationEmailTemplate(
  recipientName: string,
  documentNames: string[]
): string {
  const documentsList = documentNames.map(name => `<li>${name}</li>`).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Documents Signed Successfully</title>
      <style>
        body {
          font-family: 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          font-size: 12px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Documents Signed Successfully</h1>
        </div>

        <p>Hello ${recipientName},</p>

        <p>Thank you for signing the following document(s):</p>

        <ul>
          ${documentsList}
        </ul>

        <p>A copy of the signed document(s) has been saved and all parties have been notified.</p>

        <p>Thank you,<br>Knot To It Team</p>

        <div class="footer">
          <p>This is an automated message, please do not reply to this email.</p>
          <p>&copy; ${new Date().getFullYear()} Knot To It. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Get the HTML template for a test email
 * @param recipientName The name of the recipient
 * @returns The HTML template
 */
function getTestEmailTemplate(recipientName: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Test Email</title>
      <style>
        body {
          font-family: 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          font-size: 12px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Test Email</h1>
        </div>

        <p>Hello ${recipientName},</p>

        <p>This is a test email from Knot To It. If you're receiving this, it means our email system is working correctly.</p>

        <p>Thank you,<br>Knot To It Team</p>

        <div class="footer">
          <p>This is an automated message, please do not reply to this email.</p>
          <p>&copy; ${new Date().getFullYear()} Knot To It. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
