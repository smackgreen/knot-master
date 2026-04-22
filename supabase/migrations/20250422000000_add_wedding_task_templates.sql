-- ============================================================
-- Wedding Task Template System
-- ============================================================
-- Adds support for pre-built wedding task templates with subtasks,
-- relative timelines, and priority levels.
-- ============================================================

-- 1. Extend task_priority enum to include 'critical'
-- Step 1a: Drop the default on the priority column (references old enum type)
ALTER TABLE public.tasks ALTER COLUMN priority DROP DEFAULT;

-- Step 1b: Rename old enum type
ALTER TYPE public.task_priority RENAME TO task_priority_old;

-- Step 1c: Create new enum type with 'critical' added
CREATE TYPE public.task_priority AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

-- Step 1d: Migrate existing data to the new enum type
ALTER TABLE public.tasks ALTER COLUMN priority TYPE public.task_priority
  USING priority::text::public.task_priority;

-- Step 1e: Set new default
ALTER TABLE public.tasks ALTER COLUMN priority SET DEFAULT 'medium'::public.task_priority;

-- Step 1f: Drop old enum type
DROP TYPE public.task_priority_old;

-- 2. Add new columns to tasks table
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS start_date timestamptz,
  ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS template_category text,
  ADD COLUMN IF NOT EXISTS is_from_template boolean DEFAULT false;

-- 3. Create task_subtasks table
CREATE TABLE IF NOT EXISTS public.task_subtasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  is_completed boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Create wedding_task_templates table (read-only template definitions)
CREATE TABLE IF NOT EXISTS public.wedding_task_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  title text NOT NULL,
  description text,
  priority public.task_priority NOT NULL DEFAULT 'medium',
  start_date_offset_days integer NOT NULL DEFAULT 0,  -- days before wedding date
  end_date_offset_days integer NOT NULL DEFAULT 0,    -- days before wedding date
  sort_order integer DEFAULT 0,
  subtasks jsonb DEFAULT '[]'::jsonb,                 -- Array of {title, description}
  icon text,                                           -- Lucide icon name
  created_at timestamptz DEFAULT now()
);

-- 5. Create indexes
CREATE INDEX IF NOT EXISTS idx_tasks_template_category ON public.tasks(template_category);
CREATE INDEX IF NOT EXISTS idx_tasks_sort_order ON public.tasks(sort_order);
CREATE INDEX IF NOT EXISTS idx_tasks_start_date ON public.tasks(start_date);
CREATE INDEX IF NOT EXISTS idx_task_subtasks_task_id ON public.task_subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_task_subtasks_sort_order ON public.task_subtasks(sort_order);
CREATE INDEX IF NOT EXISTS idx_wedding_task_templates_category ON public.wedding_task_templates(category);

-- 6. Enable RLS
ALTER TABLE public.task_subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wedding_task_templates ENABLE ROW LEVEL SECURITY;

-- 7. RLS policies for task_subtasks (same access pattern as tasks)
CREATE POLICY "Users can view their own subtasks"
  ON public.task_subtasks FOR SELECT
  USING (
    task_id IN (
      SELECT id FROM public.tasks WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own subtasks"
  ON public.task_subtasks FOR INSERT
  WITH CHECK (
    task_id IN (
      SELECT id FROM public.tasks WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own subtasks"
  ON public.task_subtasks FOR UPDATE
  USING (
    task_id IN (
      SELECT id FROM public.tasks WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own subtasks"
  ON public.task_subtasks FOR DELETE
  USING (
    task_id IN (
      SELECT id FROM public.tasks WHERE user_id = auth.uid()
    )
  );

-- 8. RLS policies for wedding_task_templates (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view templates"
  ON public.wedding_task_templates FOR SELECT
  USING (true);

-- 9. Insert pre-built wedding task templates
INSERT INTO public.wedding_task_templates (category, title, description, priority, start_date_offset_days, end_date_offset_days, sort_order, subtasks, icon) VALUES
-- Venue & Location
('venue_location', 'Venue & Location', 'Secure the perfect venues for your ceremony and reception', 'critical', 365, 270, 1,
  '[{"title": "Find and book ceremony venue", "description": "Research and visit potential ceremony venues"}, {"title": "Find and book reception venue", "description": "Research and visit potential reception venues"}, {"title": "Confirm venue availability and capacity", "description": "Verify dates, guest capacity, and restrictions"}]',
  'MapPin'),

-- Guest List & Invitations
('guest_list', 'Guest List & Invitations', 'Manage your guest list and send invitations', 'high', 300, 90, 2,
  '[{"title": "Draft complete guest list", "description": "Compile names, addresses, and contact info for all potential guests"}, {"title": "Organize guest addresses and contact info", "description": "Create a spreadsheet or use a tool to track all guest details"}, {"title": "Design and send save-the-dates", "description": "Create and mail save-the-date cards 6-8 months before the wedding"}, {"title": "Send formal invitations and track RSVPs", "description": "Mail invitations 8-12 weeks before and track responses"}]',
  'Users'),

-- Budget Planning
('budget', 'Budget Planning', 'Establish and manage your wedding budget', 'critical', 365, 30, 3,
  '[{"title": "Establish total wedding budget", "description": "Determine the overall budget with all contributors"}, {"title": "Allocate budget percentages per category", "description": "Divide budget across venue, catering, attire, etc."}, {"title": "Track deposits and payments ongoing", "description": "Monitor all payments, due dates, and receipts"}]',
  'DollarSign'),

-- Venue Selection
('venue_selection', 'Venue Selection', 'Research, compare, and finalize your venue', 'critical', 330, 240, 4,
  '[{"title": "Research and compare venues", "description": "Create a shortlist of potential venues with pros/cons"}, {"title": "Schedule venue tours", "description": "Visit top venue choices in person"}, {"title": "Review and sign venue contracts", "description": "Carefully review terms and sign the venue agreement"}]',
  'Building'),

-- Photography & Videography
('photography', 'Photography & Videography', 'Capture every moment with the right professionals', 'high', 300, 180, 5,
  '[{"title": "Research photographers and videographers", "description": "Browse portfolios and read reviews for local professionals"}, {"title": "Review portfolios and packages", "description": "Compare pricing, style, and deliverables"}, {"title": "Book preferred photographer", "description": "Sign contract and pay deposit for your chosen photographer"}, {"title": "Schedule engagement photo session", "description": "Plan and book an engagement shoot"}]',
  'Camera'),

-- Catering & Food
('catering', 'Catering & Food', 'Plan the perfect menu for your celebration', 'high', 270, 60, 6,
  '[{"title": "Determine dining style and menu preferences", "description": "Decide between plated, buffet, family-style, or stations"}, {"title": "Schedule catering tastings", "description": "Book tastings with your top caterer choices"}, {"title": "Finalize menu selections and dietary accommodations", "description": "Confirm dishes and plan for dietary restrictions"}, {"title": "Confirm headcount with caterer", "description": "Provide final guest count for food preparation"}]',
  'UtensilsCrossed'),

-- Floral Design
('floral', 'Floral Design', 'Design beautiful floral arrangements for your day', 'medium', 240, 60, 7,
  '[{"title": "Research and contact florists", "description": "Find florists whose style matches your vision"}, {"title": "Discuss floral arrangements and color palette", "description": "Share your theme, colors, and preferences"}, {"title": "Confirm bouquet and centerpiece designs", "description": "Finalize all floral designs and place orders"}]',
  'Flower2'),

-- Hair & Makeup
('hair_makeup', 'Hair & Makeup', 'Look your best with professional beauty services', 'medium', 180, 30, 8,
  '[{"title": "Research beauty professionals", "description": "Find hair stylists and makeup artists with wedding experience"}, {"title": "Schedule hair and makeup trial runs", "description": "Book trials to test your desired looks"}, {"title": "Book beauty team for wedding day", "description": "Sign contracts and confirm timing for the big day"}]',
  'Sparkles'),

-- Entertainment
('entertainment', 'Entertainment', 'Plan music and entertainment for your reception', 'medium', 270, 60, 9,
  '[{"title": "Research DJs and live bands", "description": "Listen to samples and read reviews for entertainment options"}, {"title": "Review song preferences and do-not-play lists", "description": "Curate your playlist and identify songs to avoid"}, {"title": "Book entertainment and confirm setup requirements", "description": "Sign contract and discuss equipment/space needs"}]',
  'Music'),

-- Wedding Cake
('cake', 'Wedding Cake', 'Design and order your dream wedding cake', 'medium', 180, 30, 10,
  '[{"title": "Research bakeries and cake designers", "description": "Find bakers who specialize in wedding cakes"}, {"title": "Schedule cake tasting appointments", "description": "Book tastings to sample flavors and fillings"}, {"title": "Finalize cake design and flavors", "description": "Choose the design, flavors, and size for your cake"}]',
  'Cake'),

-- Transportation
('transportation', 'Transportation', 'Arrange transportation for the wedding day', 'low', 120, 14, 11,
  '[{"title": "Arrange transportation for wedding party", "description": "Book limo, party bus, or other transport for the bridal party"}, {"title": "Book guest shuttle services if needed", "description": "Arrange transport between ceremony, reception, and hotels"}, {"title": "Confirm pickup and dropoff logistics", "description": "Finalize timing and locations for all transportation"}]',
  'Car'),

-- Wedding Attire
('attire', 'Wedding Attire', 'Find the perfect wedding outfits', 'high', 270, 30, 12,
  '[{"title": "Shop for wedding dress and accessories", "description": "Visit bridal shops and find your dream dress"}, {"title": "Schedule dress fittings and alterations", "description": "Book fittings to ensure the perfect fit"}, {"title": "Coordinate wedding party attire", "description": "Select and order bridesmaid dresses, suits, and accessories"}]',
  'Shirt'),

-- Rings & Jewelry
('rings', 'Rings & Jewelry', 'Select and personalize your wedding bands', 'medium', 180, 14, 13,
  '[{"title": "Research wedding band styles", "description": "Browse styles, metals, and designs for wedding bands"}, {"title": "Shop for and purchase wedding rings", "description": "Visit jewelers and select your rings"}, {"title": "Engrave rings if desired", "description": "Add personal engravings to your wedding bands"}]',
  'Gem')

ON CONFLICT DO NOTHING;

-- 10. Add trigger for updated_at on task_subtasks
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_task_subtasks_updated_at ON public.task_subtasks;
CREATE TRIGGER update_task_subtasks_updated_at
  BEFORE UPDATE ON public.task_subtasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
