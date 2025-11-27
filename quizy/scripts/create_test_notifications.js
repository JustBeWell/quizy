/**
 * Script para crear notificaciones de prueba
 * Uso: node scripts/create_test_notifications.js <user_id>
 */

const db = require('../lib/db')

async function createTestNotifications(userId) {
  console.log(`📬 Creando notificaciones de prueba para user_id: ${userId}`)

  const notifications = [
    {
      type: 'system',
      title: '🎉 ¡Bienvenido a Quizy!',
      message: 'Gracias por unirte a nuestra plataforma de estudio. Explora cuestionarios, compite en rankings y mantén tu racha diaria.',
      link: '/levels'
    },
    {
      type: 'streak_reminder',
      title: '🔥 ¡Mantén tu racha!',
      message: 'Llevas 5 días seguidos estudiando. ¡No pierdas tu racha! Completa al menos un cuestionario hoy.',
      link: '/subjects'
    },
    {
      type: 'ranking_update',
      title: '🏆 ¡Has subido en el ranking!',
      message: 'Felicidades, ahora estás en el puesto #15 del ranking general. ¡Sigue así!',
      link: '/ranking'
    },
    {
      type: 'new_content',
      title: '📚 Nuevo contenido disponible',
      message: 'Se han añadido 50 preguntas nuevas de Matemáticas 2º Bach. ¡Ponte a prueba!',
      link: '/subjects/matematicas-2-bach'
    },
    {
      type: 'achievement',
      title: '🎯 ¡Logro desbloqueado!',
      message: 'Has completado 10 cuestionarios perfectos. ¡Eres una máquina!',
      link: '/profile'
    },
    {
      type: 'new_content',
      title: '✨ Actualizaciones de la plataforma',
      message: 'Hemos mejorado la velocidad de carga y añadido el sistema de noticias. ¡Échale un vistazo!',
      link: null
    }
  ]

  try {
    for (const notif of notifications) {
      await db.query(
        `INSERT INTO notifications (user_id, type, title, message, link)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, notif.type, notif.title, notif.message, notif.link]
      )
      console.log(`✅ Creada: ${notif.title}`)
    }

    console.log(`\n🎉 ${notifications.length} notificaciones creadas correctamente`)
    
    // Mostrar resumen
    const result = await db.query(
      `SELECT COUNT(*) as total, 
              COUNT(CASE WHEN is_read = FALSE THEN 1 END) as unread
       FROM notifications 
       WHERE user_id = $1`,
      [userId]
    )
    
    console.log(`\n📊 Resumen para user ${userId}:`)
    console.log(`   Total: ${result.rows[0].total}`)
    console.log(`   Sin leer: ${result.rows[0].unread}`)

  } catch (error) {
    console.error('❌ Error creando notificaciones:', error)
  } finally {
    await db.end()
  }
}

// Obtener user_id del argumento
const userId = process.argv[2]

if (!userId) {
  console.error('❌ Error: Debes proporcionar un user_id')
  console.log('Uso: node scripts/create_test_notifications.js <user_id>')
  process.exit(1)
}

createTestNotifications(parseInt(userId))
