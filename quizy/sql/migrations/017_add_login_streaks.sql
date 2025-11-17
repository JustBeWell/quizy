-- Add login streak tracking to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_date DATE;

-- Create table to track daily logins
CREATE TABLE IF NOT EXISTS daily_logins (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  login_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, login_date)
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_daily_logins_user_date ON daily_logins(user_id, login_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_logins_date ON daily_logins(login_date);

-- Comment for documentation
COMMENT ON TABLE daily_logins IS 'Tracks each day a user logs in for streak calculation';
COMMENT ON COLUMN users.current_streak IS 'Current consecutive days logged in';
COMMENT ON COLUMN users.longest_streak IS 'Maximum consecutive days ever achieved';
COMMENT ON COLUMN users.last_login_date IS 'Last date user logged in (date only, no time)';
