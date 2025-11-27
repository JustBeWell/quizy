import { verifyToken } from '../../../lib/jwt'
import db from '../../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'PUT') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

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
  
  // Verificar que el usuario existe
  const userResult = await db.query(
    'SELECT id FROM users WHERE id = $1',
    [userId]
  )

  if (userResult.rows.length === 0) {
    return res.status(404).json({ error: 'Usuario no encontrado' })
  }

  try {
    const { notification_id, mark_all } = req.body

    if (mark_all) {
      // Marcar todas como leídas
      await db.query(
        `UPDATE notifications 
         SET is_read = TRUE, read_at = CURRENT_TIMESTAMP 
         WHERE user_id = $1 AND is_read = FALSE`,
        [userId]
      )

      res.status(200).json({ 
        success: true, 
        message: 'Todas las notificaciones marcadas como leídas' 
      })

    } else if (notification_id) {
      // Marcar una específica como leída
      const result = await db.query(
        `UPDATE notifications 
         SET is_read = TRUE, read_at = CURRENT_TIMESTAMP 
         WHERE id = $1 AND user_id = $2 
         RETURNING *`,
        [notification_id, userId]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Notificación no encontrada' })
      }

      res.status(200).json({ 
        success: true, 
        notification: result.rows[0] 
      })

    } else {
      res.status(400).json({ error: 'Se requiere notification_id o mark_all' })
    }

  } catch (error) {
    console.error('Error marcando notificación como leída:', error)
    res.status(500).json({ error: 'Error actualizando notificación' })
  }
}
