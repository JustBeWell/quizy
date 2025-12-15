import { query } from '../../../lib/db'
import { verifyToken } from '../../../lib/jwt'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb' // Permitir archivos JSON grandes
    }
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  // Verificar autenticación de admin
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado' })
  }

  const token = authHeader.substring(7)
  let decoded
  try {
    decoded = verifyToken(token)
    if (!decoded || !decoded.is_admin) {
      return res.status(403).json({ error: 'Se requieren permisos de administrador' })
    }
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' })
  }

  try {
    const { name, description, subject_id, questions, is_published = false } = req.body

    // Validaciones básicas
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'El nombre del cuestionario es obligatorio' })
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'El JSON debe contener un array de preguntas' })
    }

    // Validar estructura de cada pregunta
    const errors = []
    const validatedQuestions = questions.map((q, index) => {
      const questionNum = index + 1
      
      // Validar que tenga pregunta
      if (!q.question || typeof q.question !== 'string' || !q.question.trim()) {
        errors.push(`Pregunta ${questionNum}: falta el texto de la pregunta`)
        return null
      }

      // Validar opciones
      if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
        errors.push(`Pregunta ${questionNum}: debe tener al menos 2 opciones`)
        return null
      }

      // Normalizar opciones (soportar tanto {key, text} como strings)
      const normalizedOptions = q.options.map((opt, optIndex) => {
        if (typeof opt === 'string') {
          return { key: String.fromCharCode(97 + optIndex), text: opt }
        }
        if (opt && typeof opt === 'object' && opt.text) {
          return { 
            key: opt.key || String.fromCharCode(97 + optIndex), 
            text: opt.text 
          }
        }
        errors.push(`Pregunta ${questionNum}: opción ${optIndex + 1} tiene formato inválido`)
        return null
      }).filter(Boolean)

      if (normalizedOptions.length < 2) {
        errors.push(`Pregunta ${questionNum}: opciones inválidas`)
        return null
      }

      // Validar respuestas
      if (!q.answers || !Array.isArray(q.answers) || q.answers.length === 0) {
        errors.push(`Pregunta ${questionNum}: debe tener al menos una respuesta correcta`)
        return null
      }

      // Verificar que las respuestas correspondan a opciones válidas
      const validKeys = normalizedOptions.map(o => o.key)
      const invalidAnswers = q.answers.filter(a => !validKeys.includes(a))
      if (invalidAnswers.length > 0) {
        errors.push(`Pregunta ${questionNum}: respuestas inválidas [${invalidAnswers.join(', ')}]`)
        return null
      }

      return {
        id: q.id || questionNum,
        question: q.question.trim(),
        options: normalizedOptions,
        answers: q.answers
      }
    }).filter(Boolean)

    if (errors.length > 0) {
      return res.status(400).json({ 
        error: 'Errores de validación en el JSON',
        details: errors.slice(0, 10), // Limitar a 10 errores
        total_errors: errors.length
      })
    }

    // Verificar que el subject_id existe si se proporciona
    let processedSubjectId = null
    if (subject_id) {
      const subjectResult = await query(
        'SELECT id FROM subjects WHERE id = $1',
        [subject_id]
      )
      if (subjectResult.rows.length === 0) {
        return res.status(400).json({ error: 'La asignatura seleccionada no existe' })
      }
      processedSubjectId = parseInt(subject_id, 10)
    }

    // Verificar si ya existe un cuestionario con el mismo nombre en la misma asignatura
    const existingResult = await query(
      `SELECT id FROM question_banks 
       WHERE LOWER(name) = LOWER($1) 
       AND ${processedSubjectId ? 'subject_id = $2' : 'subject_id IS NULL'}`,
      processedSubjectId ? [name.trim(), processedSubjectId] : [name.trim()]
    )

    if (existingResult.rows.length > 0) {
      return res.status(409).json({ 
        error: 'Ya existe un cuestionario con ese nombre en esta asignatura',
        existing_id: existingResult.rows[0].id
      })
    }

    // Insertar en la base de datos
    const result = await query(
      `INSERT INTO question_banks 
       (name, description, subject_id, questions, created_by, is_published, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, created_at`,
      [
        name.trim(),
        description?.trim() || `Cuestionario importado: ${name.trim()}`,
        processedSubjectId,
        JSON.stringify(validatedQuestions),
        decoded.name || 'admin',
        is_published,
        true
      ]
    )

    const created = result.rows[0]

    return res.status(201).json({
      success: true,
      message: `Cuestionario "${name}" importado correctamente`,
      questionnaire: {
        id: created.id,
        name: created.name,
        questions_count: validatedQuestions.length,
        is_published,
        created_at: created.created_at
      }
    })

  } catch (error) {
    console.error('Error importing questionnaire:', error)
    return res.status(500).json({ 
      error: 'Error al importar el cuestionario',
      details: error.message
    })
  }
}
