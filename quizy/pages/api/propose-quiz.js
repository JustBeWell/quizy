import formidable from 'formidable'
import fs from 'fs'
import path from 'path'
import { verifyToken } from '../../lib/jwt'
import nodemailer from 'nodemailer'
import { sendQuizProposalConfirmation } from '../../lib/email'

// Desactivar el body parser de Next.js para manejar multipart/form-data
export const config = {
  api: {
    bodyParser: false,
  },
}

// Función para enviar email con propuesta de cuestionario
async function sendQuizProposalEmail(proposalData, files, userName, userEmail) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn('⚠️ EMAIL_USER o EMAIL_PASSWORD no configurados. Email no enviado.')
    return false
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    })

    // Preparar información de archivos
    let filesInfo = '<p><em>No se adjuntaron archivos</em></p>'
    if (files && files.length > 0) {
      filesInfo = '<ul style="margin: 10px 0;">'
      files.forEach(file => {
        filesInfo += `<li><strong>${file.originalFilename}</strong> (${(file.size / 1024).toFixed(2)} KB)</li>`
      })
      filesInfo += '</ul>'
    }

    // Preparar información de enlaces de Drive
    let driveLinksInfo = '<p><em>No se proporcionaron enlaces</em></p>'
    if (proposalData.driveLinks && proposalData.driveLinks.length > 0) {
      driveLinksInfo = '<ul style="margin: 10px 0;">'
      proposalData.driveLinks.forEach(link => {
        driveLinksInfo += `<li><a href="${link}" target="_blank" style="color: #667eea;">${link}</a></li>`
      })
      driveLinksInfo += '</ul>'
    }

    const mailOptions = {
      from: `"Quizy - Propuestas" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      replyTo: userEmail, // Cuando respondas al correo, irá al email del usuario
      subject: `📝 Nueva propuesta de cuestionario: ${proposalData.subject}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 700px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .info-box {
              background: white;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .info-row {
              display: flex;
              padding: 12px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .info-row:last-child {
              border-bottom: none;
            }
            .info-label {
              font-weight: bold;
              width: 180px;
              color: #6b7280;
            }
            .info-value {
              flex: 1;
              color: #111827;
            }
            .description-box {
              background: white;
              border-left: 4px solid #10b981;
              padding: 20px;
              border-radius: 5px;
              margin: 20px 0;
              white-space: pre-wrap;
              word-wrap: break-word;
            }
            .badge {
              display: inline-block;
              padding: 4px 12px;
              background: #d1fae5;
              color: #065f46;
              border-radius: 12px;
              font-size: 12px;
              font-weight: bold;
              margin-right: 8px;
            }
            .files-section {
              background: #fef3c7;
              border: 2px dashed #f59e0b;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .action-button {
              display: inline-block;
              padding: 12px 24px;
              background: #10b981;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📝 Nueva Propuesta de Cuestionario</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px;">Propuesta enviada por: <strong>${userName}</strong></p>
              <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">✉️ ${userEmail || 'Sin email'}</p>
            </div>
            <div class="content">
              <div style="text-align: center; margin-bottom: 20px;">
                <span class="badge">🆕 NUEVA PROPUESTA</span>
                <span class="badge">⏳ PENDIENTE DE REVISIÓN</span>
              </div>

              <div class="info-box">
                <h3 style="margin-top: 0; color: #10b981;">📋 Información del Cuestionario</h3>
                
                <div class="info-row">
                  <span class="info-label">Título/Asunto:</span>
                  <span class="info-value"><strong>${proposalData.subject}</strong></span>
                </div>
                
                <div class="info-row">
                  <span class="info-label">Nivel Educativo:</span>
                  <span class="info-value">${
                    proposalData.level === 'eso' ? '📚 ESO' :
                    proposalData.level === 'bachillerato' ? '🎓 Bachillerato' :
                    proposalData.level === 'universidad' ? '🏛️ Universidad' :
                    proposalData.level
                  }</span>
                </div>
                
                ${proposalData.category ? `
                <div class="info-row">
                  <span class="info-label">Asignatura/Materia:</span>
                  <span class="info-value">${proposalData.category}</span>
                </div>
                ` : ''}
                
                ${proposalData.questionsCount ? `
                <div class="info-row">
                  <span class="info-label">Nº de preguntas:</span>
                  <span class="info-value">${proposalData.questionsCount} preguntas</span>
                </div>
                ` : ''}
                
                <div class="info-row">
                  <span class="info-label">Formato:</span>
                  <span class="info-value">${
                    proposalData.format === 'multiple_choice' ? '✅ Opción múltiple' :
                    proposalData.format === 'true_false' ? '☑️ Verdadero/Falso' :
                    proposalData.format === 'mixed' ? '🔀 Mixto' :
                    proposalData.format === 'open' ? '📝 Preguntas abiertas' :
                    proposalData.format
                  }</span>
                </div>
              </div>

              <div class="info-box">
                <h3 style="margin-top: 0; color: #10b981;">👤 Información del Usuario</h3>
                
                <div class="info-row">
                  <span class="info-label">Nombre de usuario:</span>
                  <span class="info-value">${userName}</span>
                </div>
                
                <div class="info-row">
                  <span class="info-label">Email:</span>
                  <span class="info-value">${userEmail || '<em>No proporcionado</em>'}</span>
                </div>
              </div>

              <div class="description-box">
                <h3 style="margin-top: 0; color: #10b981;">💬 Descripción del Contenido</h3>
                <div style="color: #374151; line-height: 1.6;">${proposalData.description}</div>
              </div>

              ${files && files.length > 0 ? `
              <div class="files-section">
                <h3 style="margin-top: 0; color: #92400e;">📎 Archivos Adjuntos (${files.length})</h3>
                ${filesInfo}
                <p style="margin-top: 15px; color: #92400e; font-size: 14px;">
                  <strong>📁 Los archivos están adjuntos a este email.</strong>
                </p>
              </div>
              ` : ''}

              ${proposalData.driveLinks && proposalData.driveLinks.length > 0 ? `
              <div class="files-section">
                <h3 style="margin-top: 0; color: #92400e;">🔗 Enlaces de Google Drive</h3>
                ${driveLinksInfo}
              </div>
              ` : ''}

              <div style="background: #dbeafe; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; margin-top: 30px;">
                <h3 style="margin-top: 0; color: #1e40af;">📝 Próximos pasos:</h3>
                <ol style="margin: 10px 0; padding-left: 20px; color: #1e3a8a;">
                  <li>Revisa el contenido y los archivos adjuntos</li>
                  <li>Verifica la calidad y relevancia del cuestionario</li>
                  <li>Si es aprobado, procesa y sube el contenido a la plataforma</li>
                  <li>Contacta al usuario para notificarle el resultado</li>
                </ol>
              </div>

              <div style="text-align: center; margin-top: 30px; padding: 20px; background: #f0fdf4; border-radius: 8px; border: 2px solid #10b981;">
                <p style="color: #065f46; margin-bottom: 15px; font-size: 16px; font-weight: bold;">💬 Responder al usuario</p>
                <p style="color: #047857; margin-bottom: 15px; font-size: 14px;">
                  Puedes responder directamente a <strong>${userEmail || 'este usuario'}</strong> desde tu cliente de correo
                </p>
                <a href="mailto:${userEmail}?subject=Re: Propuesta de cuestionario - ${encodeURIComponent(proposalData.subject)}&body=Hola ${userName},%0D%0A%0D%0AGracias por tu propuesta de cuestionario sobre '${encodeURIComponent(proposalData.subject)}'.%0D%0A%0D%0A" 
                   style="display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 5px;">
                  ✉️ Responder a ${userName}
                </a>
              </div>

              <div style="text-align: center; margin-top: 20px;">
                <p style="color: #6b7280; margin-bottom: 10px;">Gestiona esta propuesta desde el panel:</p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://quizy.es'}/admin" class="action-button">
                  🔧 Ir al Panel de Administración
                </a>
              </div>
            </div>
            <div class="footer">
              <p>Este es un email automático del sistema de propuestas de Quizy.</p>
              <p style="margin-top: 5px;">Fecha: ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}</p>
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: files ? files.map(file => ({
        filename: file.originalFilename,
        path: file.filepath
      })) : []
    }

    await transporter.sendMail(mailOptions)
    console.log('✓ Email de propuesta de cuestionario enviado al admin')
    
    // Limpiar archivos temporales después de enviar
    if (files && files.length > 0) {
      files.forEach(file => {
        try {
          fs.unlinkSync(file.filepath)
        } catch (err) {
          console.error('Error eliminando archivo temporal:', err)
        }
      })
    }
    
    return true

  } catch (error) {
    console.error('❌ Error enviando email de propuesta:', error)
    return false
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  try {
    // Verificar autenticación
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No autorizado' })
    }

    const token = authHeader.split(' ')[1]
    let decoded
    try {
      decoded = verifyToken(token)
    } catch (error) {
      return res.status(401).json({ error: 'Token inválido' })
    }

    // Parsear el form data con formidable
    // Usar /tmp que es escribible en Vercel
    const uploadDir = '/tmp/uploads'
    
    // Crear directorio temporal si no existe
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    const form = formidable({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      filter: function ({ mimetype }) {
        // Permitir solo ciertos tipos de archivos
        const allowedTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/plain',
          'image/jpeg',
          'image/png',
          'image/jpg'
        ]
        return allowedTypes.includes(mimetype)
      }
    })

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Error parseando formulario:', err)
        return res.status(400).json({ error: 'Error procesando archivos' })
      }

      try {
        // Extraer datos del formulario
        const proposalData = {
          subject: fields.subject?.[0] || fields.subject || '',
          level: fields.level?.[0] || fields.level || '',
          category: fields.category?.[0] || fields.category || '',
          description: fields.description?.[0] || fields.description || '',
          questionsCount: fields.questionsCount?.[0] || fields.questionsCount || '',
          format: fields.format?.[0] || fields.format || '',
          driveLinks: []
        }

        // Parsear enlaces de Drive
        try {
          const driveLinksStr = fields.driveLinks?.[0] || fields.driveLinks || '[]'
          proposalData.driveLinks = JSON.parse(driveLinksStr).filter(link => link.trim() !== '')
        } catch (e) {
          console.error('Error parseando driveLinks:', e)
        }

        // Procesar archivos
        let uploadedFiles = []
        if (files.files) {
          uploadedFiles = Array.isArray(files.files) ? files.files : [files.files]
        }

        // Obtener datos actualizados del usuario desde la base de datos
        const db = require('../../lib/db')
        let userName = decoded.name
        let userEmail = null
        
        try {
          const userResult = await db.query(
            'SELECT name, email FROM users WHERE id = $1',
            [decoded.id]
          )
          if (userResult.rows.length > 0) {
            userName = userResult.rows[0].name
            userEmail = userResult.rows[0].email
          }
        } catch (dbErr) {
          console.error('Error obteniendo datos del usuario:', dbErr)
        }

        // Validar que el usuario tenga email configurado
        if (!userEmail || userEmail.trim() === '') {
          // Limpiar archivos temporales antes de retornar error
          if (uploadedFiles.length > 0) {
            uploadedFiles.forEach(file => {
              try {
                fs.unlinkSync(file.filepath)
              } catch (err) {
                console.error('Error eliminando archivo temporal:', err)
              }
            })
          }
          return res.status(400).json({ 
            error: 'Debes tener un correo electrónico configurado en tu perfil para enviar propuestas. Por favor, añade tu email en la sección de perfil.',
            requiresEmail: true
          })
        }

        // Enviar email con la propuesta
        const emailSent = await sendQuizProposalEmail(
          proposalData,
          uploadedFiles,
          userName,
          userEmail
        )

        if (!emailSent) {
          return res.status(500).json({ 
            error: 'Error enviando la propuesta. Por favor intenta de nuevo.' 
          })
        }

        // Enviar email de confirmación al usuario si tiene email
        if (userEmail) {
          await sendQuizProposalConfirmation(
            userEmail,
            decoded.username,
            proposalData.subject
          )
        }

        res.status(200).json({ 
          success: true,
          message: 'Propuesta enviada correctamente'
        })

      } catch (innerErr) {
        console.error('Error procesando propuesta:', innerErr)
        res.status(500).json({ error: 'Error procesando la propuesta' })
      }
    })

  } catch (error) {
    console.error('Error en API propose-quiz:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}
