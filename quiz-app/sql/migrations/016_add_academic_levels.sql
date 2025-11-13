-- Migration 016: Add academic levels abstraction
-- This adds a new layer: academic_levels -> subjects -> question_banks

-- Create academic_levels table
CREATE TABLE IF NOT EXISTS academic_levels (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add level_id to subjects table
ALTER TABLE subjects 
ADD COLUMN IF NOT EXISTS level_id INTEGER REFERENCES academic_levels(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_subjects_level_id ON subjects(level_id);

-- Insert the three main academic levels
INSERT INTO academic_levels (name, slug, description, display_order, is_active) VALUES
  ('ESO', 'eso', 'Educación Secundaria Obligatoria', 1, true),
  ('Bachillerato', 'bachillerato', 'Bachillerato', 2, true),
  ('Universitario', 'universitario', 'Educación Universitaria y Formación Superior', 3, true)
ON CONFLICT (slug) DO NOTHING;

-- Update existing subjects to assign them to academic levels based on their names
UPDATE subjects SET level_id = (SELECT id FROM academic_levels WHERE slug = 'eso')
WHERE slug LIKE '%-eso' OR name LIKE '%ESO%';

UPDATE subjects SET level_id = (SELECT id FROM academic_levels WHERE slug = 'bachillerato')
WHERE slug LIKE '%-bach' OR name LIKE '%Bachillerato%';

UPDATE subjects SET level_id = (SELECT id FROM academic_levels WHERE slug = 'universitario')
WHERE level_id IS NULL; -- All remaining subjects are university level

-- Add comment to track migration
COMMENT ON TABLE academic_levels IS 'Academic levels: ESO, Bachillerato, Universitario - Migration 016';
