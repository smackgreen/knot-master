# Google Calendar OAuth Integration Guide

This guide explains how to implement the Google Calendar OAuth integration in a production environment for the Wedding Planner CRM application.

## Table of Contents

1. [Overview](#overview)
2. [Setting Up Google Cloud Project](#setting-up-google-cloud-project)
3. [Deploying Supabase Edge Functions](#deploying-supabase-edge-functions)
4. [Database Setup](#database-setup)
5. [Frontend Configuration](#frontend-configuration)
6. [Testing the Integration](#testing-the-integration)
7. [Troubleshooting](#troubleshooting)

## Overview

The Wedding Planner CRM application uses OAuth 2.0 to integrate with Google Calendar, allowing users to:
- Connect their Google Calendar with a single click
- View and manage their Google Calendar events within the application
- Select which Google Calendars to display
- Automatically refresh tokens when they expire

This implementation eliminates the need for users to manually enter API keys, providing a seamless experience.

## Setting Up Google Cloud Project

### Create and Configure a Google Cloud Project

1. **Go to the Google Cloud Console**:
   - Visit [https://console.cloud.google.com/](https://console.cloud.google.com/)
   - Create a new project or select an existing one

2. **Enable the Google Calendar API**:
   - In the left sidebar, navigate to "APIs & Services" > "Library"
   - Search for "Google Calendar API" and enable it

3. **Configure OAuth Consent Screen**:
   - Go to "APIs & Services" > "OAuth consent screen"
   - Select "External" user type (unless you're using Google Workspace)
   - Fill in the required information:
     - App name: "Wedding Planner CRM"
     - User support email: Your email address
     - Developer contact information: Your email address
   - Add the following scopes:
     - `https://www.googleapis.com/auth/calendar` (for full calendar access)
   - Add test users (your email and any team members during development)
   - Submit for verification if you plan to make the app available to all users

4. **Create OAuth 2.0 Credentials**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Select "Web application" as the application type
   - Name: "Wedding Planner CRM Web Client"
   - Add authorized JavaScript origins:
     - `https://your-production-domain.com`
   - Add authorized redirect URIs:
     - `https://your-production-domain.com/auth/google-calendar-callback`
   - Click "Create" and note down the Client ID and Client Secret

## Deploying Supabase Edge Functions

### Prepare Your Supabase Project

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. **Link Your Local Project to Supabase**:
   ```bash
   supabase login
   supabase link --project-ref your-project-ref
   ```

3. **Set Environment Variables for Production**:
   ```bash
   supabase secrets set GOOGLE_CLIENT_ID=your-google-client-id
   supabase secrets set GOOGLE_CLIENT_SECRET=your-google-client-secret
   supabase secrets set REDIRECT_URI=https://your-production-domain.com/auth/google-calendar-callback
   supabase secrets set SUPABASE_URL=https://your-project-id.supabase.co
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

4. **Deploy the Edge Function**:
   ```bash
   supabase functions deploy google-calendar-auth
   ```

5. **Verify Deployment**:
   ```bash
   supabase functions list
   ```

## Database Setup

### Run the Migration Script

1. **Access the Supabase SQL Editor**:
   - Go to your Supabase dashboard
   - Navigate to the "SQL Editor" section

2. **Run the Migration Script**:
   - Copy the content of `supabase/migrations/20240810000000_add_oauth_tokens_table.sql`
   - Paste it into the SQL Editor
   - Execute the script

3. **Verify Table Creation**:
   - Go to the "Table Editor" section
   - Confirm that the `oauth_tokens` and `connected_calendars` tables have been created
   - Check that the RLS policies are properly applied

## Frontend Configuration

### Update Environment Variables

1. **Create a Production Environment File** (`.env.production`):
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_APP_URL=https://your-production-domain.com
   ```

2. **Build the Application for Production**:
   ```bash
   npm run build
   ```

3. **Deploy to Your Hosting Provider**:
   Follow your hosting provider's specific deployment instructions.

## Testing the Integration

### Verify the OAuth Flow

1. **Test the Connect Button**:
   - Log in to your application
   - Navigate to the Calendar Settings
   - Click the "Connect Google Calendar" button
   - Verify that you're redirected to Google's consent screen

2. **Test the OAuth Callback**:
   - After granting permission, verify that you're redirected back to your application
   - Check that the success message appears
   - Verify that your Google Calendars are listed in the Calendar Settings

3. **Test Calendar Integration**:
   - Navigate to the Calendar page
   - Verify that events from your Google Calendar appear in the calendar view

## Troubleshooting

### Common Issues and Solutions

1. **CORS Errors**:
   - Ensure your Supabase Edge Function has proper CORS headers
   - Verify that your Google Cloud project has the correct authorized origins

2. **Redirect URI Mismatch**:
   - Double-check that the redirect URI in your Google Cloud project exactly matches your application's callback URL
   - Ensure there are no trailing slashes or other discrepancies

3. **Token Storage Issues**:
   - Check the Supabase logs for any errors related to token storage
   - Verify that your RLS policies allow the user to insert/update their own tokens

4. **Edge Function Errors**:
   - Check the Supabase Edge Function logs for detailed error messages
   - Verify that all environment variables are correctly set

## Security Considerations

1. **Secure Token Storage**:
   - Tokens are stored in the database with RLS policies
   - Access tokens are refreshed automatically when they expire

2. **Minimize Token Scope**:
   - The integration requests only the necessary permissions

3. **User Privacy**:
   - Users can disconnect their Google Calendar at any time
   - Users can select which calendars to display in the application

## Additional Resources

- [Google Calendar API Documentation](https://developers.google.com/calendar/api/guides/overview)
- [OAuth 2.0 for Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)
