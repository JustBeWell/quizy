const fs = require('fs')
const path = require('path')

// Carga .env.local si existe
try{ require('dotenv').config({ path: path.join(process.cwd(), '.env.local') }) }catch(e){}

const { Client } = require('pg')

async function run(){
  try{
    const migrationFile = process.argv[2]
    if(!migrationFile){
      console.error('Usage: node apply_single_migration.js <migration-file.sql>')
      process.exit(1)
    }

    const migrationsDir = path.join(process.cwd(),'sql','migrations')
    const filePath = path.join(migrationsDir, migrationFile)
    
    if(!fs.existsSync(filePath)){
      console.error('Migration file not found:', filePath)
      process.exit(1)
    }

    const connectionString = process.env.DATABASE_URL
    if(!connectionString){
      throw new Error('DATABASE_URL not set. Export it or add to .env.local')
    }

    const client = new Client({ connectionString })
    await client.connect()

    console.log('Applying', migrationFile)
    const sql = fs.readFileSync(filePath,'utf8')
    await client.query(sql)
    console.log('✓ Applied', migrationFile)

    await client.end()
    process.exit(0)
  }catch(err){
    console.error('Migration failed', err.message)
    process.exit(1)
  }
}

run()
