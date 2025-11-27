import { query } from '../../../lib/db';
import { verifyToken } from '../../../lib/jwt';

/**
 * Endpoint para verificar la sesión actual del usuario
 * GET /api/auth/verify
 * Requiere: Authorization Bearer token
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verificar JWT token
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Token requerido' });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) {
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }

    // Buscar usuario en la base de datos para obtener información actualizada
    const result = await query(
      'SELECT id, name, email, is_admin, created_at FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = result.rows[0];

    // Devolver información del usuario
    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        is_admin: user.is_admin || false,
        created_at: user.created_at
      }
    });

  } catch (error) {
    console.error('Error verificando sesión:', error);
    return res.status(500).json({ error: 'Error al verificar sesión' });
  }
}
