/**
 * Script para aplicar la migración de notificaciones
 * Uso: node scripts/migrate_notifications.js
 */

const db = require('../lib/db')
const fs = require('fs')
const path = require('path')

async function applyMigration() {
  console.log('🔔 Aplicando migración de notificaciones...\n')

  try {
    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, '..', 'sql', 'migrations', '007_notifications.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')

    // Ejecutar la migración
    await db.query(sqlContent)

    console.log('✅ Migración aplicada correctamente\n')

    // Verificar que la tabla existe
    const tablesResult = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'notifications'
    `)

    if (tablesResult.rows.length > 0) {
      console.log('✅ Tabla "notifications" creada correctamente')
      
      // Verificar índices
      const indexesResult = await db.query(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'notifications'
      `)
      console.log(`📊 Índices creados: ${indexesResult.rows.length}`)
      indexesResult.rows.forEach(row => {
        console.log(`   - ${row.indexname}`)
      })
    }

    // Verificar columnas en users
    const columnsResult = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('notifications_enabled', 'notification_preferences')
    `)

    console.log(`\n✅ Columnas añadidas a "users": ${columnsResult.rows.length}`)
    columnsResult.rows.forEach(row => {
      console.log(`   - ${row.column_name}`)
    })

    console.log('\n🎉 Migración completada exitosamente!')
    console.log('\nPara crear notificaciones de prueba ejecuta:')
    console.log('  node scripts/create_test_notifications.js <user_id>')

  } catch (error) {
    console.error('❌ Error aplicando migración:', error.message)
    console.error(error)
    process.exit(1)
  } finally {
    await db.end()
  }
}

applyMigration()
