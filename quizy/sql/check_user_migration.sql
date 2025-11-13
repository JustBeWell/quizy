-- Script para verificar usuarios sin contraseña (cuentas antiguas)
-- Este script muestra qué usuarios necesitan migración

SELECT 
  id, 
  name, 
  created_at,
  CASE 
    WHEN password_hash IS NULL THEN '⚠️ SIN CONTRASEÑA'
    ELSE '✅ CON CONTRASEÑA'
  END AS status
FROM users
ORDER BY created_at DESC;

-- Estadísticas
SELECT 
  COUNT(*) as total_usuarios,
  COUNT(password_hash) as con_contraseña,
  COUNT(*) - COUNT(password_hash) as sin_contraseña
FROM users;
