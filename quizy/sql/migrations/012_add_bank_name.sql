-- Migration 012: Add bank_name column to attempts
-- Stores the display name of the questionnaire for better UI

ALTER TABLE attempts 
ADD COLUMN IF NOT EXISTS bank_name VARCHAR(255);

-- Update existing records with bank_name from question_banks
UPDATE attempts a
SET bank_name = CASE
  WHEN a.bank LIKE 'db_%' THEN (
    SELECT qb.name 
    FROM question_banks qb 
    WHERE qb.id = CAST(REPLACE(a.bank, 'db_', '') AS INTEGER)
  )
  ELSE UPPER(a.bank)
END
WHERE bank_name IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN attempts.bank_name IS 'Display name of the questionnaire shown in UI';
