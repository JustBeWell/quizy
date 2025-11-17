import { query } from '../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Obtener top 5 usuarios con mejores rachas actuales
    // Incluir usuarios con racha 0 pero que tengan récord histórico
    // Excluir al usuario admin
    const result = await query(
      `SELECT 
        u.id,
        u.name,
        u.current_streak,
        u.longest_streak,
        u.last_login_date
       FROM users u
       WHERE (u.longest_streak > 0 OR u.current_streak > 0)
         AND u.name != 'admin'
       ORDER BY u.current_streak DESC, u.longest_streak DESC
       LIMIT 5`,
      []
    )

    const ranking = result.rows.map((row, index) => ({
      position: index + 1,
      name: row.name,
      currentStreak: row.current_streak,
      longestStreak: row.longest_streak,
      lastLoginDate: row.last_login_date
    }))

    return res.status(200).json({ ranking })

  } catch (error) {
    console.error('Error in streak-ranking API:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
