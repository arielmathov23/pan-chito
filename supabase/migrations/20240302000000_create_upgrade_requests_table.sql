-- Create upgrade_requests table to track user upgrade requests
CREATE TABLE IF NOT EXISTS upgrade_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  best_feature TEXT,
  worst_feature TEXT,
  satisfaction INTEGER,
  additional_feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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