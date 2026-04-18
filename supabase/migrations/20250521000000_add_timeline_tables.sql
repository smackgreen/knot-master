-- Create tables for advanced timeline management

-- Create task_dependency enum type
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dependency_type') THEN
    CREATE TYPE dependency_type AS ENUM ('finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish');
  END IF;
END $$;

-- Create task_dependencies table to track dependencies between tasks
CREATE TABLE IF NOT EXISTS task_dependencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  predecessor_task_id UUID REFERENCES tasks ON DELETE CASCADE NOT NULL,
  successor_task_id UUID REFERENCES tasks ON DELETE CASCADE NOT NULL,
  dependency_type dependency_type DEFAULT 'finish_to_start',
  lag_time INTEGER DEFAULT 0, -- Lag time in minutes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(predecessor_task_id, successor_task_id)
);

-- Create timeline_templates table for reusable timelines
CREATE TABLE IF NOT EXISTS timeline_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create timeline_template_tasks table for tasks in templates
CREATE TABLE IF NOT EXISTS timeline_template_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES timeline_templates ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  relative_day INTEGER NOT NULL, -- Days relative to wedding date (can be negative)
  duration INTEGER DEFAULT 60, -- Duration in minutes
  status task_status DEFAULT 'not_started',
  priority task_priority DEFAULT 'medium',
  category vendor_category,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create timeline_template_dependencies table for dependencies in templates
CREATE TABLE IF NOT EXISTS timeline_template_dependencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES timeline_templates ON DELETE CASCADE NOT NULL,
  predecessor_task_id UUID REFERENCES timeline_template_tasks ON DELETE CASCADE NOT NULL,
  successor_task_id UUID REFERENCES timeline_template_tasks ON DELETE CASCADE NOT NULL,
  dependency_type dependency_type DEFAULT 'finish_to_start',
  lag_time INTEGER DEFAULT 0, -- Lag time in minutes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(predecessor_task_id, successor_task_id)
);

-- Create wedding_day_timeline table for minute-by-minute wedding day schedules
CREATE TABLE IF NOT EXISTS wedding_day_timelines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  client_id UUID REFERENCES clients ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  wedding_date DATE NOT NULL,
  description TEXT,
  is_shared BOOLEAN DEFAULT false,
  share_token TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create wedding_day_events table for events in the wedding day timeline
CREATE TABLE IF NOT EXISTS wedding_day_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timeline_id UUID REFERENCES wedding_day_timelines ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  location TEXT,
  category TEXT,
  responsible_party TEXT,
  notes TEXT,
  is_critical_path BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create timeline_shares table to track who has access to timelines
CREATE TABLE IF NOT EXISTS timeline_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timeline_id UUID REFERENCES wedding_day_timelines ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  access_level TEXT NOT NULL DEFAULT 'view', -- 'view' or 'edit'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(timeline_id, email)
);

-- Add task duration field to existing tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 60; -- Duration in minutes
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_critical_path BOOLEAN DEFAULT false;

-- Add RLS policies
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_template_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_template_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE wedding_day_timelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE wedding_day_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_shares ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own task dependencies"
  ON task_dependencies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own task dependencies"
  ON task_dependencies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own task dependencies"
  ON task_dependencies FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own task dependencies"
  ON task_dependencies FOR DELETE
  USING (auth.uid() = user_id);

-- Similar policies for other tables
CREATE POLICY "Users can view their own timeline templates"
  ON timeline_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own timeline templates"
  ON timeline_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own timeline templates"
  ON timeline_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own timeline templates"
  ON timeline_templates FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_task_dependencies_user_id ON task_dependencies(user_id);
CREATE INDEX idx_task_dependencies_predecessor ON task_dependencies(predecessor_task_id);
CREATE INDEX idx_task_dependencies_successor ON task_dependencies(successor_task_id);
CREATE INDEX idx_timeline_templates_user_id ON timeline_templates(user_id);
CREATE INDEX idx_timeline_template_tasks_template_id ON timeline_template_tasks(template_id);
CREATE INDEX idx_wedding_day_timelines_user_id ON wedding_day_timelines(user_id);
CREATE INDEX idx_wedding_day_timelines_client_id ON wedding_day_timelines(client_id);
CREATE INDEX idx_wedding_day_events_timeline_id ON wedding_day_events(timeline_id);
CREATE INDEX idx_timeline_shares_timeline_id ON timeline_shares(timeline_id);
CREATE INDEX idx_timeline_shares_email ON timeline_shares(email);
