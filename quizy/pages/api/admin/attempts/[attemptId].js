import db from '../../../../lib/db'
import { verifyToken } from '../../../../lib/jwt'

export default async function handler(req, res) {
  const { attemptId } = req.query

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

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
    const userResult = await db.query('SELECT id, is_admin FROM users WHERE id = $1', [decoded.id])
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' })
    }

    const user = userResult.rows[0]
    if (!user.is_admin) {
      return res.status(403).json({ error: 'Admin access required' })
    }

    // Delete attempt
    const result = await db.query('DELETE FROM attempts WHERE id = $1 RETURNING *', [attemptId])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Attempt not found' })
    }

    return res.status(200).json({ message: 'Attempt deleted successfully' })
  } catch (error) {
    console.error('Error deleting attempt:', error)
    return res.status(500).json({ error: 'Error deleting attempt', details: error.message })
  }
}
