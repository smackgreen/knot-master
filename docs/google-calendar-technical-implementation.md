# Google Calendar OAuth Integration: Technical Implementation Guide

This document provides technical details on how the Google Calendar OAuth integration is implemented in the Wedding Planner CRM application.

## Architecture Overview

The integration consists of the following components:

1. **Database Tables**:
   - `oauth_tokens`: Stores OAuth tokens for each user
   - `connected_calendars`: Stores information about connected calendars

2. **Supabase Edge Function**:
   - `google-calendar-auth`: Handles the OAuth flow

3. **Frontend Components**:
   - `CalendarService`: Service for interacting with Google Calendar
   - `CalendarSettings`: UI for connecting/disconnecting Google Calendar
   - `GoogleCalendarCallback`: Component for handling OAuth callback

## Database Schema

### oauth_tokens Table

```sql
CREATE TABLE IF NOT EXISTS oauth_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL, -- 'google', 'outlook', etc.
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_type TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  scope TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, provider)
);
```

### connected_calendars Table

```sql
CREATE TABLE IF NOT EXISTS connected_calendars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL, -- 'google', 'outlook', etc.
  calendar_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  is_selected BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, provider, calendar_id)
);
```

## Supabase Edge Function

The `google-calendar-auth` Edge Function handles three main operations:

1. **Authorization URL Generation** (`/authorize`):
   - Generates the Google OAuth authorization URL
   - Includes the user ID as state parameter

2. **Token Exchange** (`/callback`):
   - Exchanges the authorization code for access and refresh tokens
   - Stores the tokens in the database
   - Fetches and stores the user's calendars

3. **Token Refresh** (`/refresh`):
   - Refreshes an expired access token using the refresh token
   - Updates the tokens in the database

## Frontend Implementation

### CalendarService

The `CalendarService` is a singleton service that provides methods for:

- Checking if Google Calendar is connected
- Initiating the OAuth flow
- Handling the OAuth callback
- Getting connected calendars
- Toggling calendar selection
- Disconnecting Google Calendar
- Fetching events from Google Calendar
- Refreshing tokens

### OAuth Flow

1. **Connecting to Google Calendar**:
   - User clicks "Connect Google Calendar" button in CalendarSettings
   - CalendarService calls the Edge Function to get the authorization URL
   - User is redirected to Google's consent screen
   - User grants permission to access their calendar

2. **Handling the Callback**:
   - Google redirects back to the application with an authorization code
   - The GoogleCalendarCallback component extracts the code and state
   - CalendarService calls the Edge Function to exchange the code for tokens
   - Tokens are stored in the database
   - User's calendars are fetched and stored

3. **Using the Integration**:
   - When the Calendar component loads, it checks if Google Calendar is connected
   - If connected, it fetches events from Google Calendar
   - Events are displayed alongside other events in the calendar

4. **Token Refresh**:
   - When an access token expires, CalendarService calls the Edge Function to refresh it
   - The new access token is used for subsequent requests

## Code Snippets

### Initiating the OAuth Flow

```typescript
// In CalendarService.ts
async connectGoogleCalendar(): Promise<string> {
  if (!this.user) {
    throw new Error("User not authenticated");
  }

  try {
    // Call the Supabase Edge Function to get the authorization URL
    const response = await fetch(
      `${this.supabaseUrl}/functions/v1/google-calendar-auth/authorize`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabase.auth.getSession()?.data?.session?.access_token}`,
        },
        body: JSON.stringify({
          state: this.user.id, // Pass the user ID as state
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to get authorization URL: ${error.error}`);
    }

    const { url } = await response.json();
    return url;
  } catch (error) {
    console.error("Error connecting to Google Calendar:", error);
    throw error;
  }
}
```

### Handling the OAuth Callback

```typescript
// In GoogleCalendarCallback.tsx
useEffect(() => {
  const handleCallback = async () => {
    try {
      if (!user) {
        setError(t('calendar.auth.notLoggedIn'));
        setIsProcessing(false);
        return;
      }

      // Get the code and state from URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');

      if (!code) {
        const error = urlParams.get('error');
        if (error === 'access_denied') {
          setError(t('calendar.auth.accessDenied'));
        } else {
          setError(t('calendar.auth.noCode'));
        }
        setIsProcessing(false);
        return;
      }

      if (!state) {
        setError(t('calendar.auth.noState'));
        setIsProcessing(false);
        return;
      }

      // Set the user in the calendar service
      calendarService.setUser(user);

      // Handle the OAuth callback
      const success = await calendarService.handleOAuthCallback(code, state);

      if (success) {
        toast({
          title: t('calendar.auth.success'),
          description: t('calendar.auth.successDescription'),
        });
        navigate("/app/calendar");
      } else {
        setError(t('calendar.auth.failed'));
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("Error handling Google Calendar callback:", error);
      setError(t('calendar.auth.unexpectedError'));
      setIsProcessing(false);
    }
  };

  handleCallback();
}, [user, navigate, t]);
```

### Fetching Google Calendar Events

```typescript
// In CalendarService.ts
async getGoogleCalendarEvents(
  timeMin: string,
  timeMax: string
): Promise<CalendarEvent[]> {
  if (!this.user) {
    throw new Error("User not authenticated");
  }

  // Get the access token
  const { data: tokenData, error: tokenError } = await supabase
    .from("oauth_tokens")
    .select("access_token, expires_at")
    .eq("user_id", this.user.id)
    .eq("provider", "google")
    .single();

  if (tokenError || !tokenData) {
    throw new Error("No access token found");
  }

  // Check if token is expired
  const expiresAt = new Date(tokenData.expires_at);
  if (expiresAt <= new Date()) {
    // Token is expired, refresh it
    await this.refreshToken();
    // Get the new token
    const { data: newTokenData, error: newTokenError } = await supabase
      .from("oauth_tokens")
      .select("access_token")
      .eq("user_id", this.user.id)
      .eq("provider", "google")
      .single();

    if (newTokenError || !newTokenData) {
      throw new Error("Failed to refresh token");
    }

    tokenData.access_token = newTokenData.access_token;
  }

  // Get selected calendars
  const { data: calendars, error: calendarError } = await supabase
    .from("connected_calendars")
    .select("calendar_id")
    .eq("user_id", this.user.id)
    .eq("provider", "google")
    .eq("is_selected", true);

  if (calendarError) {
    throw calendarError;
  }

  // Fetch events from each selected calendar
  const allEvents: CalendarEvent[] = [];
  for (const calendar of calendars || []) {
    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
          calendar.calendar_id
        )}/events?timeMin=${encodeURIComponent(
          timeMin
        )}&timeMax=${encodeURIComponent(timeMax)}`,
        {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
          },
        }
      );

      if (!response.ok) {
        console.error(`Failed to fetch events for calendar ${calendar.calendar_id}`);
        continue;
      }

      const data = await response.json();
      allEvents.push(...(data.items || []));
    } catch (error) {
      console.error(`Error fetching events for calendar ${calendar.calendar_id}:`, error);
    }
  }

  return allEvents;
}
```

## Deployment Checklist

- [ ] Create Google Cloud Project and OAuth credentials
- [ ] Set up Supabase Edge Function environment variables
- [ ] Deploy the Edge Function
- [ ] Run the database migration script
- [ ] Update frontend environment variables
- [ ] Build and deploy the frontend
- [ ] Test the OAuth flow in production
- [ ] Monitor for any errors

## Security Considerations

- Access tokens are short-lived and automatically refreshed
- Refresh tokens are stored securely in the database
- Row Level Security (RLS) policies ensure users can only access their own data
- The application requests only the necessary permissions
- Users can disconnect their Google Calendar at any time
