-- Create extension for UUID generation if it doesn't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table for storing user profiles if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID UNIQUE,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

-- Enable realtime for users table
alter publication supabase_realtime add table users;

-- Create tasks table if it doesn't exist
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

-- Create categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT name_not_empty CHECK (char_length(name) > 0)
);

-- Enable realtime for categories table
alter publication supabase_realtime add table categories;

-- Create daily_planner table if it doesn't exist
CREATE TABLE IF NOT EXISTS daily_planner (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  daily_goal TEXT,
  plan_items JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Enable realtime for daily_planner table
alter publication supabase_realtime add table daily_planner;

-- Create unique constraint on user_id and date for daily_planner
ALTER TABLE daily_planner DROP CONSTRAINT IF EXISTS daily_planner_user_id_date_key;
ALTER TABLE daily_planner ADD CONSTRAINT daily_planner_user_id_date_key UNIQUE (user_id, date);
