-- Create a table to store OAuth tokens for external services
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

-- Create a table to store connected calendars
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

-- Enable Row Level Security
ALTER TABLE oauth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE connected_calendars ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for oauth_tokens
CREATE POLICY "Users can view their own oauth tokens"
  ON oauth_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own oauth tokens"
  ON oauth_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own oauth tokens"
  ON oauth_tokens FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own oauth tokens"
  ON oauth_tokens FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS Policies for connected_calendars
CREATE POLICY "Users can view their own connected calendars"
  ON connected_calendars FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own connected calendars"
  ON connected_calendars FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own connected calendars"
  ON connected_calendars FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own connected calendars"
  ON connected_calendars FOR DELETE
  USING (auth.uid() = user_id);
