import fs from 'fs'
import path from 'path'
import { query } from '../../lib/db'

export default async function handler(req,res){
  const { subject } = req.query // optional subject filter
  
  try{
    // Only get database-based banks (JSON files have been migrated)
    const dbBanks = await getDatabaseBanks(subject)
    
    res.status(200).json(dbBanks)
  }catch(e){
    console.error('/api/banks error', e)
    res.status(500).json({error:e.message})
  }
}

async function getFileBanks(subject) {
  // Base folder for question banks
  let baseFolder = path.resolve(process.cwd(),'../bancoDePreguntas')
  if(!fs.existsSync(baseFolder)){
    // Not present in some deployments (Vercel). Use the app-local data folder instead.
    baseFolder = path.resolve(process.cwd(),'data')
  }
  
  if(!fs.existsSync(baseFolder)){
    // nothing available
    return []
  }
  
  // If subject is provided, look in the subject subfolder
  let folder = baseFolder
  if(subject){
    folder = path.join(baseFolder, subject)
    if(!fs.existsSync(folder)){
      return [] // subject folder doesn't exist
    }
  }
  
  // Prefer question banks named with the `_qna.json` suffix (rec1_qna.json, rec2_qna.json).
  // This prevents miscellaneous JSON files like attempts.json or ranking.json from showing up
  // as banks in the UI. If no `_qna.json` files are present, fall back to any `.json` files
  // for backward compatibility.
  let files = fs.readdirSync(folder).filter(f=>f.endsWith('_qna.json'))
  if(files.length===0){
    files = fs.readdirSync(folder).filter(f=>f.endsWith('.json'))
  }
  const banks = files.map(f=>{
    try{
      const full = path.join(folder,f)
      const json = JSON.parse(fs.readFileSync(full,'utf8'))
      // normalize id to the base name without suffixes like _qna.json
      const base = f.replace(/_qna\.json$/,'').replace(/\.json$/,'')
      return { 
        id: base, 
        name: base.toUpperCase(), 
        count: Array.isArray(json)?json.length:(json.items?json.items.length:0),
        subject: subject || null,
        source: 'file'
      }
    }catch(e){return null}
  }).filter(Boolean)
  
  return banks
}

async function getDatabaseBanks(subject) {
  try {
    // Only show published questionnaires to regular users
    let sql = 'SELECT qb.id, qb.name, qb.description, qb.subject_id, qb.questions FROM question_banks qb WHERE qb.is_active = true AND qb.is_published = true'
    const params = []
    
    if (subject) {
      // Match subject by SLUG from subjects table
      sql += ' AND qb.subject_id IN (SELECT id FROM subjects WHERE slug = $1)'
      params.push(subject)
    }
    
    sql += ' ORDER BY qb.created_at DESC'
    
    const result = await query(sql, params)
    
    return result.rows.map(row => ({
      id: `db_${row.id}`, // prefix with 'db_' to distinguish from file banks
      name: row.name,
      description: row.description,
      count: Array.isArray(row.questions) ? row.questions.length : 0,
      subject: subject || null,
      subject_id: row.subject_id,
      source: 'database'
    }))
  } catch (error) {
    console.error('Error loading database banks:', error)
    return [] // Return empty array if DB not available
  }
}
