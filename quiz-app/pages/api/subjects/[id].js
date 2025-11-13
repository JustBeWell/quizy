import { query } from '../../../lib/db'

export default async function handler(req, res) {
  const { id } = req.query

  // Validar que el ID sea un número entero válido
  const numericId = parseInt(id, 10)
  if (isNaN(numericId) || numericId < 1) {
    return res.status(400).json({ message: 'Invalid subject ID' })
  }

  if (req.method === 'GET') {
    // Get single subject
    try {
      const result = await query(
        'SELECT id, name, slug, description, created_at FROM subjects WHERE id = $1',
        [numericId]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Subject not found' })
      }

      return res.status(200).json({ subject: result.rows[0] })
    } catch (error) {
      console.error('Error fetching subject:', error)
      return res.status(500).json({ message: 'Error fetching subject', error: error.message })
    }
  }

  if (req.method === 'PUT') {
    // Update subject (admin only)
    try {
      const { name, slug, description, username } = req.body

      if (!username) {
        return res.status(401).json({ message: 'Authentication required' })
      }

      // Check if user is admin
      const userResult = await query('SELECT id, is_admin FROM users WHERE name = $1', [username])
      if (userResult.rows.length === 0) {
        return res.status(401).json({ message: 'User not found' })
      }

      const user = userResult.rows[0]
      if (!user.is_admin) {
        return res.status(403).json({ message: 'Admin access required' })
      }

      // Update subject
      const result = await query(
        'UPDATE subjects SET name = COALESCE($1, name), slug = COALESCE($2, slug), description = COALESCE($3, description) WHERE id = $4 RETURNING *',
        [name, slug, description, numericId]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Subject not found' })
      }

      return res.status(200).json({ subject: result.rows[0] })
    } catch (error) {
      console.error('Error updating subject:', error)
      if (error.code === '23505') {
        return res.status(400).json({ message: 'Subject with this slug already exists' })
      }
      return res.status(500).json({ message: 'Error updating subject', error: error.message })
    }
  }

  if (req.method === 'DELETE') {
    // Delete subject (admin only)
    try {
      const { username } = req.body

      if (!username) {
        return res.status(401).json({ message: 'Authentication required' })
      }

      // Check if user is admin
      const userResult = await query('SELECT id, is_admin FROM users WHERE name = $1', [username])
      if (userResult.rows.length === 0) {
        return res.status(401).json({ message: 'User not found' })
      }

      const user = userResult.rows[0]
      if (!user.is_admin) {
        return res.status(403).json({ message: 'Admin access required' })
      }

      // Delete subject
      const result = await query('DELETE FROM subjects WHERE id = $1 RETURNING *', [numericId])

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Subject not found' })
      }

      return res.status(200).json({ message: 'Subject deleted', subject: result.rows[0] })
    } catch (error) {
      console.error('Error deleting subject:', error)
      return res.status(500).json({ message: 'Error deleting subject', error: error.message })
    }
  }

  return res.status(405).json({ message: 'Method not allowed' })
}
