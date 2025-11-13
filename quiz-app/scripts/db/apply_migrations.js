const fs = require('fs')
const path = require('path')

// Carga .env.local si existe
try{ require('dotenv').config({ path: path.join(process.cwd(), '.env.local') }) }catch(e){}

const { Client } = require('pg')

async function run(){
  try{
    const migrationsDir = path.join(process.cwd(),'sql','migrations')
    const files = fs.readdirSync(migrationsDir).filter(f=>f.endsWith('.sql')).sort()
    if(files.length === 0){
      console.log('No migration files found in', migrationsDir)
      process.exit(0)
    }

    const connectionString = process.env.DATABASE_URL
    if(!connectionString){
      throw new Error('DATABASE_URL not set. Export it or add to .env.local')
    }

    const client = new Client({ connectionString })
    await client.connect()

    for(const file of files){
      const filePath = path.join(migrationsDir,file)
      console.log('Applying', file)
      const sql = fs.readFileSync(filePath,'utf8')
      await client.query(sql)
      console.log('Applied', file)
    }

    await client.end()
    console.log('All migrations applied successfully')
    process.exit(0)
  }catch(err){
    console.error('Migration failed', err && err.stack ? err.stack : err)
    process.exit(1)
  }
}

run()
