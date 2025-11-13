// Script para verificar que la tabla password_reset_tokens existe
require('dotenv').config({ path: '.env.local' })
const { Client } = require('pg')

async function verifyTable() {
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  
  try {
    await client.connect()
    console.log('✓ Conectado a la base de datos')
    
    // Verificar que existe la tabla
    const result = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'password_reset_tokens'
      );
    `)
    
    if (result.rows[0].exists) {
      console.log('✓ Tabla password_reset_tokens existe')
      
      // Mostrar estructura de la tabla
      const structure = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'password_reset_tokens'
        ORDER BY ordinal_position;
      `)
      
      console.log('\nEstructura de la tabla:')
      console.table(structure.rows)
      
      // Mostrar índices
      const indexes = await client.query(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'password_reset_tokens';
      `)
      
      console.log('\nÍndices:')
      indexes.rows.forEach(idx => {
        console.log(`- ${idx.indexname}`)
      })
      
      console.log('\n✓ Sistema de recuperación de contraseña listo!')
    } else {
      console.log('✗ Tabla password_reset_tokens NO existe')
      console.log('Ejecuta: node scripts/db/apply_single_migration.js 013_add_password_reset_tokens.sql')
    }
    
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await client.end()
  }
}

verifyTable()
