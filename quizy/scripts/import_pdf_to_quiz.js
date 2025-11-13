#!/usr/bin/env node

/**
 * Script para importar PDFs y generar cuestionarios automáticamente
 * Uso: node scripts/import_pdf_to_quiz.js [directorio] [asignatura]
 * Ejemplo: node scripts/import_pdf_to_quiz.js data/ingenieria-web "Ingeniería Web"
 */

// Cargar variables de entorno desde .env.local
require('dotenv').config({ path: '.env.local' })

const fs = require('fs').promises
const path = require('path')
const pdfParse = require('pdf-parse')
const OpenAI = require('openai')
const { query } = require('../lib/db')

/**
 * Extrae el texto de un PDF
 */
async function extractTextFromPDF(filePath) {
  try {
    const dataBuffer = await fs.readFile(filePath)
    const data = await pdfParse(dataBuffer)
    return data.text
  } catch (error) {
    console.error(`❌ Error al leer PDF ${filePath}:`, error.message)
    return null
  }
}

/**
 * Genera preguntas usando OpenAI a partir del texto
 */
async function generateQuestions(text, fileName, maxQuestions = 10) {
  try {
    console.log(`🤖 Generando preguntas para ${fileName}...`)
    
    // Configurar OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
    
    const prompt = `Eres un profesor experto creando preguntas de examen tipo test.

Analiza el siguiente contenido educativo y genera ${maxQuestions} preguntas de opción múltiple de calidad.

CONTENIDO:
${text.substring(0, 8000)} 

INSTRUCCIONES:
1. Genera exactamente ${maxQuestions} preguntas que cubran los conceptos más importantes
2. Cada pregunta debe tener 4 opciones (a, b, c, d)
3. Solo UNA opción debe ser correcta
4. Las preguntas deben ser claras y sin ambigüedades
5. Incluye preguntas de diferentes niveles de dificultad
6. Enfócate en conceptos clave, definiciones y aplicaciones prácticas

FORMATO DE RESPUESTA (JSON):
{
  "questions": [
    {
      "question": "Texto de la pregunta",
      "options": [
        {"key": "a", "text": "Opción a"},
        {"key": "b", "text": "Opción b"},
        {"key": "c", "text": "Opción c"},
        {"key": "d", "text": "Opción d"}
      ],
      "answers": ["a"]
    }
  ]
}

Responde SOLO con el JSON, sin texto adicional.`

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Eres un asistente que genera preguntas de examen en formato JSON. Respondes SOLO con JSON válido, sin markdown ni explicaciones."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 3000
    })

    const content = response.choices[0].message.content.trim()
    
    // Limpiar markdown si existe
    let jsonContent = content
    if (content.startsWith('```')) {
      jsonContent = content.replace(/```json\n?|\n?```/g, '').trim()
    }
    
    const result = JSON.parse(jsonContent)
    console.log(`✅ Generadas ${result.questions.length} preguntas`)
    
    return result.questions
  } catch (error) {
    console.error(`❌ Error al generar preguntas:`, error.message)
    if (error.response) {
      console.error('Respuesta de OpenAI:', error.response.data)
    }
    return []
  }
}

/**
 * Parsea el nombre del archivo para extraer tema y parte
 * Ejemplos: 
 * - "Ing_Web_1_2.pdf" -> {tema: 1, parte: 2}
 * - "Ingenieria_Web_Tema_1_1_1_3.pdf" -> {tema: 1, parte: 1}
 */
function parseFileName(fileName) {
  const name = path.basename(fileName, '.pdf')
  
  // Buscar patrones de números
  const match = name.match(/(\d+)[_\s]+(\d+)/)
  
  if (match) {
    return {
      tema: parseInt(match[1]),
      parte: parseInt(match[2])
    }
  }
  
  // Si no hay match, usar un valor por defecto
  return { tema: 1, parte: 1 }
}

/**
 * Inserta o actualiza un banco de preguntas en la base de datos
 * IMPORTANTE: Añade IDs únicos a las preguntas antes de guardar
 */
async function insertQuestionBank(subjectId, name, questions) {
  try {
    // Verificar si ya existe un banco con este nombre
    const existing = await query(
      'SELECT id FROM question_banks WHERE subject_id = $1 AND name = $2',
      [subjectId, name]
    )
    
    let bankId
    let questionsWithIds
    
    if (existing.rows.length > 0) {
      // Actualizar banco existente
      bankId = existing.rows[0].id
      
      // Añadir IDs únicos a las preguntas usando el bankId existente
      questionsWithIds = questions.map((q, i) => ({
        ...q,
        id: q.id || `${bankId}_q${i}` // Mantener ID si existe, sino generar nuevo
      }))
      
      await query(
        'UPDATE question_banks SET questions = $1, updated_at = NOW() WHERE id = $2',
        [JSON.stringify(questionsWithIds), bankId]
      )
      console.log(`♻️  Banco actualizado: ${name} (ID: ${bankId}) - ${questionsWithIds.length} preguntas con IDs únicos`)
    } else {
      // Crear nuevo banco - necesitamos insertar primero para obtener el ID
      const result = await query(
        'INSERT INTO question_banks (subject_id, name, questions, created_by) VALUES ($1, $2, $3, $4) RETURNING id',
        [subjectId, name, JSON.stringify([]), 'admin'] // Insertar vacío primero
      )
      bankId = result.rows[0].id
      
      // Ahora añadir IDs únicos usando el bankId generado
      questionsWithIds = questions.map((q, i) => ({
        ...q,
        id: `${bankId}_q${i}`
      }))
      
      // Actualizar con las preguntas que tienen IDs
      await query(
        'UPDATE question_banks SET questions = $1, updated_at = NOW() WHERE id = $2',
        [JSON.stringify(questionsWithIds), bankId]
      )
      console.log(`✅ Banco creado: ${name} (ID: ${bankId}) - ${questionsWithIds.length} preguntas con IDs únicos`)
    }
    
    return bankId
  } catch (error) {
    console.error(`❌ Error al insertar banco:`, error.message)
    throw error
  }
}

/**
 * Obtiene o crea una asignatura
 */
async function getOrCreateSubject(subjectName) {
  try {
    // Buscar si existe
    let result = await query(
      'SELECT id FROM subjects WHERE name = $1',
      [subjectName]
    )
    
    if (result.rows.length > 0) {
      console.log(`📚 Asignatura encontrada: ${subjectName} (ID: ${result.rows[0].id})`)
      return result.rows[0].id
    }
    
    // Crear nueva asignatura
    result = await query(
      'INSERT INTO subjects (name, description) VALUES ($1, $2) RETURNING id',
      [subjectName, `Cuestionarios de ${subjectName}`]
    )
    
    console.log(`✨ Asignatura creada: ${subjectName} (ID: ${result.rows[0].id})`)
    return result.rows[0].id
  } catch (error) {
    console.error(`❌ Error al obtener/crear asignatura:`, error.message)
    throw error
  }
}

/**
 * Procesa todos los PDFs de un directorio
 */
async function processDirectory(dirPath, subjectName, maxQuestionsPerPDF = 10) {
  try {
    console.log(`\n🚀 Iniciando procesamiento de PDFs...`)
    console.log(`📂 Directorio: ${dirPath}`)
    console.log(`📚 Asignatura: ${subjectName}`)
    console.log(`❓ Preguntas por PDF: ${maxQuestionsPerPDF}\n`)
    
    // Verificar que existe la API key
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('❌ Falta OPENAI_API_KEY en las variables de entorno')
    }
    
    // Obtener o crear asignatura
    const subjectId = await getOrCreateSubject(subjectName)
    
    // Leer archivos del directorio
    const files = await fs.readdir(dirPath)
    const pdfFiles = files.filter(f => f.toLowerCase().endsWith('.pdf'))
    
    console.log(`📄 Encontrados ${pdfFiles.length} archivos PDF\n`)
    
    let processed = 0
    let failed = 0
    
    for (const file of pdfFiles) {
      const filePath = path.join(dirPath, file)
      const { tema, parte } = parseFileName(file)
      const bankName = `Tema ${tema}.${parte}`
      
      console.log(`\n${'='.repeat(60)}`)
      console.log(`📖 Procesando: ${file}`)
      console.log(`📌 Identificado como: ${bankName}`)
      console.log(`${'='.repeat(60)}`)
      
      try {
        // 1. Extraer texto del PDF
        console.log(`📄 Extrayendo texto...`)
        const text = await extractTextFromPDF(filePath)
        
        if (!text || text.length < 100) {
          console.log(`⚠️  Texto extraído muy corto o vacío, omitiendo...`)
          failed++
          continue
        }
        
        console.log(`✅ Texto extraído: ${text.length} caracteres`)
        
        // 2. Generar preguntas con IA
        const questions = await generateQuestions(text, file, maxQuestionsPerPDF)
        
        if (questions.length === 0) {
          console.log(`⚠️  No se generaron preguntas, omitiendo...`)
          failed++
          continue
        }
        
        // 3. Insertar en base de datos
        await insertQuestionBank(subjectId, bankName, questions)
        
        processed++
        console.log(`✅ Completado: ${file}`)
        
      } catch (error) {
        console.error(`❌ Error procesando ${file}:`, error.message)
        failed++
      }
    }
    
    console.log(`\n${'='.repeat(60)}`)
    console.log(`🎉 RESUMEN FINAL`)
    console.log(`${'='.repeat(60)}`)
    console.log(`✅ Procesados exitosamente: ${processed}`)
    console.log(`❌ Fallidos: ${failed}`)
    console.log(`📊 Total: ${pdfFiles.length}`)
    console.log(`${'='.repeat(60)}\n`)
    
  } catch (error) {
    console.error(`\n❌ ERROR FATAL:`, error.message)
    process.exit(1)
  }
}

// Ejecutar script
const args = process.argv.slice(2)
const dirPath = args[0] || 'data/ingenieria-web'
const subjectName = args[1] || 'Ingeniería Web'
const maxQuestions = parseInt(args[2]) || 10

console.log(`
╔═══════════════════════════════════════════════════════════╗
║     📚 GENERADOR AUTOMÁTICO DE CUESTIONARIOS DESDE PDF    ║
╚═══════════════════════════════════════════════════════════╝
`)

processDirectory(dirPath, subjectName, maxQuestions)
  .then(() => {
    console.log('✅ Script completado exitosamente')
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ Error fatal:', error)
    process.exit(1)
  })
