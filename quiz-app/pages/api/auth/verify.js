import { query } from '../../../lib/db';

/**
 * Endpoint para verificar si un usuario es administrador
 * GET /api/auth/verify?username=nombre
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: 'Username es requerido' });
  }

  try {
    // Buscar usuario en la base de datos
    const result = await query(
      'SELECT id, name, is_admin, created_at FROM users WHERE name = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = result.rows[0];

    // Devolver información del usuario (sin contraseña)
    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        is_admin: user.is_admin || false,
        created_at: user.created_at
      }
    });

  } catch (error) {
    console.error('Error verificando usuario:', error);
    return res.status(500).json({ error: 'Error al verificar usuario' });
  }
}
