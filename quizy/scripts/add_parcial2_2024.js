/**
 * Script para añadir el cuestionario Parcial 2 2024 de Arquitecturas Virtuales
 * Ejecutar con: DATABASE_URL="tu_url_postgres" node scripts/add_parcial2_2024.js
 */
const fs = require('fs')
const path = require('path')
const { Client } = require('pg')

async function addParcial2024() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ Por favor, define la variable DATABASE_URL')
    console.log('Ejemplo: DATABASE_URL="postgres://user:pass@host:5432/db" node scripts/add_parcial2_2024.js')
    process.exit(1)
  }

  const client = new Client({ 
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })
  
  try {
    await client.connect()
    console.log('✓ Conectado a la base de datos\n')

    // Leer el archivo JSON
    const filePath = path.join(__dirname, '../data/arq-virt/parcial2_2024_qna.json')
    const content = fs.readFileSync(filePath, 'utf8')
    const questions = JSON.parse(content)

    console.log(`📄 Archivo: parcial2_2024_qna.json`)
    console.log(`📊 Preguntas encontradas: ${questions.length}`)

    // Buscar el subject arq-virt
    const subjectResult = await client.query(
      'SELECT id FROM subjects WHERE slug = $1',
      ['arq-virt']
    )

    if (subjectResult.rows.length === 0) {
      console.error('❌ No se encontró la asignatura arq-virt')
      process.exit(1)
    }

    const subjectId = subjectResult.rows[0].id
    console.log(`✓ Asignatura arq-virt encontrada (ID: ${subjectId})`)

    // Verificar si ya existe
    const existingResult = await client.query(
      'SELECT id FROM question_banks WHERE name = $1 AND subject_id = $2',
      ['PARCIAL2_2024', subjectId]
    )

    if (existingResult.rows.length > 0) {
      console.log('⚠️  El cuestionario ya existe en la base de datos')
      
      // Actualizar en lugar de insertar
      await client.query(
        `UPDATE question_banks 
         SET questions = $1, updated_at = NOW()
         WHERE name = $2 AND subject_id = $3`,
        [JSON.stringify(questions), 'PARCIAL2_2024', subjectId]
      )
      console.log('✅ Cuestionario actualizado')
    } else {
      // Insertar nuevo
      const result = await client.query(
        `INSERT INTO question_banks 
         (name, description, subject_id, questions, created_by, is_published, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [
          'PARCIAL2_2024',
          'Examen Parcial 2 - 2024 - Arquitecturas Virtuales',
          subjectId,
          JSON.stringify(questions),
          'admin',
          true,
          true
        ]
      )
      console.log(`✅ Cuestionario creado (ID: ${result.rows[0].id})`)
    }

    console.log('\n🎉 ¡Proceso completado!')

  } catch (error) {
    console.error('\n❌ Error:', error.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

addParcial2024()
