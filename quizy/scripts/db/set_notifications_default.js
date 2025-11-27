require('dotenv').config({ path: '.env.local' })
const { Client } = require('pg')

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()
  
  try {
    console.log('🔧 Configurando valores por defecto para notificaciones...')
    
    await client.query(`
      ALTER TABLE users 
      ALTER COLUMN notifications_enabled SET DEFAULT TRUE
    `)
    
    await client.query(`
      ALTER TABLE users 
      ALTER COLUMN notification_preferences SET DEFAULT '{"email": true, "in_app": true}'::jsonb
    `)
    
    console.log('✅ Configuración aplicada correctamente')
    console.log('   - Nuevos usuarios tendrán notifications_enabled = TRUE')
    console.log('   - Nuevos usuarios tendrán email e in_app activados')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await client.end()
  }
}

run()
