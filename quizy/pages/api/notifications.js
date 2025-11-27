import { verifyToken } from '../../lib/jwt'
import db from '../../lib/db'
import { 
  validateId, 
  validateStringLength, 
  validateNotificationType, 
  validateJSON,
  validateBoolean,
  truncateString
} from '../../lib/input-validation'

export default async function handler(req, res) {
  // Verificar autenticación
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado' })
  }

  const token = authHeader.split(' ')[1]
  let decoded
  try {
    decoded = verifyToken(token)
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' })
  }

  // Obtener user_id directamente del token
  const userId = decoded.id
  
  // Obtener configuración de notificaciones
  const userResult = await db.query(
    'SELECT id, notifications_enabled FROM users WHERE id = $1',
    [userId]
  )

  if (userResult.rows.length === 0) {
    return res.status(404).json({ error: 'Usuario no encontrado' })
  }

  const notificationsEnabled = userResult.rows[0].notifications_enabled

  if (req.method === 'GET') {
    try {
      // Obtener todas las notificaciones del usuario (últimas 50)
      const limit = parseInt(req.query.limit) || 50
      const unreadOnly = req.query.unread_only === 'true'

      let query = `
        SELECT 
          id, 
          type, 
          title, 
          message, 
          link, 
          metadata, 
          is_read, 
          created_at, 
          read_at
        FROM notifications
        WHERE user_id = $1
      `
      
      const params = [userId]

      if (unreadOnly) {
        query += ' AND is_read = FALSE'
      }

      query += ' ORDER BY created_at DESC LIMIT $2'
      params.push(limit)

      const result = await db.query(query, params)

      // Obtener contador de no leídas
      const unreadCount = await db.query(
        'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = FALSE',
        [userId]
      )

      res.status(200).json({
        notifications: result.rows,
        unread_count: parseInt(unreadCount.rows[0].count),
        notifications_enabled: notificationsEnabled
      })

    } catch (error) {
      console.error('Error obteniendo notificaciones:', error)
      res.status(500).json({ error: 'Error obteniendo notificaciones' })
    }

  } else if (req.method === 'POST') {
    // Crear una notificación (solo para testing o uso interno)
    try {
      let { type, title, message, link, metadata } = req.body

      // Validación de entrada
      if (!type || !title || !message) {
        return res.status(400).json({ error: 'Faltan campos requeridos' })
      }

      if (!validateNotificationType(type)) {
        return res.status(400).json({ error: 'Tipo de notificación inválido' })
      }

      if (!validateStringLength(title, 1, 255)) {
        return res.status(400).json({ error: 'El título debe tener entre 1 y 255 caracteres' })
      }

      if (!validateStringLength(message, 1, 5000)) {
        return res.status(400).json({ error: 'El mensaje debe tener entre 1 y 5000 caracteres' })
      }

      // Truncar valores para seguridad
      title = truncateString(title.trim(), 255)
      message = truncateString(message.trim(), 5000)

      // Validar metadata si existe
      if (metadata && !validateJSON(metadata, 10000)) {
        return res.status(400).json({ error: 'Metadata inválido o demasiado grande' })
      }

      const result = await db.query(
        `INSERT INTO notifications (user_id, type, title, message, link, metadata)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [userId, type, title, message, link || null, metadata || null]
      )

      res.status(201).json(result.rows[0])

    } catch (error) {
      console.error('Error creando notificación:', error)
      res.status(500).json({ error: 'Error creando notificación' })
    }

  } else if (req.method === 'PUT') {
    // Actualizar preferencias de notificaciones
    try {
      const { notifications_enabled, notification_preferences } = req.body

      // Validar tipos
      const validEnabled = validateBoolean(notifications_enabled);
      if (notifications_enabled !== undefined && validEnabled === null) {
        return res.status(400).json({ error: 'notifications_enabled debe ser un booleano' })
      }

      // Validar notification_preferences
      if (notification_preferences) {
        if (!validateJSON(notification_preferences, 5000)) {
          return res.status(400).json({ error: 'notification_preferences inválido' })
        }

        // Validar estructura esperada
        const allowedKeys = ['streak_reminders', 'ranking_updates', 'new_content', 'friend_activity', 'achievements'];
        const keys = Object.keys(notification_preferences);
        
        if (!keys.every(key => allowedKeys.includes(key))) {
          return res.status(400).json({ error: 'Preferencias de notificación inválidas' })
        }

        // Validar que todos los valores sean booleanos
        if (!Object.values(notification_preferences).every(val => typeof val === 'boolean')) {
          return res.status(400).json({ error: 'Todos los valores de preferencias deben ser booleanos' })
        }
      }

      let query = 'UPDATE users SET'
      let updates = []
      let params = []
      let paramCount = 1

      if (validEnabled !== null) {
        updates.push(` notifications_enabled = $${paramCount}`)
        params.push(validEnabled)
        paramCount++
        
        // Si activan notificaciones por primera vez, crear notificación de bienvenida
        if (validEnabled && !notificationsEnabled) {
          await db.query(
            `INSERT INTO notifications (user_id, type, title, message, link)
             VALUES ($1, 'system', '🎉 ¡Notificaciones activadas!', 'Ahora recibirás notificaciones sobre tu progreso, nuevos contenidos y más. Puedes personalizar tus preferencias en tu perfil.', '/profile')`,
            [userId]
          )
        }
      }

      if (notification_preferences) {
        updates.push(` notification_preferences = $${paramCount}`)
        params.push(JSON.stringify(notification_preferences))
        paramCount++
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No hay cambios para actualizar' })
      }

      query += updates.join(',') + ` WHERE id = $${paramCount} RETURNING notifications_enabled, notification_preferences`
      params.push(userId)

      const result = await db.query(query, params)

      res.status(200).json({
        success: true,
        ...result.rows[0]
      })

    } catch (error) {
      console.error('Error actualizando preferencias:', error)
      res.status(500).json({ error: 'Error actualizando preferencias' })
    }

  } else {
    res.status(405).json({ error: 'Método no permitido' })
  }
}
