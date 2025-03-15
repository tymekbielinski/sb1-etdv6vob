-- Dashboards Table (supports both user and team ownership)
CREATE TABLE dashboards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  config JSONB NOT NULL, -- Stores layout/metric definitions
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  version INTEGER DEFAULT 1 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (
    (user_id IS NOT NULL AND team_id IS NULL) OR
    (user_id IS NULL AND team_id IS NOT NULL)
  )
);

-- Templates Table (user-owned only for now)
CREATE TABLE dashboard_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  config JSONB NOT NULL, -- Metric structure without data
  category TEXT,
  visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'public')),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  downloads_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_dashboards_user ON dashboards(user_id);
CREATE INDEX idx_dashboards_team ON dashboards(team_id);
CREATE INDEX idx_templates_owner ON dashboard_templates(owner_id);
CREATE INDEX idx_templates_visibility ON dashboard_templates(visibility);

-- Add RLS (Row Level Security) policies for dashboards
ALTER TABLE dashboards ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view/edit their own dashboards
CREATE POLICY "Users can manage their own dashboards"
  ON dashboards
  USING (user_id = auth.uid());

-- Policy: Team members can view/edit team dashboards
CREATE POLICY "Team members can manage team dashboards"
  ON dashboards
  USING (
    team_id IN (
      SELECT id FROM teams
      WHERE user_id = auth.uid() OR auth.email() = ANY(team_members)
    )
  );

-- Add RLS policies for dashboard templates
ALTER TABLE dashboard_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view/edit their own templates
CREATE POLICY "Users can manage their own templates"
  ON dashboard_templates
  USING (owner_id = auth.uid());

-- Policy: Everyone can view public templates
CREATE POLICY "Everyone can view public templates"
  ON dashboard_templates
  FOR SELECT
  USING (visibility = 'public');

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for dashboards
CREATE TRIGGER update_dashboards_updated_at
BEFORE UPDATE ON dashboards
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for dashboard_templates
CREATE TRIGGER update_dashboard_templates_updated_at
BEFORE UPDATE ON dashboard_templates
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Function to increment downloads_count
CREATE OR REPLACE FUNCTION increment_template_downloads()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE dashboard_templates
  SET downloads_count = downloads_count + 1
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a function to convert client-side metrics to template format
CREATE OR REPLACE FUNCTION convert_metrics_to_template(client_config JSONB)
RETURNS JSONB AS $$
DECLARE
  template_config JSONB;
BEGIN
  -- Strip any user-specific data while keeping structure
  -- This is a placeholder implementation - actual logic would depend on your data structure
  template_config = client_config;
  
  -- Remove any user-specific IDs or data references
  -- This would need to be customized based on your actual data structure
  
  RETURN template_config;
END;
$$ LANGUAGE plpgsql;
