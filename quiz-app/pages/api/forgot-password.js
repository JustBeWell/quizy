import crypto from 'crypto';
import { query } from '../../lib/db';
import { sendPasswordResetEmail } from '../../lib/email';
import { applyRateLimit } from '../../lib/rate-limit';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Aplicar rate limiting (3 intentos por 15 minutos)
  const rateLimitResult = await applyRateLimit('forgot-password', req, res, 3);
  if (rateLimitResult) return rateLimitResult;

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'El email es requerido' });
  }

  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Formato de email inválido' });
  }

  try {
    // Buscar usuario por email
    const userResult = await query(
      'SELECT id, name, email FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    // Por seguridad, siempre responder con éxito aunque el email no exista
    // Esto previene que alguien pueda enumerar usuarios válidos
    if (userResult.rows.length === 0) {
      return res.status(200).json({ 
        message: 'Si el email existe en nuestro sistema, recibirás un enlace de recuperación' 
      });
    }

    const user = userResult.rows[0];

    // Generar token seguro
    const token = crypto.randomBytes(32).toString('hex');
    
    // El token expira en 1 hora
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Invalidar tokens anteriores del usuario (marcarlos como usados)
    await query(
      'UPDATE password_reset_tokens SET used = TRUE WHERE user_id = $1 AND used = FALSE',
      [user.id]
    );

    // Guardar el nuevo token en la base de datos
    await query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, token, expiresAt]
    );

    // Crear URL de reseteo
    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

    // Enviar email
    const emailSent = await sendPasswordResetEmail(user.email, user.name, resetUrl);

    if (!emailSent) {
      console.error('Error al enviar email de recuperación');
      return res.status(500).json({ 
        error: 'Error al enviar el email. Por favor, contacta con soporte.' 
      });
    }

    return res.status(200).json({ 
      message: 'Si el email existe en nuestro sistema, recibirás un enlace de recuperación' 
    });

  } catch (error) {
    console.error('Error en forgot-password:', error);
    return res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
}
