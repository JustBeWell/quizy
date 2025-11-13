/**
 * API endpoint to get all academic levels with their subjects count
 * GET /api/levels
 */

import { query } from '../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const sql = `
      SELECT 
        al.id,
        al.name,
        al.slug,
        al.description,
        al.display_order,
        COUNT(DISTINCT s.id) as subject_count,
        COUNT(DISTINCT qb.id) as test_count
      FROM academic_levels al
      LEFT JOIN subjects s ON al.id = s.level_id
      LEFT JOIN question_banks qb ON s.id = qb.subject_id AND qb.is_active = true
      WHERE al.is_active = true
      GROUP BY al.id, al.name, al.slug, al.description, al.display_order
      ORDER BY al.display_order ASC
    `

    const result = await query(sql)

    const levels = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      displayOrder: row.display_order,
      subjectCount: parseInt(row.subject_count) || 0,
      testCount: parseInt(row.test_count) || 0
    }))

    return res.status(200).json({ levels })
  } catch (error) {
    console.error('Error fetching academic levels:', error)
    return res.status(500).json({ error: 'Error al obtener niveles académicos' })
  }
}
