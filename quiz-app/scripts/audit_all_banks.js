#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' })
const { query } = require('../lib/db')

async function auditAllBanks(){
  try{
    console.log('🔍 Auditando TODOS los bancos de preguntas...\n')
    
    const banks = await query('SELECT id, name, subject_id, questions FROM question_banks ORDER BY id')
    
    let totalBanks = 0
    let banksWithIssues = 0
    let totalQuestions = 0
    let questionsWithMissingIds = 0
    const duplicateIds = new Map() // track duplicate ids across questions
    
    for(const b of banks.rows){
      totalBanks++
      const bankId = b.id
      const name = b.name || `Bank ${bankId}`
      const questions = Array.isArray(b.questions) ? b.questions : []
      totalQuestions += questions.length
      
      let hasMissingIds = false
      const idsInThisBank = new Set()
      
      for(let i=0; i<questions.length; i++){
        const q = questions[i]
        
        // Check for missing id
        if(q.id === undefined || q.id === null || q.id === ''){
          hasMissingIds = true
          questionsWithMissingIds++
        } else {
          // Check for duplicate ids within this bank
          if(idsInThisBank.has(q.id)){
            console.log(`⚠️  Banco ${bankId} (${name}): ID duplicado dentro del banco: "${q.id}"`)
            banksWithIssues++
          }
          idsInThisBank.add(q.id)
          
          // Track globally for cross-bank duplicates
          if(!duplicateIds.has(q.id)){
            duplicateIds.set(q.id, [])
          }
          duplicateIds.get(q.id).push({bankId, bankName: name, questionIndex: i})
        }
      }
      
      if(hasMissingIds){
        console.log(`❌ Banco ${bankId} (${name}): ${questionsWithMissingIds} preguntas sin ID`)
        banksWithIssues++
      }
    }
    
    // Check for ids used in multiple banks
    console.log('\n📊 Verificando IDs duplicados entre bancos...')
    let crossBankDuplicates = 0
    for(const [id, occurrences] of duplicateIds.entries()){
      if(occurrences.length > 1){
        // Check if it's the same bank (would have been caught above)
        const uniqueBanks = new Set(occurrences.map(o => o.bankId))
        if(uniqueBanks.size > 1){
          crossBankDuplicates++
          console.log(`⚠️  ID "${id}" usado en ${occurrences.length} bancos diferentes:`)
          occurrences.slice(0, 5).forEach(o => {
            console.log(`   - Banco ${o.bankId} (${o.bankName}) pregunta #${o.questionIndex}`)
          })
        }
      }
    }
    
    console.log('\n' + '═'.repeat(60))
    console.log('📋 RESUMEN DE AUDITORÍA')
    console.log('═'.repeat(60))
    console.log(`Total de bancos: ${totalBanks}`)
    console.log(`Total de preguntas: ${totalQuestions}`)
    console.log(`Preguntas sin ID: ${questionsWithMissingIds}`)
    console.log(`Bancos con problemas: ${banksWithIssues}`)
    console.log(`IDs duplicados entre bancos: ${crossBankDuplicates}`)
    
    if(banksWithIssues === 0 && crossBankDuplicates === 0){
      console.log('\n✅ Todo correcto! Todos los bancos tienen IDs únicos.')
    } else {
      console.log('\n⚠️  Se encontraron problemas. Ejecuta fix_question_ids.js para corregirlos.')
    }
    
    process.exit(0)
  }catch(e){
    console.error('❌ Error en auditoría:', e.message)
    process.exit(1)
  }
}

auditAllBanks()
