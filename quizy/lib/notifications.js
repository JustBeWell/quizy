/**
 * Librería centralizada para crear notificaciones
 */

const db = require('./db')

/**
 * Crea una notificación para un usuario
 * @param {number} userId - ID del usuario
 * @param {string} type - Tipo de notificación (system, streak_reminder, ranking_update, new_content, achievement)
 * @param {string} title - Título de la notificación
 * @param {string} message - Mensaje descriptivo
 * @param {string|null} link - Enlace opcional
 * @param {object|null} metadata - Datos adicionales en formato JSON
 */
async function createNotification(userId, type, title, message, link = null, metadata = null) {
  try {
    await db.query(
      `INSERT INTO notifications (user_id, type, title, message, link, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, type, title, message, link, metadata ? JSON.stringify(metadata) : null]
    )
    console.log(`✅ Notificación creada para user ${userId}: ${title}`)
  } catch (error) {
    console.error('❌ Error creando notificación:', error)
  }
}

/**
 * Crea notificación de racha de estudio
 */
async function notifyStreak(userId, streakDays) {
  const messages = {
    1: '🎉 ¡Comenzaste tu racha de estudio!',
    3: '🔥 ¡3 días seguidos! Vas muy bien',
    7: '⭐ ¡Una semana completa estudiando!',
    14: '🌟 ¡Dos semanas de dedicación!',
    30: '🏆 ¡Un mes estudiando sin parar!',
    default: `🔥 ¡${streakDays} días de racha!`
  }

  const title = messages[streakDays] || messages.default
  const message = `Llevas ${streakDays} ${streakDays === 1 ? 'día' : 'días'} seguidos estudiando. ¡Sigue así!`

  await createNotification(
    userId,
    'streak_reminder',
    title,
    message,
    '/profile',
    { streakDays }
  )
}

/**
 * Crea notificación de recordatorio de racha en peligro
 */
async function notifyStreakReminder(userId, streakDays) {
  await createNotification(
    userId,
    'streak_reminder',
    '⚠️ ¡Tu racha está en peligro!',
    `Llevas ${streakDays} ${streakDays === 1 ? 'día' : 'días'} de racha. No la pierdas, completa al menos un cuestionario hoy.`,
    '/subjects',
    { streakDays, type: 'warning' }
  )
}

/**
 * Crea notificación de cambio en el ranking
 */
async function notifyRankingUpdate(userId, oldPosition, newPosition, rankingType = 'general') {
  const improved = newPosition < oldPosition
  const change = Math.abs(oldPosition - newPosition)
  
  const title = improved 
    ? `🏆 ¡Subiste ${change} ${change === 1 ? 'puesto' : 'puestos'} en el ranking!`
    : `📊 Cambio en tu posición del ranking`
  
  const message = improved
    ? `Felicidades, ahora estás en el puesto #${newPosition} del ranking ${rankingType}.`
    : `Tu nueva posición es #${newPosition} en el ranking ${rankingType}.`

  await createNotification(
    userId,
    'ranking_update',
    title,
    message,
    '/ranking',
    { oldPosition, newPosition, rankingType, improved }
  )
}

/**
 * Crea notificación de logro desbloqueado
 */
async function notifyAchievement(userId, achievementType, description, value) {
  const achievements = {
    perfect_quiz: {
      title: '🎯 ¡Quiz perfecto!',
      message: `Completaste un cuestionario sin errores. ${description}`,
      link: '/stats'
    },
    milestone_10: {
      title: '🌟 ¡10 quizzes completados!',
      message: 'Has demostrado constancia y dedicación. ¡Sigue así!',
      link: '/stats'
    },
    milestone_50: {
      title: '⭐ ¡50 quizzes completados!',
      message: '¡Increíble progreso! Estás dominando el material.',
      link: '/stats'
    },
    milestone_100: {
      title: '🏆 ¡100 quizzes completados!',
      message: '¡Eres imparable! Has alcanzado un hito importante.',
      link: '/stats'
    },
    high_score: {
      title: '🎊 ¡Nuevo récord personal!',
      message: description,
      link: '/stats'
    },
    perfect_streak: {
      title: '💯 ¡Racha perfecta!',
      message: `${value} quizzes perfectos seguidos. ¡Impresionante!`,
      link: '/profile'
    }
  }

  const achievement = achievements[achievementType] || {
    title: '🎯 ¡Logro desbloqueado!',
    message: description,
    link: '/profile'
  }

  await createNotification(
    userId,
    'achievement',
    achievement.title,
    achievement.message,
    achievement.link,
    { achievementType, value }
  )
}

/**
 * Crea notificación de nuevo contenido
 */
async function notifyNewContent(userIds, contentType, title, description, link = null) {
  for (const userId of userIds) {
    await createNotification(
      userId,
      'new_content',
      `📚 ${title}`,
      description,
      link || '/subjects',
      { contentType }
    )
  }
}

/**
 * Crea notificación del sistema (para todos los usuarios o específicos)
 */
async function notifySystem(userIds, title, message, link = null) {
  for (const userId of userIds) {
    await createNotification(
      userId,
      'system',
      `✨ ${title}`,
      message,
      link,
      { system: true }
    )
  }
}

/**
 * Obtiene todos los usuarios activos para notificaciones masivas
 */
async function getAllActiveUsers() {
  const result = await db.query(`
    SELECT id FROM users 
    WHERE notifications_enabled = TRUE
  `)
  return result.rows.map(row => row.id)
}

module.exports = {
  createNotification,
  notifyStreak,
  notifyStreakReminder,
  notifyRankingUpdate,
  notifyAchievement,
  notifyNewContent,
  notifySystem,
  getAllActiveUsers
}
