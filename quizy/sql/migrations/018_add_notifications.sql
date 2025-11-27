-- Migración 018: Sistema de Notificaciones
-- Añade tabla de notificaciones y campo de preferencias en users

-- Añadir campo de preferencias de notificaciones a users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"streak_reminders": true, "ranking_updates": true, "new_content": true, "friend_activity": false, "achievements": true}'::jsonb;

-- Crear tabla de notificaciones
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'streak_reminder', 'ranking_update', 'new_content', 'achievement', 'friend_activity', 'system'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    link VARCHAR(500), -- URL opcional para redirigir al hacer click
    metadata JSONB, -- Datos adicionales según el tipo de notificación
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- Comentarios para documentación
COMMENT ON TABLE notifications IS 'Almacena todas las notificaciones del sistema para los usuarios';
COMMENT ON COLUMN notifications.type IS 'Tipo de notificación: streak_reminder, ranking_update, new_content, achievement, friend_activity, system';
COMMENT ON COLUMN notifications.metadata IS 'Información adicional específica del tipo de notificación en formato JSON';
COMMENT ON COLUMN users.notifications_enabled IS 'Indica si el usuario tiene activadas las notificaciones';
COMMENT ON COLUMN users.notification_preferences IS 'Preferencias detalladas de qué tipos de notificaciones recibir';

-- Insertar notificación de bienvenida para usuarios existentes que activen las notificaciones
-- (Esto se hará desde la aplicación cuando activen por primera vez)
