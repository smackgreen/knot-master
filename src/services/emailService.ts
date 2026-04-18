import { supabase } from '@/integrations/supabase/client';

// Import environment variables
const appUrl = import.meta.env.VITE_APP_URL || 'http://localhost:8080';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Default sender email - using Resend's default sender
// NOTE: To send to any email address, you must verify a custom domain at https://resend.com/domains
// Without a verified domain, Resend only allows sending to your account's verified email.
const DEFAULT_FROM_EMAIL = 'onboarding@resend.dev';

// Supabase Edge Function URL
const EDGE_FUNCTION_URL = 'https://zkrtaixltensetceanmv.supabase.co/functions/v1/resend-email';

/**
 * Send a signature request email
 * @param requestId The ID of the signature request
 * @param recipientEmail The email of the recipient
 * @param recipientName The name of the recipient
 * @param token The token for the signature request
 * @returns Whether the email was sent successfully
 */
export const sendSignatureRequestEmail = async (
  requestId: string,
  recipientEmail: string,
  recipientName: string,
  token: string
): Promise<boolean> => {
  try {
    const signatureUrl = `${appUrl}/sign/${token}`;
    console.log('Sending signature request email to:', recipientEmail);

    const { data, error } = await supabase.functions.invoke('resend-email', {
      body: {
        to: recipientEmail,
        subject: 'Document Signature Request',
        name: recipientName,
        templateType: 'signature_request',
        signatureUrl: signatureUrl
      },
    });

    if (error) {
      console.error('Error calling Edge Function via Supabase client:', error);

      // Fall back to direct fetch to the Edge Function
      console.log('Falling back to direct fetch to Edge Function...');
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          from: DEFAULT_FROM_EMAIL,
          to: recipientEmail,
          subject: 'Document Signature Request',
          name: recipientName,
          templateType: 'signature_request',
          signatureUrl: signatureUrl
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Email sent successfully via direct fetch:', result);
        return true;
      } else {
        const errorData = await response.text();
        console.error('Error sending email via direct fetch:', response.status, errorData);
        return false;
      }
    }

    console.log('Email sent successfully via Supabase client:', data);
    return true;
  } catch (error) {
    console.error('Error in sendSignatureRequestEmail:', error);
    return false;
  }
};

/**
 * Send a signature confirmation email
 * @param recipientEmail The email of the recipient
 * @param recipientName The name of the recipient
 * @param documentNames The names of the documents that were signed
 * @returns Whether the email was sent successfully
 */
export const sendSignatureConfirmationEmail = async (
  recipientEmail: string,
  recipientName: string,
  documentNames: string[]
): Promise<boolean> => {
  try {
    console.log('Sending confirmation email to:', recipientEmail);

    const { data, error } = await supabase.functions.invoke('resend-email', {
      body: {
        to: recipientEmail,
        subject: 'Documents Signed Successfully',
        name: recipientName,
        templateType: 'signature_confirmation',
        documentNames: documentNames
      },
    });

    if (error) {
      console.error('Error calling Edge Function via Supabase client for confirmation:', error);

      // Fall back to direct fetch to the Edge Function
      console.log('Falling back to direct fetch to Edge Function for confirmation email...');
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          from: DEFAULT_FROM_EMAIL,
          to: recipientEmail,
          subject: 'Documents Signed Successfully',
          name: recipientName,
          templateType: 'signature_confirmation',
          documentNames: documentNames
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Confirmation email sent successfully via direct fetch:', result);
        return true;
      } else {
        const errorData = await response.text();
        console.error('Error sending confirmation email via direct fetch:', response.status, errorData);
        return false;
      }
    }

    console.log('Confirmation email sent successfully via Supabase client:', data);
    return true;
  } catch (error) {
    console.error('Error sending signature confirmation email:', error);
    return false;
  }
};

/**
 * Send a test email
 * @param recipientEmail The email of the recipient
 * @param recipientName The name of the recipient (optional)
 * @returns Whether the email was sent successfully
 */
export const sendTestEmail = async (
  recipientEmail: string,
  recipientName: string = ''
): Promise<boolean> => {
  try {
    console.log('Sending test email to:', recipientEmail);

    const { data, error } = await supabase.functions.invoke('resend-email', {
      body: {
        to: recipientEmail,
        subject: 'Test Email from Knot To It',
        name: recipientName || recipientEmail,
        templateType: 'test'
      },
    });

    if (error) {
      console.error('Error calling Edge Function via Supabase client for test email:', error);

      // Fall back to direct fetch to the Edge Function
      console.log('Falling back to direct fetch to Edge Function for test email...');
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          from: DEFAULT_FROM_EMAIL,
          to: recipientEmail,
          subject: 'Test Email from Knot To It',
          name: recipientName || recipientEmail,
          templateType: 'test'
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Test email sent successfully via direct fetch:', result);
        return true;
      } else {
        const errorData = await response.text();
        console.error('Error sending test email via direct fetch:', response.status, errorData);
        return false;
      }
    }

    console.log('Test email sent successfully via Supabase client:', data);
    return true;
  } catch (error) {
    console.error('Error sending test email:', error);
    return false;
  }
};

/**
 * Get the HTML template for a signature request email
 */
const getSignatureRequestEmailTemplate = (
  recipientName: string,
  signatureUrl: string
): string => {
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
        h1 {
          color: #4f46e5;
          margin-bottom: 20px;
          font-size: 24px;
        }
        p {
          margin-bottom: 15px;
        }
        .button {
          display: inline-block;
          background-color: #4f46e5;
          color: white;
          text-decoration: none;
          padding: 12px 24px;
          border-radius: 4px;
          font-weight: bold;
          margin: 20px 0;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
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

        <p>You have received a document that requires your signature. Please click the button below to view and sign the document:</p>

        <div style="text-align: center;">
          <a href="${signatureUrl}" class="button">View and Sign Document</a>
        </div>

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
};

/**
 * Get the HTML template for a test email
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

/**
 * Get the HTML template for a signature confirmation email
 */
const getSignatureConfirmationEmailTemplate = (
  recipientName: string,
  documentNames: string[]
): string => {
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
        h1 {
          color: #10b981;
          margin-bottom: 20px;
          font-size: 24px;
        }
        p {
          margin-bottom: 15px;
        }
        ul {
          margin-bottom: 20px;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
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
};
