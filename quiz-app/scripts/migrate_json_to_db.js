const fs = require('fs')
const path = require('path')

// Carga .env.local si existe
try{ require('dotenv').config({ path: path.join(process.cwd(), '.env.local') }) }catch(e){}

const { Client } = require('pg')

async function migrateJSONFiles() {
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  
  try {
    await client.connect()
    console.log('✓ Conectado a la base de datos\n')

    // Base folder for question banks
    let baseFolder = path.resolve(process.cwd(), '../bancoDePreguntas')
    if (!fs.existsSync(baseFolder)) {
      baseFolder = path.resolve(process.cwd(), 'data')
    }

    if (!fs.existsSync(baseFolder)) {
      console.log('❌ No se encontró carpeta con bancos de preguntas')
      process.exit(1)
    }

    console.log(`📂 Buscando archivos JSON en: ${baseFolder}\n`)

    let totalMigrated = 0
    let totalSkipped = 0

    // Get all subjects (folders and root)
    const items = fs.readdirSync(baseFolder)
    
    // Process root level JSON files (no subject)
    await processFolder(client, baseFolder, null, null)
    
    // Process each subject folder
    for (const item of items) {
      const itemPath = path.join(baseFolder, item)
      const stat = fs.statSync(itemPath)
      
      if (stat.isDirectory()) {
        console.log(`\n📚 Procesando asignatura: ${item}`)
        
        // Get or create subject
        const subjectResult = await client.query(
          'SELECT id FROM subjects WHERE slug = $1',
          [item]
        )
        
        let subjectId = null
        if (subjectResult.rows.length > 0) {
          subjectId = subjectResult.rows[0].id
          console.log(`  ✓ Asignatura encontrada (ID: ${subjectId})`)
        } else {
          // Create subject if it doesn't exist
          const newSubject = await client.query(
            `INSERT INTO subjects (name, slug, description) 
             VALUES ($1, $2, $3) 
             RETURNING id`,
            [item.toUpperCase(), item, `Asignatura ${item}`]
          )
          subjectId = newSubject.rows[0].id
          console.log(`  ✓ Asignatura creada (ID: ${subjectId})`)
        }
        
        const result = await processFolder(client, itemPath, item, subjectId)
        totalMigrated += result.migrated
        totalSkipped += result.skipped
      }
    }

    async function processFolder(client, folderPath, subjectName, subjectId) {
      let migrated = 0
      let skipped = 0
      
      // Get JSON files (_qna.json or .json)
      let files = fs.readdirSync(folderPath).filter(f => f.endsWith('_qna.json'))
      if (files.length === 0) {
        files = fs.readdirSync(folderPath).filter(f => 
          f.endsWith('.json') && 
          !f.includes('attempts') && 
          !f.includes('ranking')
        )
      }

      for (const file of files) {
        const filePath = path.join(folderPath, file)
        
        try {
          const content = fs.readFileSync(filePath, 'utf8')
          const data = JSON.parse(content)
          
          // Normalize questions array
          let questions = Array.isArray(data) ? data : (data.items || [])
          
          if (questions.length === 0) {
            console.log(`  ⚠️  ${file} - Sin preguntas, omitido`)
            skipped++
            continue
          }

          // Generate name from filename
          const baseName = file.replace(/_qna\.json$/, '').replace(/\.json$/, '')
          const displayName = baseName.toUpperCase()
          
          // Check if already exists in database
          const existingResult = await client.query(
            `SELECT id FROM question_banks 
             WHERE name = $1 AND subject_id ${subjectId ? '= $2' : 'IS NULL'}`,
            subjectId ? [displayName, subjectId] : [displayName]
          )

          if (existingResult.rows.length > 0) {
            console.log(`  ⏭️  ${file} - Ya existe en BD, omitido`)
            skipped++
            continue
          }

          // Insert into database
          const result = await client.query(
            `INSERT INTO question_banks 
             (name, description, subject_id, questions, created_by, is_published, is_active)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id`,
            [
              displayName,
              `Cuestionario ${displayName}${subjectName ? ` - ${subjectName}` : ''}`,
              subjectId,
              JSON.stringify(questions),
              'admin', // Created by admin
              true, // Published by default
              true // Active
            ]
          )

          console.log(`  ✅ ${file} - Migrado (${questions.length} preguntas, ID: ${result.rows[0].id})`)
          migrated++

        } catch (error) {
          console.error(`  ❌ Error procesando ${file}:`, error.message)
          skipped++
        }
      }

      return { migrated, skipped }
    }

    console.log('\n' + '='.repeat(50))
    console.log(`\n📊 Resumen de migración:`)
    console.log(`   ✅ Cuestionarios migrados: ${totalMigrated}`)
    console.log(`   ⏭️  Cuestionarios omitidos: ${totalSkipped}`)
    console.log(`   📢 Todos marcados como PUBLICADOS\n`)

    await client.end()
    process.exit(0)

  } catch (error) {
    console.error('\n❌ Error en la migración:', error)
    await client.end()
    process.exit(1)
  }
}

// Run migration
console.log('🚀 Iniciando migración de archivos JSON a base de datos...\n')
migrateJSONFiles()
