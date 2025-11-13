import crypto from 'crypto'
import { query } from '../../../lib/db'
import { verifyToken } from '../../../lib/jwt'
import { sendVerificationEmail } from '../../../lib/email'

export default async function handler(req, res) {
  if (req.method === 'POST') {
    return handleSendVerification(req, res)
  } else if (req.method === 'GET') {
    return handleVerifyEmail(req, res)
  }
  
  return res.status(405).json({ error: 'Método no permitido' })
}

// POST - Enviar email de verificación
async function handleSendVerification(req, res) {
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
    // Verificar que el usuario existe y obtener su email
    const userResult = await query(
      'SELECT id, email, email_verified FROM users WHERE id = $1',
      [decoded.id]
    )

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    const user = userResult.rows[0]

    if (user.email_verified) {
      return res.status(400).json({ error: 'El email ya está verificado' })
    }

    if (!user.email) {
      return res.status(400).json({ error: 'No hay email asociado a esta cuenta' })
    }

    // Generar token de verificación
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas

    // Guardar token en la base de datos
    await query(
      `UPDATE users 
       SET verification_token = $1, verification_token_expires = $2 
       WHERE id = $3`,
      [verificationToken, expiresAt, decoded.id]
    )

    // Generar URL de verificación
    // Obtener la URL base desde las headers del request o usar variable de entorno
    const protocol = req.headers['x-forwarded-proto'] || 'http'
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000'
    const baseUrl = `${protocol}://${host}`
    
    const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${verificationToken}`

    // Intentar enviar el email
    const emailSent = await sendVerificationEmail(user.email, decoded.name, verificationUrl)

    if (emailSent) {
      return res.status(200).json({ 
        success: true, 
        message: 'Email de verificación enviado. Revisa tu bandeja de entrada.',
      })
    } else {
      // Si no se pudo enviar (por falta de configuración), devolver el link en desarrollo
      console.log('⚠️ Email no enviado. Verification URL:', verificationUrl)
      
      return res.status(200).json({ 
        success: true, 
        message: 'Token de verificación generado',
        warning: 'Email no configurado. Usa el link de la consola.',
        // En desarrollo, devolvemos el link
        ...(process.env.NODE_ENV === 'development' && { verificationUrl })
      })
    }

  } catch (error) {
    console.error('Error sending verification email:', error)
    return res.status(500).json({ error: 'Error al enviar email de verificación' })
  }
}

// GET - Verificar email con token
async function handleVerifyEmail(req, res) {
  const { token } = req.query

  if (!token) {
    // Si se accede sin token desde el navegador, redirigir a la página de verificación
    return res.redirect('/verify-email')
  }

  try {
    // Buscar usuario con este token
    const result = await query(
      `SELECT id, email, verification_token_expires 
       FROM users 
       WHERE verification_token = $1`,
      [token]
    )

    if (result.rows.length === 0) {
      // Redirigir con error
      return res.redirect('/verify-email?error=invalid_token')
    }

    const user = result.rows[0]

    // Verificar que el token no ha expirado
    if (new Date() > new Date(user.verification_token_expires)) {
      return res.redirect('/verify-email?error=expired_token')
    }

    // Marcar email como verificado
    await query(
      `UPDATE users 
       SET email_verified = true, 
           verification_token = NULL, 
           verification_token_expires = NULL 
       WHERE id = $1`,
      [user.id]
    )

    // Redirigir con éxito
    return res.redirect('/verify-email?success=true')

  } catch (error) {
    console.error('Error verifying email:', error)
    return res.redirect('/verify-email?error=server_error')
  }
}
