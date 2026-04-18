import { supabase } from '@/integrations/supabase/client';

/**
 * Send a verification code to a phone number
 * @param phoneNumber The phone number to send the code to
 * @returns Whether the sending was successful
 */
export const sendVerificationCode = async (phoneNumber: string): Promise<boolean> => {
  try {
    // Generate a random 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store the code in the database with an expiration time (10 minutes)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);
    
    // Check if there's an existing code for this phone number
    const { data: existingCode } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('phone_number', phoneNumber)
      .single();
    
    if (existingCode) {
      // Update the existing code
      const { error } = await supabase
        .from('verification_codes')
        .update({
          code,
          expires_at: expiresAt.toISOString(),
          attempts: 0,
        })
        .eq('id', existingCode.id);
      
      if (error) {
        throw error;
      }
    } else {
      // Create a new code
      const { error } = await supabase
        .from('verification_codes')
        .insert({
          phone_number: phoneNumber,
          code,
          expires_at: expiresAt.toISOString(),
        });
      
      if (error) {
        throw error;
      }
    }
    
    // In a real application, you would integrate with an SMS service like Twilio
    // to send the verification code to the user's phone number
    // For this demo, we'll just log the code to the console
    console.log(`Verification code for ${phoneNumber}: ${code}`);
    
    return true;
  } catch (error) {
    console.error('Error sending verification code:', error);
    return false;
  }
};

/**
 * Verify a code for a phone number
 * @param phoneNumber The phone number to verify
 * @param code The code to verify
 * @returns Whether the verification was successful
 */
export const verifyCode = async (phoneNumber: string, code: string): Promise<boolean> => {
  try {
    // Get the verification code from the database
    const { data, error } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('phone_number', phoneNumber)
      .single();
    
    if (error) {
      throw error;
    }
    
    // Check if the code has expired
    const expiresAt = new Date(data.expires_at);
    if (expiresAt < new Date()) {
      return false;
    }
    
    // Check if the code matches
    if (data.code !== code) {
      // Increment the attempts counter
      const { error: updateError } = await supabase
        .from('verification_codes')
        .update({
          attempts: data.attempts + 1,
        })
        .eq('id', data.id);
      
      if (updateError) {
        throw updateError;
      }
      
      return false;
    }
    
    // Mark the code as verified
    const { error: updateError } = await supabase
      .from('verification_codes')
      .update({
        verified: true,
        verified_at: new Date().toISOString(),
      })
      .eq('id', data.id);
    
    if (updateError) {
      throw updateError;
    }
    
    return true;
  } catch (error) {
    console.error('Error verifying code:', error);
    return false;
  }
};
