// Simple script to test the Supabase Edge Function for sending emails

async function testEmailFunction() {
  const SUPABASE_URL = 'https://zkrtaixltensetceanmv.supabase.co';
  const FUNCTION_NAME = 'resend-email';
  
  console.log(`Testing Edge Function: ${FUNCTION_NAME}`);
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/${FUNCTION_NAME}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add any required authentication headers here if needed
      },
      body: JSON.stringify({
        to: 'test@example.com', // Replace with your email for testing
        subject: 'Test Email from Edge Function',
        templateType: 'test',
        name: 'Test User'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Success! Response:', data);
    } else {
      console.error('Error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
    }
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

// Run the test
testEmailFunction();
