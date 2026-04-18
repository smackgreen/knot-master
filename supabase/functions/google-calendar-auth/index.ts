// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Google OAuth configuration
const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID") || "";
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET") || "";
const REDIRECT_URI = Deno.env.get("REDIRECT_URI") || "";

// Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'http://localhost:8080',
  'http://localhost:8081',
  'http://localhost:5173',
  'https://knot-master.vercel.app',
];

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Max-Age": "86400",
  };
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  const url = new URL(req.url);
  const path = url.pathname.split("/").pop();

  try {
    // Step 1: Generate authorization URL
    if (path === "authorize") {
      // Validate required environment variables
      if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !REDIRECT_URI) {
        throw new Error(
          "Missing required environment variables: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, or REDIRECT_URI"
        );
      }

      const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      authUrl.searchParams.append("client_id", GOOGLE_CLIENT_ID);
      authUrl.searchParams.append("redirect_uri", REDIRECT_URI);
      authUrl.searchParams.append("response_type", "code");
      authUrl.searchParams.append("scope", "https://www.googleapis.com/auth/calendar");
      authUrl.searchParams.append("access_type", "offline");
      authUrl.searchParams.append("prompt", "consent");
      
      // Get state from request (contains user ID)
      const { state } = await req.json();
      authUrl.searchParams.append("state", state);

      return new Response(
        JSON.stringify({ url: authUrl.toString() }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 2: Handle callback and exchange code for tokens
    if (path === "callback") {
      const { code, state } = await req.json();
      
      if (!code) {
        throw new Error("No authorization code provided");
      }

      // Exchange code for tokens
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: REDIRECT_URI,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        throw new Error(`Failed to exchange code for tokens: ${JSON.stringify(errorData)}`);
      }

      const tokens: TokenResponse = await tokenResponse.json();
      
      // Calculate expiration time
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + tokens.expires_in);

      // Store tokens in database
      const userId = state; // The state parameter contains the user ID
      
      const { error } = await supabase
        .from("oauth_tokens")
        .upsert({
          user_id: userId,
          provider: "google",
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_type: tokens.token_type,
          expires_at: expiresAt.toISOString(),
          scope: tokens.scope,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "user_id,provider",
        });

      if (error) {
        throw new Error(`Failed to store tokens: ${error.message}`);
      }

      // Fetch user's calendars
      await fetchAndStoreCalendars(userId, tokens.access_token);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 3: Refresh token when needed
    if (path === "refresh") {
      const { userId } = await req.json();
      
      // Get the refresh token from the database
      const { data: tokenData, error: tokenError } = await supabase
        .from("oauth_tokens")
        .select("refresh_token")
        .eq("user_id", userId)
        .eq("provider", "google")
        .single();

      if (tokenError || !tokenData) {
        throw new Error("No refresh token found");
      }

      // Exchange refresh token for new access token
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          refresh_token: tokenData.refresh_token,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          grant_type: "refresh_token",
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        throw new Error(`Failed to refresh token: ${JSON.stringify(errorData)}`);
      }

      const tokens: Partial<TokenResponse> = await tokenResponse.json();
      
      // Calculate expiration time
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + (tokens.expires_in || 3600));

      // Update tokens in database
      const { error } = await supabase
        .from("oauth_tokens")
        .update({
          access_token: tokens.access_token,
          token_type: tokens.token_type,
          expires_at: expiresAt.toISOString(),
          scope: tokens.scope,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("provider", "google");

      if (error) {
        throw new Error(`Failed to update tokens: ${error.message}`);
      }

      return new Response(
        JSON.stringify({ 
          access_token: tokens.access_token,
          expires_at: expiresAt.toISOString() 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Default response for unknown paths
    return new Response(
      JSON.stringify({ error: "Not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Helper function to fetch and store user's calendars
async function fetchAndStoreCalendars(userId: string, accessToken: string) {
  try {
    // Fetch calendars from Google Calendar API
    const calendarResponse = await fetch(
      "https://www.googleapis.com/calendar/v3/users/me/calendarList",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!calendarResponse.ok) {
      throw new Error("Failed to fetch calendars");
    }

    const calendarData = await calendarResponse.json();
    
    // Store calendars in database
    for (const calendar of calendarData.items) {
      await supabase
        .from("connected_calendars")
        .upsert({
          user_id: userId,
          provider: "google",
          calendar_id: calendar.id,
          name: calendar.summary,
          description: calendar.description || "",
          color: calendar.backgroundColor || "#4285F4",
          is_selected: calendar.selected || true,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "user_id,provider,calendar_id",
        });
    }
  } catch (error) {
    console.error("Error fetching calendars:", error);
    // Don't throw here, we want the token storage to succeed even if calendar fetch fails
  }
}
