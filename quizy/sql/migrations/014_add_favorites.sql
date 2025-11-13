-- Crear tabla para favoritos de exámenes
CREATE TABLE IF NOT EXISTS favorites (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bank_id TEXT NOT NULL,
  subject_slug TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, bank_id)
);

-- Índice para búsqueda rápida por usuario
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);

-- Índice para búsqueda por usuario y asignatura
CREATE INDEX IF NOT EXISTS idx_favorites_user_subject ON favorites(user_id, subject_slug);

-- Índice para búsqueda por banco
CREATE INDEX IF NOT EXISTS idx_favorites_bank_id ON favorites(bank_id);
