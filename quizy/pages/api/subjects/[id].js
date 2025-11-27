import { query } from '../../../lib/db'
import { verifyToken } from '../../../lib/jwt'

export default async function handler(req, res) {
  const { id } = req.query

  // Validar que el ID sea un número entero válido
  const numericId = parseInt(id, 10)
  if (isNaN(numericId) || numericId < 1) {
    return res.status(400).json({ error: 'Invalid subject ID' })
  }

  if (req.method === 'GET') {
    // Get single subject
    try {
      const result = await query(
        'SELECT id, name, slug, description, created_at FROM subjects WHERE id = $1',
        [numericId]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Subject not found' })
      }

      return res.status(200).json({ subject: result.rows[0] })
    } catch (error) {
      console.error('Error fetching subject:', error)
      return res.status(500).json({ error: 'Error fetching subject', details: error.message })
    }
  }

  if (req.method === 'PUT') {
    // Update subject (admin only)
    try {
      const { name, slug, description } = req.body

      // Verify JWT token
      const token = req.headers.authorization?.replace('Bearer ', '')
      if (!token) {
        return res.status(401).json({ error: 'Authentication required' })
      }

      const decoded = verifyToken(token)
      if (!decoded || !decoded.id) {
        return res.status(401).json({ error: 'Invalid token' })
      }

      // Check if user is admin
      const userResult = await query('SELECT id, is_admin FROM users WHERE id = $1', [decoded.id])
      if (userResult.rows.length === 0) {
        return res.status(401).json({ error: 'User not found' })
      }

      const user = userResult.rows[0]
      if (!user.is_admin) {
        return res.status(403).json({ error: 'Admin access required' })
      }

      // Update subject
      const result = await query(
        'UPDATE subjects SET name = COALESCE($1, name), slug = COALESCE($2, slug), description = COALESCE($3, description) WHERE id = $4 RETURNING *',
        [name, slug, description, numericId]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Subject not found' })
      }

      return res.status(200).json({ subject: result.rows[0] })
    } catch (error) {
      console.error('Error updating subject:', error)
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Subject with this slug already exists' })
      }
      return res.status(500).json({ error: 'Error updating subject', details: error.message })
    }
  }

  if (req.method === 'DELETE') {
    // Delete subject (admin only)
    try {
      // Verify JWT token
      const token = req.headers.authorization?.replace('Bearer ', '')
      if (!token) {
        return res.status(401).json({ error: 'Authentication required' })
      }

      const decoded = verifyToken(token)
      if (!decoded || !decoded.id) {
        return res.status(401).json({ error: 'Invalid token' })
      }

      // Check if user is admin
      const userResult = await query('SELECT id, is_admin FROM users WHERE id = $1', [decoded.id])
      if (userResult.rows.length === 0) {
        return res.status(401).json({ error: 'User not found' })
      }

      const user = userResult.rows[0]
      if (!user.is_admin) {
        return res.status(403).json({ error: 'Admin access required' })
      }

      // Delete subject
      const result = await query('DELETE FROM subjects WHERE id = $1 RETURNING *', [numericId])

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Subject not found' })
      }

      return res.status(200).json({ message: 'Subject deleted', subject: result.rows[0] })
    } catch (error) {
      console.error('Error deleting subject:', error)
      return res.status(500).json({ error: 'Error deleting subject', details: error.message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
