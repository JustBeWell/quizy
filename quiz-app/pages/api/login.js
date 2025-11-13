import bcrypt from 'bcryptjs';
import { query } from '../../lib/db';
import { generateToken } from '../../lib/jwt';
import { applyRateLimit } from '../../lib/rate-limit';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Aplicar rate limiting (5 intentos por 15 minutos)
  const rateLimitResult = await applyRateLimit('login', req, res);
  if (rateLimitResult) return rateLimitResult;

  const { name, password } = req.body;

  if (!name || !password) {
    return res.status(400).json({ error: 'Nombre y contraseña son requeridos' });
  }

  try {
    // Buscar usuario en la base de datos
    const result = await query(
      'SELECT id, name, email, password_hash, is_admin, created_at FROM users WHERE name = $1',
      [name]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    const user = result.rows[0];

    // Si el usuario no tiene contraseña (cuenta antigua), indicar que debe migrar
    if (!user.password_hash) {
      return res.status(403).json({ 
        error: 'legacy_user',
        message: 'Esta cuenta fue creada antes del sistema de contraseñas. Por favor, establece una contraseña para continuar.',
        userId: user.id,
        userName: user.name
      });
    }

    // Verificar contraseña
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    // Actualizar last_seen
    await query(
      'UPDATE users SET last_seen = NOW() WHERE id = $1',
      [user.id]
    );

    // Generar JWT token
    const token = generateToken({
      id: user.id,
      name: user.name,
      email: user.email,
      is_admin: user.is_admin || false
    });

    // Devolver datos del usuario con el token JWT
    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        is_admin: user.is_admin || false,
        created_at: user.created_at
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ error: 'Error al iniciar sesión' });
  }
}
