-- Migration 011: Add published status to question_banks
-- Allows admins to publish/unpublish custom questionnaires

ALTER TABLE question_banks 
ADD COLUMN is_published BOOLEAN DEFAULT FALSE;

-- Add index for faster queries filtering by published status
CREATE INDEX idx_question_banks_published ON question_banks(is_published);

-- Add comment for documentation
COMMENT ON COLUMN question_banks.is_published IS 'Indicates if the questionnaire is published and visible to all users';
