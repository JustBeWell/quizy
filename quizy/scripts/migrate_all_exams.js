/**
 * Script para migrar TODOS los exámenes JSON a la base de datos
 * Incluye archivos exam*.json, *_qna.json y otros .json
 * NO duplica registros existentes
 */

const fs = require('fs')
const path = require('path')

// Carga .env.local si existe
try{ require('dotenv').config({ path: path.join(process.cwd(), '.env.local') }) }catch(e){}

const { Client } = require('pg')

async function migrateAllExams() {
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  
  try {
    await client.connect()
    console.log('✓ Conectado a la base de datos\n')

    const baseFolder = path.resolve(process.cwd(), 'data')

    if (!fs.existsSync(baseFolder)) {
      console.log('❌ No se encontró carpeta data/')
      process.exit(1)
    }

    console.log(`📂 Buscando archivos JSON en: ${baseFolder}\n`)

    let totalMigrated = 0
    let totalSkipped = 0
    let totalErrors = 0

    // Get all subject folders
    const items = fs.readdirSync(baseFolder)
    
    // Process each subject folder
    for (const item of items) {
      const itemPath = path.join(baseFolder, item)
      const stat = fs.statSync(itemPath)
      
      if (!stat.isDirectory()) continue
      
      console.log(`\n📚 Procesando asignatura: ${item}`)
      
      // Get or create subject
      const subjectResult = await client.query(
        'SELECT id, name FROM subjects WHERE slug = $1',
        [item]
      )
      
      let subjectId = null
      let subjectName = item
      
      if (subjectResult.rows.length > 0) {
        subjectId = subjectResult.rows[0].id
        subjectName = subjectResult.rows[0].name
        console.log(`  ✓ Asignatura encontrada: ${subjectName} (ID: ${subjectId})`)
      } else {
        console.log(`  ⚠️  Asignatura "${item}" no encontrada en BD, se omitirá`)
        continue
      }
      
      // Get all JSON files in the folder
      const files = fs.readdirSync(itemPath).filter(f => 
        (f.endsWith('.json') || f.endsWith('_qna.json')) &&
        !f.includes('attempts') && 
        !f.includes('ranking') &&
        !f.startsWith('.')
      )
      
      if (files.length === 0) {
        console.log(`  ℹ️  No hay archivos JSON en esta carpeta`)
        continue
      }

      for (const file of files) {
        const filePath = path.join(itemPath, file)
        
        try {
          const content = fs.readFileSync(filePath, 'utf8')
          const data = JSON.parse(content)
          
          // Get name and questions
          let bankName = data.name || file.replace(/\.json$/, '').replace(/_qna$/, '')
          let questions = []
          
          if (data.questions && Array.isArray(data.questions)) {
            questions = data.questions
          } else if (data.items && Array.isArray(data.items)) {
            questions = data.items
          } else if (Array.isArray(data)) {
            questions = data
          }
          
          if (questions.length === 0) {
            console.log(`  ⚠️  ${file} - Sin preguntas válidas, omitido`)
            totalSkipped++
            continue
          }

          // Ensure questions have proper structure
          questions = questions.map((q, idx) => ({
            id: q.id || (idx + 1),
            question: q.question || q.pregunta || '',
            options: q.options || q.opciones || [],
            answers: q.answers || q.respuestas || []
          }))

          // Generate unique identifier for this bank
          const bankIdentifier = `${item}/${file}`
          
          // Check if already exists by file path
          const existingResult = await client.query(
            `SELECT id, name FROM question_banks 
             WHERE subject_id = $1 AND name = $2`,
            [subjectId, bankName]
          )

          if (existingResult.rows.length > 0) {
            console.log(`  ⏭️  ${file} - "${bankName}" ya existe en BD (ID: ${existingResult.rows[0].id}), omitido`)
            totalSkipped++
            continue
          }

          // Insert into database
          const result = await client.query(
            `INSERT INTO question_banks 
             (name, description, subject_id, questions, created_by, is_published, is_active)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id`,
            [
              bankName,
              `${bankName} - ${subjectName}`,
              subjectId,
              JSON.stringify(questions),
              'admin',
              true, // Published
              true  // Active
            ]
          )

          console.log(`  ✅ ${file} - "${bankName}" migrado (${questions.length} preguntas, ID: ${result.rows[0].id})`)
          totalMigrated++

        } catch (error) {
          console.error(`  ❌ Error procesando ${file}:`, error.message)
          totalErrors++
        }
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log(`\n📊 RESUMEN DE MIGRACIÓN:`)
    console.log(`   ✅ Cuestionarios nuevos migrados: ${totalMigrated}`)
    console.log(`   ⏭️  Cuestionarios ya existentes (omitidos): ${totalSkipped}`)
    console.log(`   ❌ Errores: ${totalErrors}`)
    console.log(`\n` + '='.repeat(60) + '\n')

    await client.end()
    process.exit(0)

  } catch (error) {
    console.error('\n❌ Error en la migración:', error)
    await client.end()
    process.exit(1)
  }
}

// Run migration
console.log('🚀 Iniciando migración completa de exámenes a base de datos...\n')
migrateAllExams()
