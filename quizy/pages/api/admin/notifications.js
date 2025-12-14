import { Pool } from 'pg'
import { verifyToken } from '../../../lib/jwt'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
})

async function query(text, params) {
  const res = await pool.query(text, params)
  return res
}

export default async function handler(req, res) {
  // Verificar JWT token
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    return res.status(401).json({ error: 'No autorizado' })
  }

  const decoded = verifyToken(token)
  if (!decoded || !decoded.id) {
    return res.status(401).json({ error: 'Token inválido' })
  }

  // Verificar si es admin
  try {
    const adminCheck = await query(
      'SELECT is_admin FROM users WHERE id = $1',
      [decoded.id]
    )

    if (!adminCheck.rows[0]?.is_admin) {
      return res.status(403).json({ error: 'Acceso denegado. Solo administradores.' })
    }
  } catch (error) {
    console.error('Error checking admin status:', error)
    return res.status(500).json({ error: 'Error al verificar permisos' })
  }

  // GET - Listar notificaciones del admin (tipo 'admin_broadcast')
  if (req.method === 'GET') {
    try {
      const page = parseInt(req.query.page) || 1
      const limit = parseInt(req.query.limit) || 50
      const offset = (page - 1) * limit

      // Obtener notificaciones administrativas (agrupadas por título y mensaje)
      const result = await query(
        `SELECT 
          MIN(id) as id,
          type,
          title,
          message,
          link,
          metadata,
          MIN(created_at) as created_at,
          COUNT(*) as recipients_count
        FROM notifications 
        WHERE type = 'admin_broadcast'
        GROUP BY type, title, message, link, metadata
        ORDER BY MIN(created_at) DESC 
        LIMIT $1 OFFSET $2`,
        [limit, offset]
      )

      const countResult = await query(
        `SELECT COUNT(DISTINCT (title, message)) as count 
         FROM notifications 
         WHERE type = 'admin_broadcast'`
      )
      const total = parseInt(countResult.rows[0].count)

      return res.status(200).json({
        notifications: result.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      })
    } catch (error) {
      console.error('Error fetching admin notifications:', error)
      return res.status(500).json({ error: 'Error al obtener notificaciones' })
    }
  }

  // POST - Crear notificación para todos los usuarios
  if (req.method === 'POST') {
    try {
      const { title, message, link } = req.body

      // Validaciones
      if (!title || !message) {
        return res.status(400).json({ error: 'Título y mensaje son requeridos' })
      }

      if (title.length > 255) {
        return res.status(400).json({ error: 'El título no puede exceder 255 caracteres' })
      }

      if (message.length > 5000) {
        return res.status(400).json({ error: 'El mensaje no puede exceder 5000 caracteres' })
      }

      // Obtener todos los usuarios con notificaciones habilitadas
      const usersResult = await query(
        'SELECT id FROM users WHERE notifications_enabled = true'
      )

      if (usersResult.rows.length === 0) {
        return res.status(400).json({ error: 'No hay usuarios con notificaciones habilitadas' })
      }

      // Crear notificación para cada usuario
      const metadata = JSON.stringify({ 
        admin_id: decoded.id,
        broadcast: true,
        created_at: new Date().toISOString()
      })

      // Insertar en batch para mejor rendimiento
      const values = usersResult.rows.map((user, index) => {
        const baseIndex = index * 6
        return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6})`
      }).join(', ')

      const params = usersResult.rows.flatMap(user => [
        user.id,
        'admin_broadcast',
        title.trim(),
        message.trim(),
        link || null,
        metadata
      ])

      await query(
        `INSERT INTO notifications (user_id, type, title, message, link, metadata)
         VALUES ${values}`,
        params
      )

      return res.status(201).json({
        success: true,
        message: `Notificación enviada a ${usersResult.rows.length} usuarios`,
        recipients_count: usersResult.rows.length
      })

    } catch (error) {
      console.error('Error creating admin notification:', error)
      return res.status(500).json({ error: 'Error al crear notificación' })
    }
  }

  // DELETE - Eliminar notificaciones broadcast por título y mensaje
  if (req.method === 'DELETE') {
    try {
      const { title, message } = req.body

      if (!title || !message) {
        return res.status(400).json({ error: 'Título y mensaje son requeridos para identificar la notificación' })
      }

      const result = await query(
        `DELETE FROM notifications 
         WHERE type = 'admin_broadcast' 
         AND title = $1 
         AND message = $2
         RETURNING id`,
        [title, message]
      )

      return res.status(200).json({
        success: true,
        message: `Eliminadas ${result.rowCount} notificaciones`,
        deleted_count: result.rowCount
      })

    } catch (error) {
      console.error('Error deleting admin notification:', error)
      return res.status(500).json({ error: 'Error al eliminar notificación' })
    }
  }

  return res.status(405).json({ error: 'Método no permitido' })
}
