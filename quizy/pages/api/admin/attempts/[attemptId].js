import db from '../../../../lib/db'

export default async function handler(req, res) {
  const { attemptId } = req.query

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get username from query params or body
    const username = req.query.username || req.body?.username

    if (!username) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    // Check if user is admin
    const userResult = await db.query('SELECT id, is_admin FROM users WHERE name = $1', [username])
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
