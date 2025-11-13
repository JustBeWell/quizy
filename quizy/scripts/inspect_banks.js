#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' })

const { query } = require('../lib/db')

async function inspect(){
  try{
    const subjRes = await query("SELECT id, name FROM subjects WHERE name ILIKE $1 OR name ILIKE $2 LIMIT 1", ['%Ingenieria Web%','%Ingeniería Web%'])
    if(subjRes.rows.length === 0){
      console.log('No se encontró la asignatura Ingeniería Web en la tabla subjects.')
      process.exit(0)
    }
    const subject = subjRes.rows[0]
    console.log('Asignatura encontrada:', subject)

    const banksRes = await query('SELECT id, name, questions FROM question_banks WHERE subject_id = $1 ORDER BY id DESC LIMIT 10', [subject.id])
    if(banksRes.rows.length === 0){
      console.log('No se encontraron bancos para esta asignatura.')
      process.exit(0)
    }

    for(const b of banksRes.rows){
      console.log('\n--- Banco:', b.id, b.name, '---')
      const questions = Array.isArray(b.questions) ? b.questions : []
      // Also show how the API will normalize ids (fallback to bankName_q<index> if missing)
      const normalized = questions.map((q,i)=>({
        id: q.id !== undefined && q.id !== null ? q.id : `${String(b.name).replace(/\s+/g,'_')}_q${i}`,
        question: q.question,
        options: q.options || [],
        answers: q.answers || []
      }))
      for(let i=0;i<Math.min(5, normalized.length); i++){
        const q = normalized[i]
        console.log(`Q[${i}] id=${q.id} question=${(q.question||'').slice(0,120).replace(/\n/g,' ')} `)
        if(q.options && Array.isArray(q.options) && q.options.length>0){
          console.log('  options:', q.options.map(o=>o.key).slice(0,4))
        }
        console.log('  answers:', q.answers)
      }
    }
    process.exit(0)
  }catch(e){
    console.error('Error inspeccionando bancos:', e.message)
    process.exit(1)
  }
}

inspect()
