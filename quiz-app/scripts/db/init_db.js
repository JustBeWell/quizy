const fs = require('fs')
const path = require('path')
// load environment variables from .env.local if present so this script can be run standalone
try{ require('dotenv').config({ path: path.join(process.cwd(), '.env.local') }) }catch(e){
  // dotenv may not be installed in some setups; fallback to a simple parser
  try{
    const envPath = path.join(process.cwd(), '.env.local')
    if(fs.existsSync(envPath)){
      const raw = fs.readFileSync(envPath,'utf8')
      raw.split(/\r?\n/).forEach(line=>{
        line = line.trim()
        if(!line || line.startsWith('#')) return
        const idx = line.indexOf('=')
        if(idx<0) return
        const key = line.substring(0,idx).trim()
        let val = line.substring(idx+1).trim()
        // strip optional surrounding quotes
        if(val.startsWith('"') && val.endsWith('"')) val = val.slice(1,-1)
        if(val.startsWith("'") && val.endsWith("'")) val = val.slice(1,-1)
        if(!(key in process.env)) process.env[key] = val
      })
    }
  }catch(e){}
}
const { Client } = require('pg')

async function run(){
  try{
    const sqlPath = path.join(process.cwd(),'sql','migrations','001_init.sql')
    const sql = fs.readFileSync(sqlPath,'utf8')
    console.log('Running migration:', sqlPath)
    const connectionString = process.env.DATABASE_URL
    if(!connectionString){
      throw new Error('DATABASE_URL not set. Start your DB or set DATABASE_URL in env')
    }
    const client = new Client({ connectionString })
    await client.connect()
    await client.query(sql)
    await client.end()
    console.log('Migration applied.')
    process.exit(0)
  }catch(e){
    console.error('Migration failed', e && e.stack ? e.stack : e)
    process.exit(1)
  }
}

run()
