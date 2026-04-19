import { supabase } from '@/integrations/supabase/client';

// Import environment variables
const appUrl = import.meta.env.VITE_APP_URL || 'http://localhost:8080';

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

    // Diagnostic: Check session state before invoking Edge Function
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('[DIAG] Error getting session:', sessionError);
    }
    if (!session) {
      console.error('[DIAG] No active session — user is not authenticated. The Edge Function will reject this request with 401.');
      return false;
    }
    console.log('[DIAG] Session available. User ID:', session.user.id, '| Access token (first 20 chars):', session.access_token.substring(0, 20) + '...');

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
      console.error('[DIAG] Edge Function error:', JSON.stringify({
        name: error.name,
        message: error.message,
        status: (error as any).status || (error as any).context?.status,
        details: (error as any).context || (error as any).details,
      }, null, 2));
      return false;
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
      return false;
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
      return false;
    }

    console.log('Test email sent successfully via Supabase client:', data);
    return true;
  } catch (error) {
    console.error('Error sending test email:', error);
    return false;
  }
};
