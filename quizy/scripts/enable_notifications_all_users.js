require('dotenv').config({ path: '.env.local' })
const { Pool } = require('pg')

async function enableNotifications() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  
  try {
    console.log('🔔 Activando notificaciones para todos los usuarios...')
    
    const result = await pool.query(`
      UPDATE users 
      SET 
        notifications_enabled = TRUE,
        notification_preferences = '{"email": true, "in_app": true}'::jsonb
      WHERE notifications_enabled IS NULL OR notifications_enabled = FALSE
    `)
    
    console.log(`✅ ${result.rowCount} usuarios actualizados`)
    
    // Verificar
    const check = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN notifications_enabled = TRUE THEN 1 END) as enabled
      FROM users
    `)
    
    console.log(`\n📊 Resumen:`)
    console.log(`   Total usuarios: ${check.rows[0].total}`)
    console.log(`   Con notificaciones: ${check.rows[0].enabled}`)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await pool.end()
  }
}

enableNotifications()
