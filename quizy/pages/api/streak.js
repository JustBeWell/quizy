import { query } from '../../lib/db'
import { verifyToken } from '../../lib/jwt'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('[Streak API] Request received')
    
    // Verify JWT token
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('[Streak API] No token provided')
      return res.status(401).json({ error: 'No token provided' })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    
    if (!decoded) {
      console.log('[Streak API] Invalid token')
      return res.status(401).json({ error: 'Invalid token' })
    }

    const userId = decoded.id
    console.log('[Streak API] User ID:', userId)

    // Record today's login
    const today = new Date().toISOString().split('T')[0]
    console.log('[Streak API] Today:', today)
    
    // Insert today's login (ignore if already exists)
    await query(
      `INSERT INTO daily_logins (user_id, login_date)
       VALUES ($1, $2)
       ON CONFLICT (user_id, login_date) DO NOTHING`,
      [userId, today]
    )
    console.log('[Streak API] Login recorded')

    // Calculate current streak
    const streakResult = await query(
      `WITH RECURSIVE streak_dates AS (
        -- Start from today
        SELECT 
          $2::date AS login_date,
          0 AS days_back
        
        UNION ALL
        
        -- Go back one day at a time
        SELECT 
          (sd.login_date - INTERVAL '1 day')::date,
          sd.days_back + 1
        FROM streak_dates sd
        WHERE sd.days_back < 365 -- Limit to prevent infinite recursion
          AND EXISTS (
            SELECT 1 
            FROM daily_logins dl 
            WHERE dl.user_id = $1 
              AND dl.login_date = (sd.login_date - INTERVAL '1 day')::date
          )
      )
      SELECT COUNT(*) as current_streak
      FROM streak_dates
      WHERE EXISTS (
        SELECT 1 
        FROM daily_logins dl 
        WHERE dl.user_id = $1 
          AND dl.login_date = streak_dates.login_date
      )`,
      [userId, today]
    )

    const currentStreak = parseInt(streakResult.rows[0]?.current_streak || 0)

    // Get longest streak
    const longestStreakResult = await query(
      `WITH login_groups AS (
        SELECT 
          login_date,
          login_date - (ROW_NUMBER() OVER (ORDER BY login_date))::integer * INTERVAL '1 day' AS group_id
        FROM daily_logins
        WHERE user_id = $1
      )
      SELECT 
        MAX(streak_length) as longest_streak
      FROM (
        SELECT 
          group_id,
          COUNT(*) as streak_length
        FROM login_groups
        GROUP BY group_id
      ) streaks`,
      [userId]
    )

    const longestStreak = parseInt(longestStreakResult.rows[0]?.longest_streak || 0)

    // Update user's streak info
    await query(
      `UPDATE users 
       SET current_streak = $1, 
           longest_streak = GREATEST(longest_streak, $2),
           last_login_date = $3,
           last_seen = NOW()
       WHERE id = $4`,
      [currentStreak, longestStreak, today, userId]
    )

    // Get last 7 days for display
    const last7DaysResult = await query(
      `SELECT 
        generate_series(
          CURRENT_DATE - INTERVAL '6 days',
          CURRENT_DATE,
          INTERVAL '1 day'
        )::date AS date`,
      []
    )

    const loginDatesResult = await query(
      `SELECT login_date::date
       FROM daily_logins
       WHERE user_id = $1
         AND login_date >= CURRENT_DATE - INTERVAL '6 days'`,
      [userId]
    )

    const loginDatesSet = new Set(
      loginDatesResult.rows.map(row => row.login_date.toISOString().split('T')[0])
    )

    const last7Days = last7DaysResult.rows.map(row => {
      const dateStr = row.date.toISOString().split('T')[0]
      const date = new Date(dateStr)
      const dayOfWeek = (date.getDay() + 6) % 7 // Convert to Monday = 0
      const isToday = dateStr === today
      const dayNumber = date.getDate()
      
      return {
        date: dateStr,
        dayOfWeek,
        dayNumber,
        completed: loginDatesSet.has(dateStr),
        isToday
      }
    })

    return res.status(200).json({
      currentStreak,
      longestStreak,
      last7Days,
      todayCompleted: true
    })

  } catch (error) {
    console.error('Error in streak API:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
