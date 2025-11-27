import fs from 'fs'
import path from 'path'
import { createServerSupabase } from '../../lib/supabaseClient'
import db from '../../lib/db'
import { applyRateLimit } from '../../lib/rate-limit'

const attemptsFile = path.join(process.cwd(),'data','attempts.json')

export default async function handler(req,res){
  const method = req.method

  if(method === 'GET'){
    try{
      const { email, user_name, subject } = req.query
      // Prefer Postgres
      if(process.env.DATABASE_URL){
        try{
          let q, params
          // Base query with LEFT JOIN to question_banks to filter by published status
          // and get the real questionnaire name
          const baseQuery = `
            SELECT a.id, a.bank, 
                   COALESCE(qb.name, a.bank_name, UPPER(a.bank)) as bank_name,
                   a.user_name, a.user_email, a.score, a.answers, a.created_at, 
                   s.name as subject_name, s.slug as subject_slug 
            FROM attempts a 
            LEFT JOIN subjects s ON a.subject_id = s.id
            LEFT JOIN question_banks qb ON (
              CASE 
                WHEN a.bank LIKE 'db_%' THEN qb.id = CAST(REPLACE(a.bank, 'db_', '') AS INTEGER)
                ELSE qb.name = UPPER(a.bank)
              END
            )
          `
          const publishedFilter = `AND (qb.is_published = true OR a.bank NOT LIKE 'db_%')`
          
          if(user_name && subject){
            q = `${baseQuery} WHERE a.user_name = $1 AND a.subject_id = $2 ${publishedFilter} ORDER BY a.created_at DESC LIMIT 500`
            params = [user_name, subject]
          } else if(user_name){
            q = `${baseQuery} WHERE a.user_name = $1 ${publishedFilter} ORDER BY a.created_at DESC LIMIT 500`
            params = [user_name]
          } else if(email && subject){
            q = `${baseQuery} WHERE a.user_email = $1 AND a.subject_id = $2 ${publishedFilter} ORDER BY a.created_at DESC LIMIT 500`
            params = [email, subject]
          } else if(email){
            q = `${baseQuery} WHERE a.user_email = $1 ${publishedFilter} ORDER BY a.created_at DESC LIMIT 500`
            params = [email]
          } else if(subject){
            q = `${baseQuery} WHERE a.subject_id = $1 ${publishedFilter} ORDER BY a.created_at DESC LIMIT 500`
            params = [subject]
          } else {
            q = `${baseQuery} WHERE 1=1 ${publishedFilter} ORDER BY a.created_at DESC LIMIT 500`
            params = []
          }
          const r = await db.query(q, params)
          return res.status(200).json(r.rows)
        }catch(e){
          console.error('Postgres attempts fetch failed', e.message)
        }
      }

      const supabase = createServerSupabase()
      if(supabase){
        let queryBuilder = supabase.from('attempts').select('*').order('created_at',{ascending:false}).limit(500)
        if(user_name) queryBuilder = queryBuilder.eq('user_name', user_name)
        else if(email) queryBuilder = queryBuilder.eq('user_email', email)
        const { data, error } = await queryBuilder
        if(error) throw error
        return res.status(200).json(data)
      }

      // fallback to local file
      const existing = fs.existsSync(attemptsFile) ? JSON.parse(fs.readFileSync(attemptsFile,'utf8')) : []
      const filtered = user_name ? existing.filter(a=>a.user_name === user_name) : (email ? existing.filter(a=>a.user && a.user.email === email) : existing)
      return res.status(200).json(filtered.slice(-500).reverse())
    }catch(e){
      return res.status(500).json({error: e.message})
    }
  }

  if(method !== 'POST'){
    res.setHeader('Allow',['GET','POST'])
    return res.status(405).end('Method Not Allowed')
  }

  // Aplicar rate limiting para POST (10 intentos por hora)
  const rateLimitResult = await applyRateLimit('quiz', req, res);
  if (rateLimitResult) return rateLimitResult;

  const body = req.body
  try{
    // Verificar que el usuario existe en la BD si tiene user_name
    if(body.user_name && process.env.DATABASE_URL){
      try{
        const userCheck = await db.query('SELECT id FROM users WHERE name = $1', [body.user_name])
        if(userCheck.rows.length === 0){
          console.warn(`⚠️  Intento rechazado: Usuario ${body.user_name} no existe en la base de datos`)
          return res.status(403).json({
            error: 'user_not_found',
            message: 'Tu cuenta de usuario no existe. Por favor, registra una nueva cuenta.'
          })
        }
      }catch(userCheckError){
        console.error('Error verificando usuario:', userCheckError)
        // Continuar si hay error en la verificación para no bloquear completamente
      }
    }
    
    // Prefer local Postgres when DATABASE_URL is configured
    if(process.env.DATABASE_URL){
      try{
        const answers = body.answers || {}
        // Get subject_id from subject_slug if provided
        let subject_id = body.subject_id || null
        if(!subject_id && body.subject_slug){
          const subjectResult = await db.query('SELECT id FROM subjects WHERE slug = $1', [body.subject_slug])
          if(subjectResult.rows.length > 0){
            subject_id = subjectResult.rows[0].id
          }
        }
        
        // Get bank_name - either from body or resolve from question_banks
        let bank_name = body.bank_name || null
        if(!bank_name && body.bank){
          if(body.bank.startsWith('db_')){
            // Get name from question_banks table
            const bankId = body.bank.replace('db_', '')
            const bankResult = await db.query('SELECT name FROM question_banks WHERE id = $1', [bankId])
            if(bankResult.rows.length > 0){
              bank_name = bankResult.rows[0].name
            }
          } else {
            // File-based bank, use uppercase version
            bank_name = body.bank.toUpperCase()
          }
        }
        
        const row = [
          body.bank || null, 
          body.user_name || null,
          (body.user && body.user.email) || null, 
          body.score || null, 
          JSON.stringify(answers),
          subject_id,
          bank_name
        ]
        
        const q = 'INSERT INTO attempts(bank, user_name, user_email, score, answers, subject_id, bank_name) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *'
        const result = await db.query(q, row)
        
        return res.status(201).json({ok:true, data: result.rows})
      }catch(e){
        console.error('Database error in attempts POST:', e)
        return res.status(500).json({error: 'Error guardando intento', details: e.message})
      }
    }

    const supabase = createServerSupabase()
    if(supabase){
      // insert into attempts table; expects columns: bank, user_name, user_email, score, answers json, created_at
      const row = {
        bank: body.bank || null,
        user_name: body.user_name || null,
        user_email: (body.user && body.user.email) || null,
        score: body.score || null,
        answers: body.answers || {},
      }
      const { data, error } = await supabase.from('attempts').insert([row])
      if(error) throw error
      return res.status(201).json({ok:true, data})
    }

    // fallback to local file
    const existing = fs.existsSync(attemptsFile) ? JSON.parse(fs.readFileSync(attemptsFile,'utf8')) : []
    existing.push({ ...body, date: new Date().toISOString() })
    fs.writeFileSync(attemptsFile, JSON.stringify(existing.slice(-500), null, 2))
    return res.status(201).json({ok:true})
  }catch(e){
    console.error('Error in attempts API:', e)
    return res.status(500).json({error: 'Error procesando solicitud de intentos'})
  }
}
