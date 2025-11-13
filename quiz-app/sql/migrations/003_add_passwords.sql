-- Añadir columna de contraseña hasheada a la tabla users
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Crear índice para búsquedas por nombre (login)
CREATE INDEX IF NOT EXISTS idx_users_name_lookup ON users(name);
