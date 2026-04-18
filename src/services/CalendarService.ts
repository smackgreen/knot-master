import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

// Types for OAuth tokens
export interface OAuthToken {
  id: string;
  user_id: string;
  provider: string;
  access_token: string;
  refresh_token: string | null;
  token_type: string | null;
  expires_at: string | null;
  scope: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// Types for connected calendars
export interface ConnectedCalendar {
  id: string;
  user_id: string;
  provider: string;
  calendar_id: string;
  name: string;
  description: string | null;
  color: string | null;
  is_selected: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

// Types for calendar events
export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  colorId?: string;
  status?: string;
  htmlLink?: string;
  creator?: {
    email: string;
    displayName?: string;
  };
  organizer?: {
    email: string;
    displayName?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
}

class CalendarService {
  private user: User | null = null;
  private supabaseUrl: string;
  private supabaseAnonKey: string;

  constructor() {
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
    this.supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
  }

  /**
   * Set the current user
   */
  setUser(user: User | null) {
    this.user = user;
  }

  /**
   * Resolve the current Supabase session access token for invoking Edge Functions.
   * getSession() is async; accessing `.data` synchronously yields undefined and
   * produces a malformed `Authorization: Bearer undefined` header that the
   * Edge Function gateway rejects with 401.
   */
  private async getAccessToken(): Promise<string> {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.access_token) {
      throw new Error("No active Supabase session; please sign in again.");
    }
    return data.session.access_token;
  }

  /**
   * Build the standard headers required for Supabase Edge Function calls.
   * Includes both the `apikey` header (required by the Supabase gateway)
   * and the `Authorization` header with the user's access token.
   */
  private async getFunctionHeaders(): Promise<Record<string, string>> {
    if (!this.supabaseAnonKey) {
      throw new Error("VITE_SUPABASE_ANON_KEY is not configured. Please set it in your .env file.");
    }
    const accessToken = await this.getAccessToken();
    return {
      "Content-Type": "application/json",
      "apikey": this.supabaseAnonKey,
      "Authorization": `Bearer ${accessToken}`,
    };
  }

  /**
   * Parse an error from an Edge Function response.
   * Handles multiple response formats: { error }, { msg }, { message }, or plain text.
   */
  private async parseFunctionError(response: Response): Promise<string> {
    try {
      const text = await response.text();
      try {
        const json = JSON.parse(text);
        return json.error || json.msg || json.message || `HTTP ${response.status}: ${text}`;
      } catch {
        return `HTTP ${response.status}: ${text}`;
      }
    } catch {
      return `HTTP ${response.status}: Unknown error`;
    }
  }

  /**
   * Check if the user has connected their Google Calendar
   */
  async isGoogleCalendarConnected(): Promise<boolean> {
    if (!this.user) return false;

    const { data, error } = await supabase
      .from("oauth_tokens")
      .select("id")
      .eq("user_id", this.user.id)
      .eq("provider", "google")
      .single();

    return !error && !!data;
  }

  /**
   * Start the Google Calendar OAuth flow
   */
  async connectGoogleCalendar(): Promise<string> {
    if (!this.user) {
      throw new Error("User not authenticated");
    }

    try {
      const headers = await this.getFunctionHeaders();
      // Call the Supabase Edge Function to get the authorization URL
      const response = await fetch(
        `${this.supabaseUrl}/functions/v1/google-calendar-auth/authorize`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            state: this.user.id, // Pass the user ID as state
          }),
        }
      );

      if (!response.ok) {
        const errorMessage = await this.parseFunctionError(response);
        throw new Error(`Failed to get authorization URL: ${errorMessage}`);
      }

      const { url } = await response.json();
      return url;
    } catch (error) {
      console.error("Error connecting to Google Calendar:", error);
      throw error;
    }
  }

  /**
   * Handle the OAuth callback
   */
  async handleOAuthCallback(code: string, state: string): Promise<boolean> {
    try {
      const headers = await this.getFunctionHeaders();
      // Call the Supabase Edge Function to exchange the code for tokens
      const response = await fetch(
        `${this.supabaseUrl}/functions/v1/google-calendar-auth/callback`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            code,
            state, // This contains the user ID
          }),
        }
      );

      if (!response.ok) {
        const errorMessage = await this.parseFunctionError(response);
        throw new Error(`Failed to exchange code for tokens: ${errorMessage}`);
      }

      const { success } = await response.json();
      return success;
    } catch (error) {
      console.error("Error handling OAuth callback:", error);
      throw error;
    }
  }

  /**
   * Get the user's connected calendars
   */
  async getConnectedCalendars(): Promise<ConnectedCalendar[]> {
    if (!this.user) {
      throw new Error("User not authenticated");
    }

    const { data, error } = await supabase
      .from("connected_calendars")
      .select("*")
      .eq("user_id", this.user.id)
      .eq("provider", "google");

    if (error) {
      throw error;
    }

    return data || [];
  }

  /**
   * Toggle calendar selection
   */
  async toggleCalendarSelection(calendarId: string, isSelected: boolean): Promise<void> {
    if (!this.user) {
      throw new Error("User not authenticated");
    }

    const { error } = await supabase
      .from("connected_calendars")
      .update({ is_selected: isSelected })
      .eq("id", calendarId)
      .eq("user_id", this.user.id);

    if (error) {
      throw error;
    }
  }

  /**
   * Disconnect Google Calendar
   */
  async disconnectGoogleCalendar(): Promise<void> {
    if (!this.user) {
      throw new Error("User not authenticated");
    }

    // Delete the OAuth tokens
    const { error: tokenError } = await supabase
      .from("oauth_tokens")
      .delete()
      .eq("user_id", this.user.id)
      .eq("provider", "google");

    if (tokenError) {
      throw tokenError;
    }

    // Delete the connected calendars
    const { error: calendarError } = await supabase
      .from("connected_calendars")
      .delete()
      .eq("user_id", this.user.id)
      .eq("provider", "google");

    if (calendarError) {
      throw calendarError;
    }
  }

  /**
   * Get events from Google Calendar
   */
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

  /**
   * Refresh the access token
   */
  private async refreshToken(): Promise<void> {
    if (!this.user) {
      throw new Error("User not authenticated");
    }

    try {
      const headers = await this.getFunctionHeaders();
      const response = await fetch(
        `${this.supabaseUrl}/functions/v1/google-calendar-auth/refresh`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            userId: this.user.id,
          }),
        }
      );

      if (!response.ok) {
        const errorMessage = await this.parseFunctionError(response);
        throw new Error(`Failed to refresh token: ${errorMessage}`);
      }
    } catch (error) {
      console.error("Error refreshing token:", error);
      throw error;
    }
  }
}

export const calendarService = new CalendarService();
export default calendarService;
