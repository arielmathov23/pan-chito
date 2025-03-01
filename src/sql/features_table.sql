-- Create features table
CREATE TABLE IF NOT EXISTS public.features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brief_id UUID NOT NULL REFERENCES public.briefs(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL CHECK (priority IN ('must', 'should', 'could', 'wont')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create feature_sets table to group features
CREATE TABLE IF NOT EXISTS public.feature_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brief_id UUID NOT NULL REFERENCES public.briefs(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_questions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS features_brief_id_idx ON public.features(brief_id);
CREATE INDEX IF NOT EXISTS features_project_id_idx ON public.features(project_id);
CREATE INDEX IF NOT EXISTS features_user_id_idx ON public.features(user_id);
CREATE INDEX IF NOT EXISTS feature_sets_brief_id_idx ON public.feature_sets(brief_id);
CREATE INDEX IF NOT EXISTS feature_sets_project_id_idx ON public.feature_sets(project_id);
CREATE INDEX IF NOT EXISTS feature_sets_user_id_idx ON public.feature_sets(user_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER set_features_updated_at
BEFORE UPDATE ON public.features
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_feature_sets_updated_at
BEFORE UPDATE ON public.feature_sets
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();

-- Enable Row Level Security
ALTER TABLE public.features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_sets ENABLE ROW LEVEL SECURITY;

-- Create policies for features table
CREATE POLICY "Users can view their own features"
ON public.features FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own features"
ON public.features FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own features"
ON public.features FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own features"
ON public.features FOR DELETE
USING (auth.uid() = user_id);

-- Create policies for feature_sets table
CREATE POLICY "Users can view their own feature sets"
ON public.feature_sets FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feature sets"
ON public.feature_sets FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feature sets"
ON public.feature_sets FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own feature sets"
ON public.feature_sets FOR DELETE
USING (auth.uid() = user_id); 