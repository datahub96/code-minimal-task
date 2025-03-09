-- Create daily planner table
CREATE TABLE IF NOT EXISTS daily_planner (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  daily_goal TEXT,
  plan_items JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Add RLS policies
ALTER TABLE daily_planner ENABLE ROW LEVEL SECURITY;

-- Policy for users to only see their own data
CREATE POLICY "Users can view their own planner data"
  ON daily_planner
  FOR SELECT
  USING (auth.uid()::text = user_id);

-- Policy for users to insert their own data
CREATE POLICY "Users can insert their own planner data"
  ON daily_planner
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- Policy for users to update their own data
CREATE POLICY "Users can update their own planner data"
  ON daily_planner
  FOR UPDATE
  USING (auth.uid()::text = user_id);

-- Policy for users to delete their own data
CREATE POLICY "Users can delete their own planner data"
  ON daily_planner
  FOR DELETE
  USING (auth.uid()::text = user_id);
