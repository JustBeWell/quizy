-- Add column to track user's last ranking position for notifications
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_ranking_position INTEGER;

COMMENT ON COLUMN users.last_ranking_position IS 'Last known ranking position for comparison in notifications';
