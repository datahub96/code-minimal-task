-- Fix any potential issues with the tasks table
DROP TABLE IF EXISTS tasks;

-- Create tasks table with proper structure
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  deadline TIMESTAMP WITH TIME ZONE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  completed BOOLEAN DEFAULT FALSE,
  timer_started BIGINT,
  time_spent BIGINT DEFAULT 0,
  expected_time BIGINT DEFAULT 3600000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT title_not_empty CHECK (char_length(title) > 0)
);

-- Enable realtime for tasks table
alter publication supabase_realtime add table tasks;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS tasks_user_id_idx ON tasks(user_id);
CREATE INDEX IF NOT EXISTS tasks_completed_idx ON tasks(completed);
