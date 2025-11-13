-- Migración 009: Agregar verificación de email
-- Fecha: 2025-11-06
-- Descripción: Agregar campos para verificación de email

-- 0. Agregar columna email si no existe
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- 1. Agregar columna email_verified (por defecto true para usuarios existentes)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT true;

-- 2. Agregar columna verification_token
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255);

-- 3. Agregar columna verification_token_expires
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS verification_token_expires TIMESTAMP;

-- 4. Hacer que el email sea único si no es NULL
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique 
ON users (email) 
WHERE email IS NOT NULL;

-- 5. Los nuevos usuarios tendrán email_verified en false
ALTER TABLE users 
ALTER COLUMN email_verified SET DEFAULT false;

-- 6. Actualizar usuarios existentes sin email para que tengan email_verified = false
UPDATE users 
SET email_verified = false 
WHERE email IS NULL;

COMMENT ON COLUMN users.email_verified IS 'Indica si el usuario ha verificado su email';
COMMENT ON COLUMN users.verification_token IS 'Token para verificar el email';
COMMENT ON COLUMN users.verification_token_expires IS 'Fecha de expiración del token de verificación';
