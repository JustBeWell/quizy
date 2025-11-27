import bcrypt from 'bcryptjs'
import { query } from '../../lib/db'
import { validatePassword } from '../../lib/input-validation'
import { applyRateLimit } from '../../lib/rate-limit';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Aplicar rate limiting (5 intentos por 15 minutos)
  const rateLimitResult = await applyRateLimit('reset-password', req, res, 5);
  if (rateLimitResult) return rateLimitResult;

  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token y nueva contraseña son requeridos' });
  }

  // Validar fortaleza de la contraseña
  const passwordValidation = validatePassword(newPassword);
  if (!passwordValidation.valid) {
    return res.status(400).json({ 
      error: passwordValidation.errors[0] || 'Contraseña inválida'
    });
  }

  try {
    // Buscar el token en la base de datos
    const tokenResult = await query(
      `SELECT prt.id, prt.user_id, prt.expires_at, prt.used, u.name, u.email, u.password_hash
       FROM password_reset_tokens prt
       JOIN users u ON prt.user_id = u.id
       WHERE prt.token = $1`,
      [token]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({ error: 'Token inválido o expirado' });
    }

    const tokenData = tokenResult.rows[0];

    // Verificar si el token ya fue usado
    if (tokenData.used) {
      return res.status(400).json({ error: 'Este enlace ya fue utilizado' });
    }

    // Verificar si el token expiró
    if (new Date() > new Date(tokenData.expires_at)) {
      return res.status(400).json({ error: 'Este enlace ha expirado' });
    }

    // Verificar que la nueva contraseña sea diferente a la anterior
    if (tokenData.password_hash) {
      const isSamePassword = await bcrypt.compare(newPassword, tokenData.password_hash);
      if (isSamePassword) {
        return res.status(400).json({ 
          error: 'La nueva contraseña debe ser diferente a la anterior' 
        });
      }
    }

    // Hashear la nueva contraseña
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Actualizar la contraseña del usuario
    await query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [passwordHash, tokenData.user_id]
    );

    // Marcar el token como usado
    await query(
      'UPDATE password_reset_tokens SET used = TRUE WHERE id = $1',
      [tokenData.id]
    );

    // Invalidar todos los demás tokens del usuario
    await query(
      'UPDATE password_reset_tokens SET used = TRUE WHERE user_id = $1 AND id != $2',
      [tokenData.user_id, tokenData.id]
    );

    return res.status(200).json({ 
      message: 'Contraseña actualizada correctamente',
      userName: tokenData.name
    });

  } catch (error) {
    console.error('Error en reset-password:', error);
    return res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
}
