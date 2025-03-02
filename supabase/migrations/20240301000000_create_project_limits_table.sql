-- Create project_limits table to store user-specific project limits
CREATE TABLE IF NOT EXISTS project_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  max_projects INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique index on user_id to ensure one record per user
CREATE UNIQUE INDEX IF NOT EXISTS project_limits_user_id_idx ON project_limits(user_id);

-- Create admin_settings table for global configuration
CREATE TABLE IF NOT EXISTS admin_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default global project limit setting
INSERT INTO admin_settings (key, value)
VALUES ('default_project_limit', '{"max_projects": 1}')
ON CONFLICT (id) DO NOTHING;

-- Create unique index on key to ensure one record per setting key
CREATE UNIQUE INDEX IF NOT EXISTS admin_settings_key_idx ON admin_settings(key);

-- Create upgrade_requests table to track user upgrade requests
CREATE TABLE IF NOT EXISTS upgrade_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies for project_limits
ALTER TABLE project_limits ENABLE ROW LEVEL SECURITY;

-- Users can read their own limits
CREATE POLICY "Users can read their own project limits"
  ON project_limits
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only authenticated users with appropriate role can insert/update project limits
CREATE POLICY "Only admins can modify project limits"
  ON project_limits
  FOR ALL
  USING (auth.uid() IN (
    SELECT auth.uid() FROM auth.users 
    WHERE auth.uid() = auth.uid() AND (raw_app_meta_data->>'role') = 'admin'
  ));

-- Create RLS policies for upgrade_requests
ALTER TABLE upgrade_requests ENABLE ROW LEVEL SECURITY;

-- Users can insert their own upgrade requests
CREATE POLICY "Users can submit upgrade requests"
  ON upgrade_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Only admins can read upgrade requests
CREATE POLICY "Only admins can view upgrade requests"
  ON upgrade_requests
  FOR SELECT
  USING (auth.uid() IN (
    SELECT auth.uid() FROM auth.users 
    WHERE auth.uid() = auth.uid() AND (raw_app_meta_data->>'role') = 'admin'
  )); 