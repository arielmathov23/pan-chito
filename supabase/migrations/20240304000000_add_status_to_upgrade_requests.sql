-- Add status column to upgrade_requests table
ALTER TABLE upgrade_requests 
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Update existing records to have a status of 'pending'
UPDATE upgrade_requests
SET status = 'pending'
WHERE status IS NULL;

-- Update RLS policies to include the new column
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

-- Allow admins to update upgrade requests (for approving/rejecting)
DROP POLICY IF EXISTS "Only admins can update upgrade requests" ON upgrade_requests;
CREATE POLICY "Only admins can update upgrade requests"
  ON upgrade_requests
  FOR UPDATE
  USING (auth.uid() IN (
    SELECT auth.uid() FROM auth.users 
    WHERE auth.uid() = auth.uid() AND (raw_app_meta_data->>'role') = 'admin'
  )); 