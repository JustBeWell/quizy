import bcrypt from 'bcryptjs'
import { query } from '../../lib/db'
import { verifyToken } from '../../lib/jwt'
import { applyRateLimit } from '../../lib/rate-limit'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Aplicar rate limiting (5 intentos por 15 minutos)
  const rateLimitResult = await applyRateLimit('change-password', req, res, 5)
  if (rateLimitResult) return rateLimitResult

  const { currentPassword, newPassword } = req.body

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Contraseña actual y nueva son requeridas' })
  }

  // Validar fortaleza de la nueva contraseña
  if (newPassword.length < 8) {
    return res.status(400).json({ 
      error: 'La nueva contraseña debe tener al menos 8 caracteres' 
    })
  }

  // Validar que tenga letras y números
  const hasNumber = /\d/.test(newPassword)
  const hasLetter = /[a-zA-Z]/.test(newPassword)
  
  if (!hasNumber || !hasLetter) {
    return res.status(400).json({ 
      error: 'La contraseña debe contener letras y números' 
    })
  }

  try {
    // Obtener el token JWT del header
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No autenticado' })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    
    if (!decoded || !decoded.userId) {
      return res.status(401).json({ error: 'Token inválido' })
    }

    const userId = decoded.userId

    // Buscar el usuario en la base de datos
    const userResult = await query(
      'SELECT id, name, password_hash FROM users WHERE id = $1',
      [userId]
    )

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    const user = userResult.rows[0]

    // Verificar que el usuario tenga una contraseña establecida
    if (!user.password_hash) {
      return res.status(400).json({ 
        error: 'Este usuario no tiene contraseña establecida. Por favor, usa el sistema de recuperación de contraseña.' 
      })
    }

    // Verificar que la contraseña actual sea correcta
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash)
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'La contraseña actual es incorrecta' })
    }

    // Verificar que la nueva contraseña sea diferente a la actual
    const isSamePassword = await bcrypt.compare(newPassword, user.password_hash)
    
    if (isSamePassword) {
      return res.status(400).json({ 
        error: 'La nueva contraseña debe ser diferente a la actual' 
      })
    }

    // Hashear la nueva contraseña
    const saltRounds = 10
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds)

    // Actualizar la contraseña en la base de datos
    await query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [newPasswordHash, userId]
    )

    // Log de auditoría (opcional)
    console.log(`✓ Contraseña cambiada para usuario: ${user.name} (ID: ${userId})`)

    return res.status(200).json({ 
      message: 'Contraseña actualizada correctamente',
      userName: user.name
    })

  } catch (error) {
    console.error('Error en change-password:', error)
    
    // Si es error de JWT, responder con 401
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Sesión inválida o expirada' })
    }
    
    return res.status(500).json({ error: 'Error al cambiar la contraseña' })
  }
}
