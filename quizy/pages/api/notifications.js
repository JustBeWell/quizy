import { verifyToken } from '../../lib/jwt'
import db from '../../lib/db'

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

  const username = decoded.username

  // Obtener user_id
  const userResult = await db.query(
    'SELECT id, notifications_enabled FROM users WHERE name = $1',
    [username]
  )

  if (userResult.rows.length === 0) {
    return res.status(404).json({ error: 'Usuario no encontrado' })
  }

  const userId = userResult.rows[0].id
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
      const { type, title, message, link, metadata } = req.body

      if (!type || !title || !message) {
        return res.status(400).json({ error: 'Faltan campos requeridos' })
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

      let query = 'UPDATE users SET'
      let updates = []
      let params = []
      let paramCount = 1

      if (typeof notifications_enabled === 'boolean') {
        updates.push(` notifications_enabled = $${paramCount}`)
        params.push(notifications_enabled)
        paramCount++
        
        // Si activan notificaciones por primera vez, crear notificación de bienvenida
        if (notifications_enabled && !notificationsEnabled) {
          await db.query(
            `INSERT INTO notifications (user_id, type, title, message, link)
             VALUES ($1, 'system', '🎉 ¡Notificaciones activadas!', 'Ahora recibirás notificaciones sobre tu progreso, nuevos contenidos y más. Puedes personalizar tus preferencias en tu perfil.', '/profile')`,
            [userId]
          )
        }
      }

      if (notification_preferences && typeof notification_preferences === 'object') {
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
