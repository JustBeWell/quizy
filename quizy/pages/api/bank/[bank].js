import fs from 'fs'
import path from 'path'
import { query } from '../../../lib/db'

export default async function handler(req,res){
  const { bank } = req.query
  const { subject } = req.query // optional subject filter
  
  try{
    // Check if it's a database bank (prefixed with 'db_')
    if (bank.startsWith('db_')) {
      return await handleDatabaseBank(req, res, bank, subject)
    }
    
    // Try to find bank in database first (by name)
    const dbResult = await tryDatabaseBankByName(bank, subject)
    if (dbResult) {
      return res.status(200).json(dbResult)
    }
    
    // Fall back to file-based banks (for backward compatibility)
    return await handleFileBank(req, res, bank, subject)
  }catch(e){
    console.error('api/bank error', e)
    res.status(500).json({error:'read_error', message: e.message})
  }
}

async function tryDatabaseBankByName(bankName, subject) {
  try {
    const upperName = bankName.toUpperCase()
    
    let sql = `
      SELECT qb.* 
      FROM question_banks qb 
      LEFT JOIN subjects s ON qb.subject_id = s.id
      WHERE qb.name = $1 AND qb.is_active = true AND qb.is_published = true
    `
    const params = [upperName]
    
    if (subject) {
      sql += ' AND s.slug = $2'
      params.push(subject)
    }
    
    const result = await query(sql, params)
    
    if (result.rows.length === 0) {
      return null // Not found in database
    }
    
    const bankData = result.rows[0]
  const questions = Array.isArray(bankData.questions) ? bankData.questions : []
    
  // Ensure each question has a stable unique id. If the source doesn't provide one,
  // fall back to a generated id using the bank name + index. This prevents multiple
  // questions having `undefined` as id which caused localStorage collisions.
  const normalized = questions.map((q, i) => {
      // Normalizar opciones: convertir array de strings a formato {key, text}
      let normalizedOptions = []
      if (Array.isArray(q.options)) {
        normalizedOptions = q.options.map((opt, idx) => {
          // Generar key como letra (a, b, c, d, etc.)
          const letterKey = String.fromCharCode(97 + idx) // 97 = 'a' en ASCII
          
          if (typeof opt === 'string') {
            // Convertir string a objeto con key como letra
            return { key: letterKey, text: opt }
          } else if (opt && typeof opt === 'object' && opt.text !== undefined) {
            // Ya tiene el formato correcto, pero usar letra como key si es número
            const existingKey = opt.key !== undefined ? opt.key : idx
            const finalKey = typeof existingKey === 'number' ? letterKey : String(existingKey)
            return { key: finalKey, text: opt.text }
          }
          return { key: letterKey, text: String(opt) }
        })
      }
      
      // Normalizar answers: convertir índices numéricos a letras
      let normalizedAnswers = []
      if (Array.isArray(q.answers)) {
        normalizedAnswers = q.answers.map(a => {
          // Si es un número, convertirlo a letra (0 -> 'a', 1 -> 'b', etc.)
          if (typeof a === 'number') {
            return String.fromCharCode(97 + a)
          }
          return String(a)
        })
      }
      
      return {
        id: q.id !== undefined && q.id !== null ? q.id : `${bankName.replace(/\s+/g,'_')}_q${i}`,
        question: q.question,
        options: normalizedOptions,
        answers: normalizedAnswers
      }
    })
    
    return {
      name: bankData.name,
      description: bankData.description,
      length: normalized.length,
      questions: normalized,
      subject: subject || null,
      source: 'database'
    }
  } catch (error) {
    console.error('Error checking database for bank:', error)
    return null // Continue to file fallback
  }
}

async function handleDatabaseBank(req, res, bank, subject) {
  const bankId = bank.replace('db_', '') // Remove 'db_' prefix
  
  try {
    const result = await query(
      'SELECT * FROM question_banks WHERE id = $1 AND is_active = true',
      [bankId]
    )
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'bank_not_found', 
        message: `Database bank not found: ${bank}` 
      })
    }
    
    const bankData = result.rows[0]
  const questions = Array.isArray(bankData.questions) ? bankData.questions : []
    
  // Ensure stable unique ids for DB-stored questions as well
  const normalized = questions.map((q, i) => {
      // Normalizar opciones: convertir array de strings a formato {key, text}
      let normalizedOptions = []
      if (Array.isArray(q.options)) {
        normalizedOptions = q.options.map((opt, idx) => {
          // Generar key como letra (a, b, c, d, etc.)
          const letterKey = String.fromCharCode(97 + idx) // 97 = 'a' en ASCII
          
          if (typeof opt === 'string') {
            // Convertir string a objeto con key como letra
            return { key: letterKey, text: opt }
          } else if (opt && typeof opt === 'object' && opt.text !== undefined) {
            // Ya tiene el formato correcto, pero usar letra como key si es número
            const existingKey = opt.key !== undefined ? opt.key : idx
            const finalKey = typeof existingKey === 'number' ? letterKey : String(existingKey)
            return { key: finalKey, text: opt.text }
          }
          return { key: letterKey, text: String(opt) }
        })
      }
      
      // Normalizar answers: convertir índices numéricos a letras
      let normalizedAnswers = []
      if (Array.isArray(q.answers)) {
        normalizedAnswers = q.answers.map(a => {
          // Si es un número, convertirlo a letra (0 -> 'a', 1 -> 'b', etc.)
          if (typeof a === 'number') {
            return String.fromCharCode(97 + a)
          }
          return String(a)
        })
      }
      
      return {
        id: q.id !== undefined && q.id !== null ? q.id : `${bankId}_q${i}`,
        question: q.question,
        options: normalizedOptions,
        answers: normalizedAnswers
      }
    })
    
    return res.status(200).json({
      name: bankData.name,
      description: bankData.description,
      length: normalized.length,
      questions: normalized,
      subject: subject || null,
      source: 'database'
    })
  } catch (error) {
    console.error('Error loading database bank:', error)
    return res.status(500).json({
      error: 'database_error',
      message: 'Error loading bank from database'
    })
  }
}

async function handleFileBank(req, res, bank, subject) {
  // Prefer sibling folder, but fall back to bundled `data/`.
  let baseFolder = path.resolve(process.cwd(),'../bancoDePreguntas')
  if(!fs.existsSync(baseFolder)) baseFolder = path.resolve(process.cwd(),'data')
  
  if(!fs.existsSync(baseFolder)){
    return res.status(404).json({ error: 'bank_not_found', message: `Bank file not found for ${bank}` })
  }
  
  // If subject is provided, look in the subject subfolder
  let folder = baseFolder
  if(subject){
    folder = path.join(baseFolder, subject)
    if(!fs.existsSync(folder)){
      return res.status(404).json({ error: 'subject_not_found', message: `Subject folder not found: ${subject}` })
    }
  }
  
  const candidates = [`${bank}_qna.json`, `${bank}.json`]
  let found = null
  for(const c of candidates){
    const full = path.join(folder,c)
    if(fs.existsSync(full)){
      found = full
      break
    }
  }
  if(!found){
    return res.status(404).json({ error: 'bank_not_found', message: `Bank file not found for ${bank}` })
  }
  const json = JSON.parse(fs.readFileSync(found,'utf8'))
  const rawQuestions = Array.isArray(json) ? json : (json.items || [])
  const normalized = rawQuestions.map((q, i) => ({
    id: q.id !== undefined && q.id !== null ? q.id : `${String(bank).replace(/\s+/g,'_')}_q${i}`,
    question: q.question,
    options: q.options || [],
    answers: q.answers || []
  }))
  const name = String(bank).replace(/_qna$/,'').toUpperCase()
  res.status(200).json({ name, length: normalized.length, questions: normalized, subject: subject || null, source: 'file' })
}
