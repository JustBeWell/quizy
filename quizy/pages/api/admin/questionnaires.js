import { query } from '../../../lib/db'
import { verifyToken } from '../../../lib/jwt'

export default async function handler(req, res) {
  const { method } = req

  try {
    // Verify admin authentication
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No autorizado' })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    
    if (!decoded || !decoded.is_admin) {
      return res.status(403).json({ error: 'Se requieren permisos de administrador' })
    }

    switch (method) {
      case 'GET':
        return await handleGet(req, res)
      case 'POST':
        return await handlePost(req, res, decoded.name)
      case 'PUT':
        return await handlePut(req, res, decoded.name)
      case 'PATCH':
        return await handlePatch(req, res)
      case 'DELETE':
        return await handleDelete(req, res)
      default:
        return res.status(405).json({ error: 'Método no permitido' })
    }
  } catch (error) {
    console.error('Error in questionnaires API:', error)
    return res.status(500).json({ error: 'Error del servidor', details: error.message })
  }
}

async function handleGet(req, res) {
  const { id, subject_id } = req.query

  if (id) {
    // Get single questionnaire
    const result = await query(
      'SELECT * FROM question_banks WHERE id = $1',
      [id]
    )
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cuestionario no encontrado' })
    }

    return res.status(200).json(result.rows[0])
  }

  // Get all questionnaires (optionally filtered by subject)
  // For admin, show ALL questionnaires (published and unpublished)
  let sql = 'SELECT qb.*, s.name as subject_name FROM question_banks qb LEFT JOIN subjects s ON qb.subject_id = s.id WHERE qb.is_active = true'
  const params = []

  if (subject_id) {
    sql += ' AND qb.subject_id = $1'
    params.push(subject_id)
  }

  sql += ' ORDER BY qb.created_at DESC'

  const result = await query(sql, params)
  return res.status(200).json(result.rows)
}

async function handlePost(req, res, adminName) {
  const { name, description, subject_id, questions } = req.body

  if (!name || !questions || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ 
      error: 'Faltan campos requeridos: name, questions (debe ser un array no vacío)' 
    })
  }

  // Validate question format
  for (const q of questions) {
    if (!q.question || !q.options || !Array.isArray(q.options) || !q.answers || !Array.isArray(q.answers)) {
      return res.status(400).json({ 
        error: 'Formato de pregunta inválido. Cada pregunta debe tener: question, options (array), answers (array)' 
      })
    }
  }

  // Ensure subject_id is either a valid integer or null
  const processedSubjectId = subject_id && !isNaN(subject_id) ? parseInt(subject_id, 10) : null

  const result = await query(
    `INSERT INTO question_banks (name, description, subject_id, questions, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [name, description || null, processedSubjectId, JSON.stringify(questions), adminName]
  )

  return res.status(201).json(result.rows[0])
}

async function handlePut(req, res, adminName) {
  const { id, name, description, subject_id, questions, is_active } = req.body

  if (!id) {
    return res.status(400).json({ error: 'Se requiere el ID del cuestionario' })
  }

  // Build dynamic update query
  const updates = []
  const params = []
  let paramCount = 1

  if (name !== undefined) {
    updates.push(`name = $${paramCount}`)
    params.push(name)
    paramCount++
  }

  if (description !== undefined) {
    updates.push(`description = $${paramCount}`)
    params.push(description)
    paramCount++
  }

  if (subject_id !== undefined) {
    // Ensure subject_id is either a valid integer or null
    const processedSubjectId = subject_id && !isNaN(subject_id) ? parseInt(subject_id, 10) : null
    updates.push(`subject_id = $${paramCount}`)
    params.push(processedSubjectId)
    paramCount++
  }

  if (questions !== undefined) {
    if (!Array.isArray(questions)) {
      return res.status(400).json({ error: 'questions debe ser un array' })
    }
    updates.push(`questions = $${paramCount}`)
    params.push(JSON.stringify(questions))
    paramCount++
  }

  if (is_active !== undefined) {
    updates.push(`is_active = $${paramCount}`)
    params.push(is_active)
    paramCount++
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No hay campos para actualizar' })
  }

  params.push(id)
  const sql = `UPDATE question_banks SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`

  const result = await query(sql, params)

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Cuestionario no encontrado' })
  }

  return res.status(200).json(result.rows[0])
}

async function handlePatch(req, res) {
  const { id, action } = req.body

  if (!id || !action) {
    return res.status(400).json({ error: 'Se requiere id y action' })
  }

  if (action === 'publish') {
    // Publish questionnaire (make it visible to all users)
    const result = await query(
      'UPDATE question_banks SET is_published = true WHERE id = $1 AND is_active = true RETURNING *',
      [id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cuestionario no encontrado' })
    }

    return res.status(200).json({ message: 'Cuestionario publicado', questionnaire: result.rows[0] })
  }

  if (action === 'unpublish') {
    // Unpublish questionnaire (make it private, only visible to admin)
    const result = await query(
      'UPDATE question_banks SET is_published = false WHERE id = $1 AND is_active = true RETURNING *',
      [id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cuestionario no encontrado' })
    }

    return res.status(200).json({ message: 'Cuestionario despublicado', questionnaire: result.rows[0] })
  }

  return res.status(400).json({ error: 'Acción no válida. Use "publish" o "unpublish"' })
}

async function handleDelete(req, res) {
  const { id } = req.query

  if (!id) {
    return res.status(400).json({ error: 'Se requiere el ID del cuestionario' })
  }

  // Check if questionnaire is published
  const checkResult = await query(
    'SELECT is_published FROM question_banks WHERE id = $1 AND is_active = true',
    [id]
  )

  if (checkResult.rows.length === 0) {
    return res.status(404).json({ error: 'Cuestionario no encontrado' })
  }

  const isPublished = checkResult.rows[0].is_published

  if (isPublished) {
    // If published, unpublish it (keep it in database but hidden from users)
    const result = await query(
      'UPDATE question_banks SET is_published = false WHERE id = $1 RETURNING *',
      [id]
    )
    return res.status(200).json({ 
      message: 'Cuestionario despublicado (ahora solo visible para admin)', 
      questionnaire: result.rows[0],
      action: 'unpublished'
    })
  } else {
    // If not published, soft delete it (mark as inactive)
    const result = await query(
      'UPDATE question_banks SET is_active = false WHERE id = $1 RETURNING *',
      [id]
    )
    return res.status(200).json({ 
      message: 'Cuestionario eliminado definitivamente', 
      questionnaire: result.rows[0],
      action: 'deleted'
    })
  }
}
