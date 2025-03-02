-- Create tech_docs table
CREATE TABLE IF NOT EXISTS tech_docs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prd_id UUID NOT NULL REFERENCES prds(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tech_stack TEXT,
  frontend TEXT,
  backend TEXT,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE tech_docs ENABLE ROW LEVEL SECURITY;

-- Policy for selecting tech docs (users can only see their own)
CREATE POLICY tech_docs_select_policy ON tech_docs
  FOR SELECT USING (auth.uid() = user_id);

-- Policy for inserting tech docs (users can only insert their own)
CREATE POLICY tech_docs_insert_policy ON tech_docs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for updating tech docs (users can only update their own)
CREATE POLICY tech_docs_update_policy ON tech_docs
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy for deleting tech docs (users can only delete their own)
CREATE POLICY tech_docs_delete_policy ON tech_docs
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tech_docs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_tech_docs_updated_at
BEFORE UPDATE ON tech_docs
FOR EACH ROW
EXECUTE FUNCTION update_tech_docs_updated_at();

-- Create index on prd_id for faster lookups
CREATE INDEX IF NOT EXISTS tech_docs_prd_id_idx ON tech_docs(prd_id);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS tech_docs_user_id_idx ON tech_docs(user_id); 