import { Pool } from 'pg'
import { verifyToken } from '../../../lib/jwt'
import nodemailer from 'nodemailer'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
})

async function query(text, params) {
  const res = await pool.query(text, params)
  return res
}

// Configurar transporter de nodemailer
function getTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  })
}

// Generar HTML del email con estilo profesional
function generateEmailHTML(subject, content, userName) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f4f4f5;
        }
        .wrapper {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .container {
          background: #ffffff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 40px 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
        }
        .header .subtitle {
          margin: 10px 0 0 0;
          opacity: 0.9;
          font-size: 14px;
        }
        .logo {
          font-size: 48px;
          margin-bottom: 10px;
        }
        .content {
          padding: 40px 30px;
        }
        .greeting {
          font-size: 18px;
          color: #374151;
          margin-bottom: 20px;
        }
        .message-box {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-left: 4px solid #667eea;
          padding: 25px;
          border-radius: 0 12px 12px 0;
          margin: 25px 0;
        }
        .message-box p {
          margin: 0;
          color: #374151;
          font-size: 16px;
          line-height: 1.7;
          white-space: pre-wrap;
        }
        .cta-section {
          text-align: center;
          margin: 30px 0;
        }
        .button {
          display: inline-block;
          padding: 16px 32px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          transition: transform 0.2s;
        }
        .button:hover {
          transform: translateY(-2px);
        }
        .divider {
          height: 1px;
          background: linear-gradient(to right, transparent, #e5e7eb, transparent);
          margin: 30px 0;
        }
        .footer {
          background: #f9fafb;
          padding: 25px 30px;
          text-align: center;
          border-top: 1px solid #e5e7eb;
        }
        .footer p {
          margin: 0;
          color: #6b7280;
          font-size: 13px;
        }
        .footer a {
          color: #667eea;
          text-decoration: none;
        }
        .social-links {
          margin-top: 15px;
        }
        .social-links a {
          display: inline-block;
          margin: 0 8px;
          color: #9ca3af;
          font-size: 12px;
        }
        .badge {
          display: inline-block;
          background: rgba(255,255,255,0.2);
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          margin-top: 15px;
        }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="header">
            <div class="logo">📚</div>
            <h1>Quizy</h1>
            <p class="subtitle">Tu plataforma de aprendizaje</p>
            <div class="badge">📢 Mensaje importante</div>
          </div>
          
          <div class="content">
            <p class="greeting">Hola <strong>${userName || 'estudiante'}</strong>,</p>
            
            <p style="color: #6b7280; margin-bottom: 25px;">
              Te escribimos desde Quizy para compartir algo importante contigo:
            </p>
            
            <div class="message-box">
              <p>${content.replace(/\n/g, '<br>')}</p>
            </div>
            
            <div class="cta-section">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://quizy.es'}" class="button">
                🚀 Ir a Quizy
              </a>
            </div>
            
            <div class="divider"></div>
            
            <p style="color: #9ca3af; font-size: 14px; text-align: center;">
              Si tienes alguna pregunta, no dudes en contactarnos desde la sección de soporte.
            </p>
          </div>
          
          <div class="footer">
            <p><strong>Quizy</strong> - Aprende con cuestionarios interactivos</p>
            <p style="margin-top: 10px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://quizy.es'}">quizy.es</a>
            </p>
            <div class="social-links">
              <span style="color: #9ca3af; font-size: 11px;">
                Este email fue enviado a todos los usuarios de Quizy.
                <br>
                Si no deseas recibir más emails, puedes desactivar las notificaciones en tu perfil.
              </span>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  // Verificar autenticación de admin
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    return res.status(401).json({ error: 'No autorizado' })
  }

  const decoded = verifyToken(token)
  if (!decoded || !decoded.id) {
    return res.status(401).json({ error: 'Token inválido' })
  }

  // Verificar si es admin
  try {
    const adminCheck = await query(
      'SELECT is_admin FROM users WHERE id = $1',
      [decoded.id]
    )

    if (!adminCheck.rows[0]?.is_admin) {
      return res.status(403).json({ error: 'Acceso denegado. Solo administradores.' })
    }
  } catch (error) {
    console.error('Error checking admin status:', error)
    return res.status(500).json({ error: 'Error al verificar permisos' })
  }

  // Verificar configuración de email
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    return res.status(500).json({ 
      error: 'El servicio de email no está configurado. Contacta al administrador del sistema.' 
    })
  }

  try {
    const { subject, content, sendNotification = true } = req.body

    // Validaciones
    if (!subject || typeof subject !== 'string' || !subject.trim()) {
      return res.status(400).json({ error: 'El asunto es obligatorio' })
    }

    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ error: 'El contenido es obligatorio' })
    }

    if (subject.length > 200) {
      return res.status(400).json({ error: 'El asunto no puede exceder 200 caracteres' })
    }

    if (content.length > 10000) {
      return res.status(400).json({ error: 'El contenido no puede exceder 10000 caracteres' })
    }

    // Obtener todos los usuarios con email y notificaciones habilitadas
    const usersResult = await query(
      `SELECT id, name, email 
       FROM users 
       WHERE email IS NOT NULL 
       AND email != '' 
       AND notifications_enabled = true`
    )

    if (usersResult.rows.length === 0) {
      return res.status(400).json({ error: 'No hay usuarios con email y notificaciones habilitadas' })
    }

    const transporter = getTransporter()
    const results = {
      sent: 0,
      failed: 0,
      errors: []
    }

    // Enviar emails en lotes para evitar límites de Gmail
    const BATCH_SIZE = 10
    const DELAY_BETWEEN_BATCHES = 2000 // 2 segundos

    for (let i = 0; i < usersResult.rows.length; i += BATCH_SIZE) {
      const batch = usersResult.rows.slice(i, i + BATCH_SIZE)
      
      const emailPromises = batch.map(async (user) => {
        try {
          const emailHTML = generateEmailHTML(subject.trim(), content.trim(), user.name)
          
          await transporter.sendMail({
            from: `"Quizy" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: `📢 ${subject.trim()}`,
            html: emailHTML
          })
          
          results.sent++
          return { success: true, email: user.email }
        } catch (error) {
          results.failed++
          results.errors.push({ email: user.email, error: error.message })
          return { success: false, email: user.email, error: error.message }
        }
      })

      await Promise.all(emailPromises)

      // Esperar entre lotes para evitar rate limiting
      if (i + BATCH_SIZE < usersResult.rows.length) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES))
      }
    }

    // Opcionalmente crear notificación in-app también
    if (sendNotification) {
      const metadata = JSON.stringify({ 
        admin_id: decoded.id,
        broadcast: true,
        email_sent: true,
        created_at: new Date().toISOString()
      })

      // Insertar notificación para cada usuario
      for (const user of usersResult.rows) {
        await query(
          `INSERT INTO notifications (user_id, type, title, message, metadata)
           VALUES ($1, 'admin_broadcast', $2, $3, $4)`,
          [user.id, `📧 ${subject.trim()}`, content.trim(), metadata]
        )
      }
    }

    console.log(`📧 Email broadcast enviado: ${results.sent} exitosos, ${results.failed} fallidos`)

    return res.status(200).json({
      success: true,
      message: `Email enviado a ${results.sent} usuarios`,
      stats: {
        total_users: usersResult.rows.length,
        sent: results.sent,
        failed: results.failed,
        notification_created: sendNotification
      },
      errors: results.errors.length > 0 ? results.errors.slice(0, 5) : undefined
    })

  } catch (error) {
    console.error('Error sending broadcast email:', error)
    return res.status(500).json({ 
      error: 'Error al enviar emails',
      details: error.message
    })
  }
}
