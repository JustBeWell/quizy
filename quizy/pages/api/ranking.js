import fs from 'fs'
import path from 'path'
import db from '../../lib/db'

// If SUPABASE_* env vars are set, use Supabase for global ranking (kept for compatibility)
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_KEY
let supabase = null
if(SUPABASE_URL && SUPABASE_KEY){
  try{
    // dynamic import to avoid requiring package when not used
    const { createClient } = require('@supabase/supabase-js')
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
  }catch(e){
    console.warn('Supabase client not available', e.message)
    supabase = null
  }
}

const rankFile = path.join(process.cwd(),'data','ranking.json')

export default async function handler(req,res){
  if(req.method === 'GET'){
    try{
      const { subject } = req.query
      // Prefer Postgres if configured
      if(process.env.DATABASE_URL){
        try{
          let q, params
          if(subject){
            // Get ranking for specific subject by joining with attempts table
            // Only show attempts for published questionnaires
            q = `
              SELECT 
                a.user_name as name, 
                MAX(a.score) as score,
                a.bank,
                COALESCE(a.bank_name, UPPER(a.bank)) as bank_name,
                MAX(a.created_at) as created_at,
                s.name as subject_name,
                s.slug as subject_slug
              FROM attempts a
              LEFT JOIN subjects s ON a.subject_id = s.id
              LEFT JOIN question_banks qb ON (
                CASE 
                  WHEN a.bank LIKE 'db_%' THEN qb.id = CAST(REPLACE(a.bank, 'db_', '') AS INTEGER)
                  ELSE qb.name = UPPER(a.bank)
                END
              )
              WHERE a.subject_id = $1 
                AND a.user_name IS NOT NULL
                AND a.user_name != 'admin'
                AND (qb.is_published = true OR a.bank NOT LIKE 'db_%')
              GROUP BY a.user_name, a.bank, a.bank_name, s.name, s.slug
              ORDER BY score DESC
              LIMIT 50
            `
            params = [subject]
          } else {
            // Global ranking (all subjects)
            // Only show attempts for published questionnaires
            q = `
              SELECT 
                a.user_name as name, 
                MAX(a.score) as score,
                a.bank,
                COALESCE(a.bank_name, UPPER(a.bank)) as bank_name,
                MAX(a.created_at) as created_at,
                s.name as subject_name,
                s.slug as subject_slug
              FROM attempts a
              LEFT JOIN subjects s ON a.subject_id = s.id
              LEFT JOIN question_banks qb ON (
                CASE 
                  WHEN a.bank LIKE 'db_%' THEN qb.id = CAST(REPLACE(a.bank, 'db_', '') AS INTEGER)
                  ELSE qb.name = UPPER(a.bank)
                END
              )
              WHERE a.user_name IS NOT NULL
                AND a.user_name != 'admin'
                AND (qb.is_published = true OR a.bank NOT LIKE 'db_%')
              GROUP BY a.user_name, a.bank, a.bank_name, s.name, s.slug
              ORDER BY score DESC
              LIMIT 50
            `
            params = []
          }
          const result = await db.query(q, params)
          return res.status(200).json(result.rows)
        }catch(e){
          console.error('Postgres ranking fetch failed', e.message)
          // fallthrough to supabase/local
        }
      }

      if(supabase){
        const { data, error } = await supabase.from('ranking').select('*').order('score',{ascending:false}).limit(50)
        if(error) throw error
        return res.status(200).json(data)
      }
      if(!fs.existsSync(rankFile)) fs.writeFileSync(rankFile, JSON.stringify([]))
      const data = JSON.parse(fs.readFileSync(rankFile,'utf8'))
      res.status(200).json(data)
    }catch(e){res.status(500).json({error:e.message})}
    return
  }
  if(req.method === 'POST'){
    try{
      const body = req.body
      // Prefer Postgres
      if(process.env.DATABASE_URL){
        try{
          const q = 'INSERT INTO ranking(name, score, bank) VALUES($1,$2,$3) RETURNING *'
          const params = [body.name || null, body.score || 0, body.bank || null]
          const r = await db.query(q, params)
          return res.status(201).json({ok:true, data: r.rows})
        }catch(e){
          console.error('Postgres ranking insert failed', e.message)
          // fallthrough to supabase/local
        }
      }

      if(supabase){
        const { data, error } = await supabase.from('ranking').insert([body])
        if(error) throw error
        return res.status(201).json({ok:true})
      }
      const existing = fs.existsSync(rankFile)? JSON.parse(fs.readFileSync(rankFile,'utf8')) : []
      existing.push(body)
      existing.sort((a,b)=>b.score - a.score)
      fs.writeFileSync(rankFile, JSON.stringify(existing.slice(0,50),null,2))
      res.status(201).json({ok:true})
    }catch(e){res.status(500).json({error:e.message})}
    return
  }
  res.setHeader('Allow',['GET','POST'])
  res.status(405).end('Method Not Allowed')
}
