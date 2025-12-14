require('dotenv').config({ path: '.env.local' })
const { Pool } = require('pg')

async function checkTable() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'question_banks'
      ORDER BY ordinal_position
    `)
    console.log('Columnas de question_banks:')
    result.rows.forEach(col => {
      console.log(`  ${col.column_name} (${col.data_type}) - Nullable: ${col.is_nullable} - Default: ${col.column_default}`)
    })
  } finally {
    await pool.end()
  }
}

checkTable()
