-- Add question_banks table for custom questionnaires created by admin
CREATE TABLE IF NOT EXISTS question_banks (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  subject_id INTEGER REFERENCES subjects(id),
  questions JSONB NOT NULL,
  created_by TEXT NOT NULL, -- admin username
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_question_banks_subject ON question_banks(subject_id);
CREATE INDEX IF NOT EXISTS idx_question_banks_active ON question_banks(is_active);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_question_banks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_question_banks_updated_at
  BEFORE UPDATE ON question_banks
  FOR EACH ROW
  EXECUTE FUNCTION update_question_banks_updated_at();
