-- Add users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW()
);

-- Add user_name column to attempts table
ALTER TABLE attempts ADD COLUMN IF NOT EXISTS user_name TEXT;

-- Add user_name column to ranking table (if not exists, since some have 'name')
-- The ranking table already has 'name', so we'll use that

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_attempts_user_name ON attempts(user_name);
CREATE INDEX IF NOT EXISTS idx_ranking_name ON ranking(name);
