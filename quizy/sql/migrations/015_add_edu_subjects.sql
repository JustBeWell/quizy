-- Migration 015: Add educational subjects for ESO and Bachillerato
-- This adds real Spanish education system subjects

-- ESO subjects
INSERT INTO subjects (name, slug, description) 
VALUES 
  ('Matemáticas ESO', 'matematicas-eso', 'Matemáticas de Educación Secundaria Obligatoria'),
  ('Lengua y Literatura ESO', 'lengua-eso', 'Lengua Castellana y Literatura - ESO'),
  ('Física y Química ESO', 'fisica-quimica-eso', 'Física y Química - ESO'),
  ('Biología y Geología ESO', 'biologia-geologia-eso', 'Biología y Geología - ESO'),
  ('Geografía e Historia ESO', 'geografia-historia-eso', 'Geografía e Historia - ESO'),
  ('Inglés ESO', 'ingles-eso', 'Lengua Extranjera: Inglés - ESO')
ON CONFLICT (slug) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- Bachillerato - Ciencias
INSERT INTO subjects (name, slug, description) 
VALUES 
  ('Matemáticas I', 'matematicas-1-bach', 'Matemáticas I - 1º Bachillerato (Ciencias)'),
  ('Matemáticas II', 'matematicas-2-bach', 'Matemáticas II - 2º Bachillerato (Ciencias)'),
  ('Física', 'fisica-bach', 'Física - Bachillerato'),
  ('Química', 'quimica-bach', 'Química - Bachillerato'),
  ('Biología', 'biologia-bach', 'Biología - Bachillerato')
ON CONFLICT (slug) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- Bachillerato - Letras/Humanidades
INSERT INTO subjects (name, slug, description) 
VALUES 
  ('Historia de España', 'historia-espana-bach', 'Historia de España - 2º Bachillerato'),
  ('Lengua Castellana y Literatura', 'lengua-bach', 'Lengua Castellana y Literatura - Bachillerato'),
  ('Filosofía', 'filosofia-bach', 'Filosofía - Bachillerato'),
  ('Historia de la Filosofía', 'historia-filosofia-bach', 'Historia de la Filosofía - 2º Bachillerato'),
  ('Economía', 'economia-bach', 'Economía - Bachillerato')
ON CONFLICT (slug) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description;
