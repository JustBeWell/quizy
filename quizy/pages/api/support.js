import { query } from '../../lib/db'
import { verifyToken } from '../../lib/jwt'
import { sendTicketUpdateEmail, sendNewTicketNotificationToAdmin } from '../../lib/email'
import { validateText } from '../../lib/profanity-filter'

export default async function handler(req, res) {
  const { method } = req

  try {
    switch (method) {
      case 'GET':
        return await handleGet(req, res)
      case 'POST':
        return await handlePost(req, res)
      case 'PUT':
        return await handlePut(req, res)
      default:
        return res.status(405).json({ error: 'Método no permitido' })
    }
  } catch (error) {
    console.error('Error in support API:', error)
    return res.status(500).json({ error: 'Error del servidor', details: error.message })
  }
}

async function handleGet(req, res) {
  // Get support tickets - admin only can see all, users can see their own
  const authHeader = req.headers.authorization
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('[Support GET] No authorization header')
    return res.status(401).json({ error: 'No autorizado' })
  }

  const token = authHeader.substring(7)
  const decoded = verifyToken(token)
  
  if (!decoded) {
    console.log('[Support GET] Token verification failed')
    return res.status(401).json({ error: 'Token inválido' })
  }
  
  console.log('[Support GET] User:', decoded.id, decoded.name, 'is_admin:', decoded.is_admin)

  const { status, user_email, page = 1, limit = 50 } = req.query
  const pageNum = parseInt(page) || 1
  const limitNum = Math.min(parseInt(limit) || 50, 100) // Max 100 por página
  const offset = (pageNum - 1) * limitNum
  
  let sql = 'SELECT * FROM support_tickets WHERE 1=1'
  const params = []
  let paramCount = 1

  // If not admin, only show user's own tickets
  if (!decoded.is_admin) {
    // For old tokens without email, we can't filter properly
    if (!decoded.email) {
      console.log('[Support GET] Old token without email detected')
      return res.status(401).json({ 
        error: 'token_outdated',
        message: 'Tu sesión es antigua. Por favor, cierra sesión y vuelve a iniciar sesión para continuar.' 
      })
    }
    
    console.log('[Support GET] Filtering by user email:', decoded.email)
    sql += ` AND user_email = $${paramCount}`
    params.push(decoded.email)
    paramCount++
  } else if (user_email) {
    // Admin filtering by user email
    console.log('[Support GET] Admin filtering by email:', user_email)
    sql += ` AND user_email = $${paramCount}`
    params.push(user_email)
    paramCount++
  } else {
    console.log('[Support GET] Admin viewing all tickets')
  }

  if (status) {
    console.log('[Support GET] Filtering by status:', status)
    sql += ` AND status = $${paramCount}`
    params.push(status)
    paramCount++
  }

  sql += ' ORDER BY created_at DESC'
  
  console.log('[Support GET] SQL:', sql)
  console.log('[Support GET] Params:', params)
  
  // Get total count - construct a separate clean query
  let countSql = 'SELECT COUNT(*) FROM support_tickets WHERE 1=1'
  const countParams = []
  let countParamIndex = 1
  
  // Rebuild the same WHERE conditions for count
  if (!decoded.is_admin) {
    countSql += ` AND user_email = $${countParamIndex}`
    countParams.push(decoded.email)
    countParamIndex++
  } else if (user_email) {
    countSql += ` AND user_email = $${countParamIndex}`
    countParams.push(user_email)
    countParamIndex++
  }
  
  if (status) {
    countSql += ` AND status = $${countParamIndex}`
    countParams.push(status)
  }
  
  console.log('[Support GET] Count SQL:', countSql)
  console.log('[Support GET] Count Params:', countParams)
  
  const countResult = await query(countSql, countParams)
  const total = parseInt(countResult.rows[0].count)
  
  console.log('[Support GET] Total tickets found:', total)
  
  // Add pagination
  sql += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`
  params.push(limitNum, offset)

  const result = await query(sql, params)
  
  console.log('[Support GET] Returning', result.rows.length, 'tickets')
  
  return res.status(200).json({
    tickets: result.rows,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  })
}

async function handlePost(req, res) {
  // Create new support ticket - any authenticated user
  const authHeader = req.headers.authorization
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado' })
  }

  const token = authHeader.substring(7)
  const decoded = verifyToken(token)
  
  if (!decoded) {
    return res.status(401).json({ error: 'Token inválido' })
  }

  // Check if token has email field (new tokens have it, old ones don't)
  if (!decoded.email) {
    return res.status(401).json({ 
      error: 'token_outdated',
      message: 'Tu sesión es antigua. Por favor, cierra sesión y vuelve a iniciar sesión para continuar.' 
    })
  }

  // Verificar que el usuario haya verificado su email
  const userCheck = await query(
    'SELECT email_verified FROM users WHERE id = $1',
    [decoded.id]
  )

  if (userCheck.rows.length === 0) {
    // Usuario no existe en BD (fue eliminado)
    return res.status(403).json({ 
      error: 'user_not_found',
      message: 'Tu cuenta de usuario no existe. Por favor, registra una nueva cuenta.' 
    })
  }

  if (!userCheck.rows[0].email_verified) {
    return res.status(403).json({ 
      error: 'email_not_verified',
      message: 'Debes verificar tu email antes de poder crear tickets de soporte.' 
    })
  }

  const { subject, message } = req.body

  if (!subject || !message) {
    return res.status(400).json({ 
      error: 'Faltan campos requeridos: subject, message' 
    })
  }

  // Validar que el asunto no contenga palabras inapropiadas
  const subjectValidation = await validateText(subject, 200)
  if (!subjectValidation.valid) {
    return res.status(400).json({ 
      error: subjectValidation.error 
    })
  }

  // Validar que el mensaje no contenga palabras inapropiadas
  const messageValidation = await validateText(message, 2000)
  if (!messageValidation.valid) {
    return res.status(400).json({ 
      error: messageValidation.error 
    })
  }

  const result = await query(
    `INSERT INTO support_tickets (user_email, user_name, subject, message, status)
     VALUES ($1, $2, $3, $4, 'open')
     RETURNING *`,
    [decoded.email, decoded.name, subject, message]
  )

  const newTicket = result.rows[0]

  // Enviar notificación al admin sobre el nuevo ticket
  try {
    await sendNewTicketNotificationToAdmin(
      decoded.email,
      decoded.name,
      subject,
      message,
      newTicket.id
    )
    console.log(`✓ Notificación de nuevo ticket #${newTicket.id} enviada al admin`)
  } catch (emailError) {
    // No fallar la creación del ticket si falla el email
    console.error('Error enviando notificación al admin:', emailError)
  }

  return res.status(201).json(newTicket)
}

async function handlePut(req, res) {
  // Update support ticket - admin only
  const authHeader = req.headers.authorization
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado' })
  }

  const token = authHeader.substring(7)
  const decoded = verifyToken(token)
  
  if (!decoded || !decoded.is_admin) {
    return res.status(403).json({ error: 'Se requieren permisos de administrador' })
  }

  const { id, status, admin_response } = req.body

  if (!id) {
    return res.status(400).json({ error: 'Se requiere el ID del ticket' })
  }

  // Primero obtener el ticket actual para tener el estado anterior y el email
  const currentTicket = await query('SELECT * FROM support_tickets WHERE id = $1', [id])
  
  if (currentTicket.rows.length === 0) {
    return res.status(404).json({ error: 'Ticket no encontrado' })
  }

  const oldTicket = currentTicket.rows[0]
  const oldStatus = oldTicket.status

  const updates = []
  const params = []
  let paramCount = 1

  if (status !== undefined) {
    updates.push(`status = $${paramCount}`)
    params.push(status)
    paramCount++
    
    // Si el ticket se está descartando, guardar info del admin
    if (status === 'discarded') {
      updates.push(`discarded_by = $${paramCount}`)
      params.push(decoded.name)
      paramCount++
      
      updates.push(`discarded_at = NOW()`)
    }
  }

  if (admin_response !== undefined) {
    updates.push(`admin_response = $${paramCount}`)
    params.push(admin_response)
    paramCount++
    
    updates.push(`responded_by = $${paramCount}`)
    params.push(decoded.name)
    paramCount++
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No hay campos para actualizar' })
  }

  params.push(id)
  const sql = `UPDATE support_tickets SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`

  const result = await query(sql, params)

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Ticket no encontrado' })
  }

  const updatedTicket = result.rows[0]

  // Enviar email de notificación si hubo cambios significativos
  if (oldTicket.user_email && (status !== undefined || admin_response !== undefined)) {
    try {
      const hasStatusChanged = status !== undefined && status !== oldStatus
      const hasMessage = admin_response !== undefined && admin_response.trim() !== ''
      
      // Solo enviar si hay cambio de estado o mensaje nuevo
      if (hasStatusChanged || hasMessage) {
        await sendTicketUpdateEmail(
          oldTicket.user_email,
          oldTicket.user_name || 'Usuario',
          oldTicket.subject,
          oldStatus,
          updatedTicket.status,
          admin_response || null
        )
        console.log(`✓ Email de notificación enviado a ${oldTicket.user_email}`)
      }
    } catch (emailError) {
      // No fallar la request si falla el email
      console.error('Error enviando email de notificación:', emailError)
    }
  }

  return res.status(200).json(updatedTicket)
}
