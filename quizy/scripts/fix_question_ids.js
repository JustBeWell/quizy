#!/usr/bin/env node
/**
 * Script para regenerar IDs únicos en bancos de preguntas existentes
 * 
 * NOTA: Este script solo es necesario para bancos importados ANTES de la
 * actualización del import_pdf_to_quiz.js. Los nuevos bancos ya vienen
 * con IDs únicos desde el momento de la importación.
 * 
 * Uso: node scripts/fix_question_ids.js [--force]
 *      --force: Regenera IDs incluso si ya existen (no recomendado)
 */
require('dotenv').config({ path: '.env.local' })
const { query } = require('../lib/db')

const forceRegenerate = process.argv.includes('--force')

async function fix(){
  try{
    console.log('🔧 Verificando y regenerando IDs únicos...\n')
    
    if(forceRegenerate){
      console.log('⚠️  Modo --force activado: regenerará TODOS los IDs\n')
    }
    
    const banks = await query('SELECT id, name, questions FROM question_banks WHERE questions IS NOT NULL ORDER BY id')
    let updatedCount = 0
    let skippedCount = 0
    let totalQuestionsFixed = 0
    
    // Track all IDs globally to detect duplicates
    const allIds = new Map()
    
    for(const b of banks.rows){
      const bankId = b.id
      const name = b.name || String(bankId)
      const questions = Array.isArray(b.questions) ? b.questions : []
      
      // Check if questions already have proper IDs
      const needsUpdate = forceRegenerate || questions.some((q, i) => {
        // Missing ID or doesn't follow the bankId_qIndex pattern
        return !q.id || q.id !== `${bankId}_q${i}`
      })
      
      if(!needsUpdate){
        skippedCount++
        console.log(`⏭️  Banco ${bankId} (${name}) - Ya tiene IDs correctos, omitiendo`)
        continue
      }
      
      // Regenerate IDs to ensure uniqueness across all banks
      const newQs = questions.map((q,i)=>{
        const newId = `${bankId}_q${i}`
        
        // Track for duplicate detection
        if(allIds.has(newId)){
          console.warn(`⚠️  Posible colisión de ID: ${newId} en banco ${bankId}`)
        }
        allIds.set(newId, {bankId, bankName: name, questionIndex: i})
        
        return { ...q, id: newId }
      })
      
      await query('UPDATE question_banks SET questions = $1, updated_at = NOW() WHERE id = $2', [JSON.stringify(newQs), bankId])
      console.log(`✅ Banco ${bankId} (${name}) - ${questions.length} preguntas actualizadas`)
      updatedCount++
      totalQuestionsFixed += questions.length
    }
    
    console.log('\n' + '═'.repeat(60))
    console.log(`✅ Bancos actualizados: ${updatedCount}`)
    console.log(`⏭️  Bancos omitidos (ya correctos): ${skippedCount}`)
    console.log(`✅ Preguntas actualizadas: ${totalQuestionsFixed}`)
    console.log(`📊 IDs únicos generados: ${allIds.size}`)
    console.log('═'.repeat(60))
    
    if(updatedCount === 0 && skippedCount > 0){
      console.log('\n💡 Todos los bancos ya tienen IDs correctos. No se realizaron cambios.')
    }
    
    process.exit(0)
  }catch(e){
    console.error('❌ Error actualizando bancos:', e.message)
    process.exit(1)
  }
}

fix()
