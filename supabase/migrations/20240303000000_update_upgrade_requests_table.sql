-- Update upgrade_requests table to include additional feedback fields
ALTER TABLE upgrade_requests 
  DROP COLUMN IF EXISTS feedback,
  ADD COLUMN IF NOT EXISTS best_feature TEXT,
  ADD COLUMN IF NOT EXISTS worst_feature TEXT,
  ADD COLUMN IF NOT EXISTS additional_feedback TEXT;

-- Make sure satisfaction column exists
ALTER TABLE upgrade_requests
  ADD COLUMN IF NOT EXISTS satisfaction INTEGER;

-- Update RLS policies to include the new columns
DROP POLICY IF EXISTS "Users can submit upgrade requests" ON upgrade_requests;
CREATE POLICY "Users can submit upgrade requests"
  ON upgrade_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Update admin view policy
DROP POLICY IF EXISTS "Only admins can view upgrade requests" ON upgrade_requests;
CREATE POLICY "Only admins can view upgrade requests"
  ON upgrade_requests
  FOR SELECT
  USING (auth.uid() IN (
    SELECT auth.uid() FROM auth.users 
    WHERE auth.uid() = auth.uid() AND (raw_app_meta_data->>'role') = 'admin'
  )); 