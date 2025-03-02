-- SQL for creating tables to store app screens, flows, and steps in Supabase
-- This script creates the necessary tables and security policies for the screens feature

-- Create screens table
CREATE TABLE screens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prd_id UUID NOT NULL REFERENCES prds(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  elements JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id)
);

-- Create app_flows table
CREATE TABLE app_flows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prd_id UUID NOT NULL REFERENCES prds(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id)
);

-- Create flow_steps table
CREATE TABLE flow_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_flow_id UUID NOT NULL REFERENCES app_flows(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  screen_id UUID REFERENCES screens(id) ON DELETE SET NULL,
  position INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX screens_prd_id_idx ON screens(prd_id);
CREATE INDEX app_flows_prd_id_idx ON app_flows(prd_id);
CREATE INDEX flow_steps_app_flow_id_idx ON flow_steps(app_flow_id);
CREATE INDEX flow_steps_screen_id_idx ON flow_steps(screen_id);

-- Add RLS policies
ALTER TABLE screens ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_steps ENABLE ROW LEVEL SECURITY;

-- Create policies for screens
CREATE POLICY "Users can view their own screens"
  ON screens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own screens"
  ON screens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own screens"
  ON screens FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own screens"
  ON screens FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for app_flows
CREATE POLICY "Users can view their own app_flows"
  ON app_flows FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own app_flows"
  ON app_flows FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own app_flows"
  ON app_flows FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own app_flows"
  ON app_flows FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for flow_steps
CREATE POLICY "Users can view flow_steps for their app_flows"
  ON flow_steps FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM app_flows
    WHERE app_flows.id = flow_steps.app_flow_id
    AND app_flows.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert flow_steps for their app_flows"
  ON flow_steps FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM app_flows
    WHERE app_flows.id = flow_steps.app_flow_id
    AND app_flows.user_id = auth.uid()
  ));

CREATE POLICY "Users can update flow_steps for their app_flows"
  ON flow_steps FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM app_flows
    WHERE app_flows.id = flow_steps.app_flow_id
    AND app_flows.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete flow_steps for their app_flows"
  ON flow_steps FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM app_flows
    WHERE app_flows.id = flow_steps.app_flow_id
    AND app_flows.user_id = auth.uid()
  )); 