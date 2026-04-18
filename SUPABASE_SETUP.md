# Supabase Setup Guide for Local Development

This guide will help you configure Supabase to work properly with your local development environment for the Knot To It Wedding Planner CRM.

## 1. Supabase Project Configuration

### 1.1 Access Your Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.io/)
2. Sign in with your account
3. Select your project (Project ID: `ocrjmlizddgjlcwxpqmq`)

### 1.2 Configure Authentication Settings

1. In the Supabase dashboard, navigate to **Authentication** → **URL Configuration**
2. Update the following settings:
   - **Site URL**: `http://localhost:8081` (or whatever port your local development server uses)
   - **Redirect URLs**: Add the following URLs (one per line):
     ```
     http://localhost:8081/auth/callback
     http://localhost:8080/auth/callback
     http://localhost:3000/auth/callback
     ```
   - Click **Save** to apply the changes

### 1.3 Configure OAuth Providers (Google)

1. Navigate to **Authentication** → **Providers**
2. Find and click on **Google**
3. Make sure it's enabled
4. Update the **Redirect URL** to include your local development URL:
   - Add `http://localhost:8081/auth/callback` to the list of authorized redirect URIs
5. Click **Save** to apply the changes

## 2. Google OAuth Configuration

If you're using your own Google OAuth credentials (not the ones provided by Supabase):

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** → **Credentials**
4. Find your OAuth 2.0 Client ID
5. Edit the client ID and add the following to **Authorized redirect URIs**:
   ```
   http://localhost:8081/auth/callback
   https://ocrjmlizddgjlcwxpqmq.supabase.co/auth/v1/callback
   ```
6. Click **Save**

## 3. Local Development Setup

### 3.1 Environment Variables

For better configuration management, create a `.env.local` file in your project root:

```
VITE_SUPABASE_URL=https://ocrjmlizddgjlcwxpqmq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jcmptbGl6ZGRnamxjd3hwcW1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5MTI1OTIsImV4cCI6MjA2MDQ4ODU5Mn0.SMff_WPT1XWLONUg-bNK1B7y5kQUYrHCP3LeKJqxKUA
VITE_APP_URL=http://localhost:8081
```

### 3.2 Update Supabase Client (Optional)

For better environment variable support, you can update the Supabase client configuration:

```typescript
// src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://ocrjmlizddgjlcwxpqmq.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jcmptbGl6ZGRnamxjd3hwcW1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5MTI1OTIsImV4cCI6MjA2MDQ4ODU5Mn0.SMff_WPT1XWLONUg-bNK1B7y5kQUYrHCP3LeKJqxKUA";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
```

## 4. Troubleshooting

### 4.1 Redirect Issues

If you're still experiencing redirect issues:

1. Clear your browser cookies and local storage
2. Make sure you're using the correct port in your Supabase configuration
3. Check browser console for any errors
4. Verify that the AuthCallback component is correctly handling the redirect

### 4.2 CORS Issues

If you encounter CORS errors:

1. In Supabase dashboard, go to **API** → **Settings**
2. Under **API Settings**, find the **CORS** section
3. Add your local development URL to the allowed origins:
   ```
   http://localhost:8081
   ```
4. Click **Save**

### 4.3 Session Not Persisting

If your session isn't persisting after login:

1. Make sure you're using the same domain for login and callback
2. Check that cookies are being properly set (check browser dev tools)
3. Verify that the Supabase client is properly configured

## 5. Testing the Authentication

1. Start your local development server: `npm run dev`
2. Navigate to `http://localhost:8081/login`
3. Click "Continue with Google"
4. Complete the Google authentication
5. You should be redirected back to your local application at `/dashboard`

If you encounter any issues, check the browser console for error messages and refer to the troubleshooting section above.
