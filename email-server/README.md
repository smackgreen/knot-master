# Email Proxy Server for Knot To It

This is a simple proxy server that forwards email requests to the Resend API. It helps avoid CORS issues when sending emails from the browser.

## Setup

1. Make sure you have Node.js installed on your system.

2. Install the dependencies:
   ```
   cd email-server
   npm install
   ```

3. Create a `.env` file in the `email-server` directory with your Resend API key:
   ```
   RESEND_API_KEY=your_resend_api_key
   PORT=3001
   ```

4. Start the server:
   ```
   npm start
   ```

   Or use the provided batch file:
   ```
   start-server.bat
   ```

## How It Works

The proxy server exposes a single endpoint:

- `POST /api/send-email`: Forwards the request to the Resend API

The endpoint accepts the following JSON body:

```json
{
  "from": "Sender Name <sender@example.com>",
  "to": ["recipient@example.com"],
  "subject": "Email Subject",
  "html": "<p>Email content</p>"
}
```

## Integration with the Application

The application's email service (`src/services/emailService.ts`) is configured to use this proxy server. It will:

1. Try to send emails through the proxy server
2. Fall back to simulation if the proxy server is unavailable or returns an error

## Deployment

For production, you can deploy this server to a hosting service like:

- Vercel
- Netlify Functions
- Heroku
- AWS Lambda

After deployment, update the `EMAIL_PROXY_ENDPOINT` in `src/services/emailService.ts` to point to your deployed server.

## Troubleshooting

If you encounter issues:

1. Check that the server is running (`http://localhost:3001/health`)
2. Verify that your Resend API key is correct
3. Check the server logs for error messages
4. Make sure the proxy server is accessible from your application

## Security Considerations

This server should be deployed with proper security measures:

- Use HTTPS in production
- Add authentication if needed
- Set appropriate CORS headers for your production domain
- Keep your Resend API key secure
