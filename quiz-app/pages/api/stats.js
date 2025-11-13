import fs from 'fs'
import path from 'path'
import db from '../../lib/db'
import { createServerSupabase } from '../../lib/supabaseClient'

const attemptsFile = path.join(process.cwd(),'data','attempts.json')

export default async function handler(req,res){
  if(req.method !== 'GET'){
    res.setHeader('Allow',['GET'])
    return res.status(405).end('Method Not Allowed')
  }

  try{
    // Prefer Postgres
    if(process.env.DATABASE_URL){
      try{
        // Only include attempts for published questionnaires
        const q = `
          SELECT a.bank, a.score, a.created_at 
          FROM attempts a
          LEFT JOIN question_banks qb ON (
            CASE 
              WHEN a.bank LIKE 'db_%' THEN qb.id = CAST(REPLACE(a.bank, 'db_', '') AS INTEGER)
              ELSE qb.name = UPPER(a.bank)
            END
          )
          WHERE qb.is_published = true OR a.bank NOT LIKE 'db_%'
        `;
        const r = await db.query(q)
        const rows = r.rows || []
        return res.status(200).json(computeStats(rows))
      }catch(e){ console.error('Postgres stats fetch failed', e.message) }
    }

    // Supabase
    const supabase = createServerSupabase()
    if(supabase){
      const { data, error } = await supabase.from('attempts').select('bank,score,created_at')
      if(error) throw error
      return res.status(200).json(computeStats(data || []))
    }

    // Local fallback
    const existing = fs.existsSync(attemptsFile) ? JSON.parse(fs.readFileSync(attemptsFile,'utf8')) : []
    // normalize: attempts local may have different keys
    const normalized = existing.map(a=>({ bank: a.bank || a.bankName || null, score: Number(a.score||0), created_at: a.created_at || a.date || null }))
    return res.status(200).json(computeStats(normalized))
  }catch(e){
    console.error(e)
    return res.status(500).json({error: e.message})
  }
}

function computeStats(rows){
  const totalAttempts = rows.length
  const scores = rows.map(r=>Number(r.score||0)).filter(s=>!Number.isNaN(s))
  const avg = scores.length ? (scores.reduce((a,b)=>a+b,0)/scores.length) : 0
  const best = scores.length ? Math.max(...scores) : 0
  const perBank = {}
  for(const r of rows){
    const b = r.bank || 'unknown'
    if(!perBank[b]) perBank[b] = { bank: b, attempts:0, sum:0, best:0 }
    perBank[b].attempts++
    const sc = Number(r.score||0)
    perBank[b].sum += sc
    perBank[b].best = Math.max(perBank[b].best || 0, sc)
  }
  const perBankArr = Object.values(perBank).map(p=>({ bank: p.bank, attempts: p.attempts, avg: Math.round((p.sum/p.attempts)*100)/100, best: p.best }))
  return {
    totalAttempts,
    avgScore: Math.round(avg*100)/100,
    bestScore: best,
    perBank: perBankArr
  }
}
