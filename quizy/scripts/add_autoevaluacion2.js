require('dotenv').config({ path: '.env.local' })
const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

async function addQuestionnaire() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  
  try {
    console.log('📚 Agregando Autoevaluación 2 (2025) a Arquitectura de Virtuales...')
    
    // Obtener el subject_id de arq-virt
    const subjectResult = await pool.query(
      "SELECT id FROM subjects WHERE slug = 'arq-virt'"
    )
    
    if (subjectResult.rows.length === 0) {
      console.error('❌ No se encontró la asignatura arq-virt')
      process.exit(1)
    }
    
    const subjectId = subjectResult.rows[0].id
    console.log(`✅ Asignatura encontrada: arq-virt (ID: ${subjectId})`)
    
    // Leer el archivo JSON
    const filePath = path.join(__dirname, '..', 'data', 'arq-virt', 'autoevaluacion2-2025.json')
    const questions = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    
    console.log(`📄 Archivo cargado: ${questions.length} preguntas`)
    
    // Verificar si ya existe
    const existingCheck = await pool.query(
      "SELECT id FROM question_banks WHERE name = 'AUTOEVALUACION2-2025' AND subject_id = $1",
      [subjectId]
    )
    
    if (existingCheck.rows.length > 0) {
      console.log('⚠️  El cuestionario ya existe. Actualizando...')
      await pool.query(
        `UPDATE question_banks 
         SET questions = $1, updated_at = NOW()
         WHERE id = $2`,
        [JSON.stringify(questions), existingCheck.rows[0].id]
      )
      console.log('✅ Cuestionario actualizado correctamente')
    } else {
      // Insertar el nuevo banco de preguntas
      const result = await pool.query(
        `INSERT INTO question_banks (name, subject_id, questions, is_published, created_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        ['AUTOEVALUACION2-2025', subjectId, JSON.stringify(questions), true, 'admin']
      )
      
      console.log(`✅ Cuestionario creado con ID: ${result.rows[0].id}`)
    }
    
    // Verificar
    const allBanks = await pool.query(
      `SELECT id, name, is_published 
       FROM question_banks 
       WHERE subject_id = $1 
       ORDER BY created_at DESC`,
      [subjectId]
    )
    
    console.log('\n📊 Cuestionarios en Arquitectura de Virtuales:')
    allBanks.rows.forEach(bank => {
      const status = bank.is_published ? '✅' : '❌'
      console.log(`   ${status} ${bank.name} (ID: ${bank.id})`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

addQuestionnaire()
