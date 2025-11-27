-- Crear tabla de notificaciones
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(500),
  metadata JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- Añadir columnas a tabla users para configuración de notificaciones
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"streak_reminders": true, "ranking_updates": true, "new_content": true, "friend_activity": false, "achievements": true}'::jsonb;

-- Comentarios
COMMENT ON TABLE notifications IS 'Tabla para almacenar notificaciones de usuarios';
COMMENT ON COLUMN notifications.type IS 'Tipo de notificación: streak_reminder, ranking_update, new_content, achievement, friend_activity, system';
COMMENT ON COLUMN notifications.metadata IS 'Datos adicionales en formato JSON';
COMMENT ON COLUMN users.notifications_enabled IS 'Si el usuario tiene las notificaciones activadas globalmente';
COMMENT ON COLUMN users.notification_preferences IS 'Preferencias específicas por tipo de notificación';
