import { Pool } from 'pg'
import { verifyToken } from '../../../lib/jwt'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
})

async function query(text, params) {
  const res = await pool.query(text, params)
  return res
}

export default async function handler(req, res) {
  // Verify JWT token for all methods
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    return res.status(401).json({ error: 'No autorizado' })
  }

  const decoded = verifyToken(token)
  if (!decoded || !decoded.id) {
    return res.status(401).json({ error: 'Token inválido' })
  }

  // Check if user is admin
  try {
    const adminCheck = await query(
      'SELECT is_admin FROM users WHERE id = $1',
      [decoded.id]
    )

    if (!adminCheck.rows[0]?.is_admin) {
      return res.status(403).json({ error: 'Acceso denegado. Solo administradores.' })
    }
  } catch (error) {
    console.error('Error checking admin status:', error)
    return res.status(500).json({ error: 'Error al verificar permisos' })
  }

  if (req.method === 'GET') {
    try {
      // Get all users with pagination
      const page = parseInt(req.query.page) || 1
      const limit = parseInt(req.query.limit) || 50
      const offset = (page - 1) * limit

      const result = await query(
        'SELECT id, name, email, created_at, is_admin FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2',
        [limit, offset]
      )

      const countResult = await query('SELECT COUNT(*) FROM users')
      const total = parseInt(countResult.rows[0].count)

      return res.status(200).json({ 
        users: result.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      })
    } catch (error) {
      console.error('Error fetching users:', error)
      return res.status(500).json({ error: 'Error al obtener usuarios' })
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { userId } = req.body

      if (!userId) {
        return res.status(400).json({ error: 'userId es requerido' })
      }

      // Don't allow deleting admin user
      const userToDelete = await query(
        'SELECT is_admin FROM users WHERE id = $1',
        [userId]
      )

      if (userToDelete.rows[0]?.is_admin) {
        return res.status(403).json({ error: 'No se puede eliminar un usuario administrador' })
      }

      // Delete user's attempts first (cascade)
      await query('DELETE FROM attempts WHERE user_name = (SELECT name FROM users WHERE id = $1)', [userId])

      // Delete user
      await query('DELETE FROM users WHERE id = $1', [userId])

      return res.status(200).json({ message: 'Usuario eliminado correctamente' })
    } catch (error) {
      console.error('Error deleting user:', error)
      return res.status(500).json({ error: 'Error al eliminar usuario' })
    }
  }

  if (req.method === 'PATCH') {
    try {
      const { userId, is_admin } = req.body

      if (!userId || is_admin === undefined) {
        return res.status(400).json({ error: 'userId y is_admin son requeridos' })
      }

      // Update user role
      await query('UPDATE users SET is_admin = $1 WHERE id = $2', [is_admin, userId])

      return res.status(200).json({ message: 'Rol actualizado correctamente' })
    } catch (error) {
      console.error('Error updating user role:', error)
      return res.status(500).json({ error: 'Error al actualizar rol' })
    }
  }

  if (req.method === 'PUT') {
    try {
      const { userId, newName } = req.body

      if (!userId || !newName) {
        return res.status(400).json({ error: 'userId y newName son requeridos' })
      }

      // Check if new name already exists
      const nameCheck = await query(
        'SELECT id FROM users WHERE name = $1 AND id != $2',
        [newName, userId]
      )

      if (nameCheck.rows.length > 0) {
        return res.status(400).json({ error: 'El nombre de usuario ya existe' })
      }

      // Get old username for updating attempts
      const oldUserResult = await query('SELECT name FROM users WHERE id = $1', [userId])
      const oldName = oldUserResult.rows[0]?.name

      // Update username
      await query('UPDATE users SET name = $1 WHERE id = $2', [newName, userId])

      // Update user_name in attempts table
      if (oldName) {
        await query('UPDATE attempts SET user_name = $1 WHERE user_name = $2', [newName, oldName])
      }

      return res.status(200).json({ message: 'Usuario actualizado correctamente' })
    } catch (error) {
      console.error('Error updating user:', error)
      return res.status(500).json({ error: 'Error al actualizar usuario' })
    }
  }

  return res.status(405).json({ error: 'Método no permitido' })
}
