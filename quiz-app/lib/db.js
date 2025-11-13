import { Pool } from 'pg'

let pool
function getPool(){
  if(pool) return pool
  // Accept several environment variable names so deployments that set
  // POSTGRES_URL or PRISMA_DATABASE_URL still work without editing code.
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.PRISMA_DATABASE_URL
  if(!connectionString) return null
  // If the connection string contains sslmode=require (from some providers),
  // pg will use it when parsing the connection string. For compatibility
  // ensure we pass the connection string directly to the Pool.
  pool = new Pool({ connectionString })
  // simple error logging
  pool.on('error', (err)=>{
    console.error('Unexpected Postgres client error', err)
  })
  return pool
}

export async function query(text, params){
  const p = getPool()
  if(!p) throw new Error('No database connection configured (set DATABASE_URL or POSTGRES_URL)')
  const res = await p.query(text, params)
  return res
}

export async function getClient(){
  const p = getPool()
  if(!p) throw new Error('No database connection configured (set DATABASE_URL or POSTGRES_URL)')
  const client = await p.connect()
  return client
}

export default { query, getClient }
