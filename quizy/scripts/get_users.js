require('dotenv').config({ path: '.env.local' })
const { Pool } = require('pg')

async function getUserId() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  try {
    const result = await pool.query('SELECT id, email FROM users LIMIT 5')
    console.log('Usuarios disponibles:')
    result.rows.forEach(u => console.log(`  ID: ${u.id} - ${u.email}`))
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await pool.end()
  }
}

getUserId()
