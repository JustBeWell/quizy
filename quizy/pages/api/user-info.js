import { query } from '../../lib/db'
import { verifyToken } from '../../lib/jwt'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  const authHeader = req.headers.authorization
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('[user-info] No authorization header')
    return res.status(401).json({ error: 'No autorizado' })
  }

  const token = authHeader.substring(7)
  const decoded = verifyToken(token)
  
  if (!decoded) {
    console.log('[user-info] Token verification failed')
    return res.status(401).json({ error: 'Token inválido' })
  }
  
  console.log('[user-info] Token decoded successfully, user ID:', decoded.id)

  try {
    const result = await query(
      'SELECT id, name, email, email_verified, is_admin, created_at, notifications_enabled, notification_preferences FROM users WHERE id = $1',
      [decoded.id]
    )

    if (result.rows.length === 0) {
      console.log('[user-info] User not found in database:', decoded.id)
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }
    
    console.log('[user-info] User found:', result.rows[0].name)

    return res.status(200).json(result.rows[0])

  } catch (error) {
    console.error('[user-info] Database error:', error)
    return res.status(500).json({ error: 'Error al obtener información del usuario' })
  }
}
