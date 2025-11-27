import { query } from '../../lib/db'
import { verifyToken } from '../../lib/jwt'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Get all subjects with optional search and level filter
    try {
      const { search, level } = req.query
      let sql = `
        SELECT s.id, s.name, s.slug, s.description, s.created_at, 
               s.level_id, al.name as level_name, al.slug as level_slug
        FROM subjects s
        LEFT JOIN academic_levels al ON s.level_id = al.id
        WHERE 1=1
      `
      let params = []
      let paramIndex = 1
      
      if (level) {
        sql += ` AND al.slug = $${paramIndex}`
        params.push(level)
        paramIndex++
      }
      
      if (search) {
        // Escapar wildcards para prevenir búsquedas maliciosas
        const sanitizedSearch = search.replace(/[%_]/g, '\\$&')
        sql += ` AND (s.name ILIKE $${paramIndex} OR s.description ILIKE $${paramIndex})`
        params.push(`%${sanitizedSearch}%`)
      }
      
      sql += ' ORDER BY s.name ASC'
      
      const result = await query(sql, params)
      return res.status(200).json({ subjects: result.rows })
    } catch (error) {
      console.error('Error fetching subjects:', error)
      return res.status(500).json({ error: 'Error fetching subjects', details: error.message })
    }
  }

  if (req.method === 'POST') {
    // Create new subject (admin only)
    try {
      const { name, slug, description } = req.body

      if (!name || !slug) {
        return res.status(400).json({ error: 'Name and slug are required' })
      }

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

      // Create subject
      const result = await query(
        'INSERT INTO subjects (name, slug, description, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
        [name, slug, description || null, user.id]
      )

      return res.status(201).json({ subject: result.rows[0] })
    } catch (error) {
      console.error('Error creating subject:', error)
      if (error.code === '23505') { // Unique constraint violation
        return res.status(400).json({ error: 'Subject with this slug already exists' })
      }
      return res.status(500).json({ error: 'Error creating subject', details: error.message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
