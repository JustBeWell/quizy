-- Migration 006: Add subject_id to attempts
-- This allows filtering ranking and attempts by subject

ALTER TABLE attempts ADD COLUMN IF NOT EXISTS subject_id INTEGER REFERENCES subjects(id);

-- Add index for faster lookups by subject
CREATE INDEX IF NOT EXISTS idx_attempts_subject_id ON attempts(subject_id);

-- Add composite index for common queries (user + subject)
CREATE INDEX IF NOT EXISTS idx_attempts_user_subject ON attempts(user_name, subject_id);

-- For existing attempts without subject, try to infer from bank name if possible
-- This is a best-effort migration; new attempts will have subject_id properly set
COMMENT ON COLUMN attempts.subject_id IS 'References subjects table - can be NULL for legacy attempts';
