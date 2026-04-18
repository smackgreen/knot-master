const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
const port = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Get Resend API key from environment variables
const RESEND_API_KEY = process.env.RESEND_API_KEY;

// Endpoint for sending emails
app.post('/api/send-email', async (req, res) => {
  try {
    console.log('Received request to send email:', req.body);

    // Check if API key is available
    if (!RESEND_API_KEY) {
      console.error('Resend API key is not set');
      return res.status(500).json({ error: 'Email service is not configured' });
    }

    // Forward the request to Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    // Get the response from Resend API
    const data = await response.json();

    // Check if the request was successful
    if (response.ok) {
      console.log('Email sent successfully:', data);
      return res.json({ success: true, data });
    } else {
      console.error('Error sending email:', data);
      return res.status(response.status).json({ error: data });
    }
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Email proxy server is running' });
});

// Start the server
app.listen(port, () => {
  console.log(`Email proxy server running at http://localhost:${port}`);
  console.log(`Resend API Key: ${RESEND_API_KEY ? 'Available' : 'Not available'}`);
});
