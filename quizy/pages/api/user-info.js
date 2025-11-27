import { query } from '../../lib/db'
import { verifyToken } from '../../lib/jwt'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  const authHeader = req.headers.authorization
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado' })
  }

  const token = authHeader.substring(7)
  const decoded = verifyToken(token)
  
  if (!decoded) {
    return res.status(401).json({ error: 'Token inválido' })
  }

  try {
    const result = await query(
      'SELECT id, name, email, email_verified, is_admin, created_at, notifications_enabled, notification_preferences FROM users WHERE id = $1',
      [decoded.id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    return res.status(200).json(result.rows[0])

  } catch (error) {
    console.error('Error getting user info:', error)
    return res.status(500).json({ error: 'Error al obtener información del usuario' })
  }
}
