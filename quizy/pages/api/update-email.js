import { query } from '../../lib/db'
import { verifyToken, generateToken } from '../../lib/jwt'

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
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

  const { email } = req.body

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'El email es requerido' })
  }

  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const trimmedEmail = email.trim().toLowerCase()
  
  if (!emailRegex.test(trimmedEmail)) {
    return res.status(400).json({ error: 'Por favor ingresa un email válido' })
  }

  try {
    // Verificar que el email no esté en uso por otro usuario
    const checkResult = await query(
      'SELECT id FROM users WHERE email = $1 AND id != $2',
      [trimmedEmail, decoded.id]
    )

    if (checkResult.rows.length > 0) {
      return res.status(409).json({ error: 'Este email ya está en uso por otro usuario' })
    }

    // Actualizar email y marcar como no verificado
    const result = await query(
      `UPDATE users 
       SET email = $1, 
           email_verified = false,
           verification_token = NULL,
           verification_token_expires = NULL
       WHERE id = $2
       RETURNING id, name, email, is_admin, email_verified, created_at`,
      [trimmedEmail, decoded.id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    const user = result.rows[0]

    // Generar nuevo token JWT con el email actualizado
    const newToken = generateToken({
      id: user.id,
      name: user.name,
      email: user.email,
      is_admin: user.is_admin || false
    })

    return res.status(200).json({
      success: true,
      message: 'Email actualizado correctamente. Por favor verifica tu nuevo email.',
      token: newToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        email_verified: user.email_verified,
        is_admin: user.is_admin,
        created_at: user.created_at
      }
    })

  } catch (error) {
    console.error('Error updating email:', error)
    return res.status(500).json({ error: 'Error al actualizar email' })
  }
}
