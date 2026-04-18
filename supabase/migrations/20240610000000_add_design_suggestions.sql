-- Create color_scheme type
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'color_scheme_type') THEN
    CREATE TYPE color_scheme_type AS ENUM ('primary', 'accent', 'neutral');
  END IF;
END $$;

-- Create design_suggestions table
CREATE TABLE IF NOT EXISTS design_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  client_id UUID REFERENCES clients ON DELETE CASCADE,
  name TEXT NOT NULL,
  theme TEXT,
  season TEXT,
  preferences TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create color_schemes table
CREATE TABLE IF NOT EXISTS color_schemes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  suggestion_id UUID REFERENCES design_suggestions ON DELETE CASCADE,
  name TEXT NOT NULL,
  type color_scheme_type NOT NULL,
  hex_value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create decor_ideas table
CREATE TABLE IF NOT EXISTS decor_ideas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  suggestion_id UUID REFERENCES design_suggestions ON DELETE CASCADE,
  category TEXT NOT NULL, -- 'centerpiece', 'backdrop', 'lighting', etc.
  description TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create visualization_projects table
CREATE TABLE IF NOT EXISTS visualization_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  suggestion_id UUID REFERENCES design_suggestions ON DELETE CASCADE,
  name TEXT NOT NULL,
  venue_image_url TEXT,
  modified_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE design_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE color_schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE decor_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE visualization_projects ENABLE ROW LEVEL SECURITY;

-- Create policies for design_suggestions
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'design_suggestions' AND policyname = 'Users can view their own design suggestions') THEN
    CREATE POLICY "Users can view their own design suggestions"
      ON design_suggestions FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'design_suggestions' AND policyname = 'Users can insert their own design suggestions') THEN
    CREATE POLICY "Users can insert their own design suggestions"
      ON design_suggestions FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'design_suggestions' AND policyname = 'Users can update their own design suggestions') THEN
    CREATE POLICY "Users can update their own design suggestions"
      ON design_suggestions FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'design_suggestions' AND policyname = 'Users can delete their own design suggestions') THEN
    CREATE POLICY "Users can delete their own design suggestions"
      ON design_suggestions FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create policies for color_schemes
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'color_schemes' AND policyname = 'Users can view their own color schemes') THEN
    CREATE POLICY "Users can view their own color schemes"
      ON color_schemes FOR SELECT
      USING (EXISTS (
        SELECT 1 FROM design_suggestions
        WHERE design_suggestions.id = color_schemes.suggestion_id
        AND design_suggestions.user_id = auth.uid()
      ));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'color_schemes' AND policyname = 'Users can insert their own color schemes') THEN
    CREATE POLICY "Users can insert their own color schemes"
      ON color_schemes FOR INSERT
      WITH CHECK (EXISTS (
        SELECT 1 FROM design_suggestions
        WHERE design_suggestions.id = color_schemes.suggestion_id
        AND design_suggestions.user_id = auth.uid()
      ));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'color_schemes' AND policyname = 'Users can update their own color schemes') THEN
    CREATE POLICY "Users can update their own color schemes"
      ON color_schemes FOR UPDATE
      USING (EXISTS (
        SELECT 1 FROM design_suggestions
        WHERE design_suggestions.id = color_schemes.suggestion_id
        AND design_suggestions.user_id = auth.uid()
      ));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'color_schemes' AND policyname = 'Users can delete their own color schemes') THEN
    CREATE POLICY "Users can delete their own color schemes"
      ON color_schemes FOR DELETE
      USING (EXISTS (
        SELECT 1 FROM design_suggestions
        WHERE design_suggestions.id = color_schemes.suggestion_id
        AND design_suggestions.user_id = auth.uid()
      ));
  END IF;
END $$;

-- Create policies for decor_ideas
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'decor_ideas' AND policyname = 'Users can view their own decor ideas') THEN
    CREATE POLICY "Users can view their own decor ideas"
      ON decor_ideas FOR SELECT
      USING (EXISTS (
        SELECT 1 FROM design_suggestions
        WHERE design_suggestions.id = decor_ideas.suggestion_id
        AND design_suggestions.user_id = auth.uid()
      ));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'decor_ideas' AND policyname = 'Users can insert their own decor ideas') THEN
    CREATE POLICY "Users can insert their own decor ideas"
      ON decor_ideas FOR INSERT
      WITH CHECK (EXISTS (
        SELECT 1 FROM design_suggestions
        WHERE design_suggestions.id = decor_ideas.suggestion_id
        AND design_suggestions.user_id = auth.uid()
      ));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'decor_ideas' AND policyname = 'Users can update their own decor ideas') THEN
    CREATE POLICY "Users can update their own decor ideas"
      ON decor_ideas FOR UPDATE
      USING (EXISTS (
        SELECT 1 FROM design_suggestions
        WHERE design_suggestions.id = decor_ideas.suggestion_id
        AND design_suggestions.user_id = auth.uid()
      ));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'decor_ideas' AND policyname = 'Users can delete their own decor ideas') THEN
    CREATE POLICY "Users can delete their own decor ideas"
      ON decor_ideas FOR DELETE
      USING (EXISTS (
        SELECT 1 FROM design_suggestions
        WHERE design_suggestions.id = decor_ideas.suggestion_id
        AND design_suggestions.user_id = auth.uid()
      ));
  END IF;
END $$;

-- Create policies for visualization_projects
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'visualization_projects' AND policyname = 'Users can view their own visualization projects') THEN
    CREATE POLICY "Users can view their own visualization projects"
      ON visualization_projects FOR SELECT
      USING (EXISTS (
        SELECT 1 FROM design_suggestions
        WHERE design_suggestions.id = visualization_projects.suggestion_id
        AND design_suggestions.user_id = auth.uid()
      ));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'visualization_projects' AND policyname = 'Users can insert their own visualization projects') THEN
    CREATE POLICY "Users can insert their own visualization projects"
      ON visualization_projects FOR INSERT
      WITH CHECK (EXISTS (
        SELECT 1 FROM design_suggestions
        WHERE design_suggestions.id = visualization_projects.suggestion_id
        AND design_suggestions.user_id = auth.uid()
      ));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'visualization_projects' AND policyname = 'Users can update their own visualization projects') THEN
    CREATE POLICY "Users can update their own visualization projects"
      ON visualization_projects FOR UPDATE
      USING (EXISTS (
        SELECT 1 FROM design_suggestions
        WHERE design_suggestions.id = visualization_projects.suggestion_id
        AND design_suggestions.user_id = auth.uid()
      ));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'visualization_projects' AND policyname = 'Users can delete their own visualization projects') THEN
    CREATE POLICY "Users can delete their own visualization projects"
      ON visualization_projects FOR DELETE
      USING (EXISTS (
        SELECT 1 FROM design_suggestions
        WHERE design_suggestions.id = visualization_projects.suggestion_id
        AND design_suggestions.user_id = auth.uid()
      ));
  END IF;
END $$;
