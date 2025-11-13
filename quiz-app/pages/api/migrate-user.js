import bcrypt from 'bcryptjs';
import { query } from '../../lib/db';
import { generateToken } from '../../lib/jwt';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, userName, password } = req.body;

  if (!userId || !userName || !password) {
    return res.status(400).json({ error: 'Datos incompletos' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }

  try {
    // Verificar que el usuario existe y no tiene contraseña
    const result = await query(
      'SELECT id, name, password_hash FROM users WHERE id = $1 AND name = $2',
      [userId, userName]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = result.rows[0];

    if (user.password_hash) {
      return res.status(400).json({ error: 'Este usuario ya tiene contraseña' });
    }

    // Hashear la nueva contraseña
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Actualizar la contraseña
    await query(
      'UPDATE users SET password_hash = $1, last_seen = NOW() WHERE id = $2',
      [passwordHash, userId]
    );

    // Obtener usuario actualizado con is_admin
    const updatedUser = await query(
      'SELECT id, name, email, is_admin, created_at FROM users WHERE id = $1',
      [userId]
    );

    const userData = updatedUser.rows[0];

    // Generar JWT token
    const token = generateToken({
      id: userData.id,
      name: userData.name,
      email: userData.email,
      is_admin: userData.is_admin || false
    });

    return res.status(200).json({ 
      success: true,
      token,
      user: userData,
      message: 'Contraseña establecida correctamente'
    });

  } catch (error) {
    console.error('Error al migrar usuario:', error);
    return res.status(500).json({ error: 'Error al establecer contraseña' });
  }
}
