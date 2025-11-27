import nodemailer from 'nodemailer'

// Crear el transportador de email
let transporter = null

function getTransporter() {
  if (transporter) {
    return transporter
  }

  // Configurar con Gmail
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // Tu email de Gmail
      pass: process.env.EMAIL_PASSWORD // Tu contraseña de aplicación de Gmail
    }
  })

  return transporter
}

/**
 * Envía un email de verificación
 * @param {string} to - Email del destinatario
 * @param {string} userName - Nombre del usuario
 * @param {string} verificationUrl - URL de verificación
 * @returns {Promise<boolean>} - true si se envió correctamente
 */
export async function sendVerificationEmail(to, userName, verificationUrl) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn('⚠️ EMAIL_USER o EMAIL_PASSWORD no configurados. Email no enviado.')
    return false
  }

  try {
    const transporter = getTransporter()

    const mailOptions = {
      from: `"Quizy" <${process.env.EMAIL_USER}>`,
      to,
      subject: '📧 Verifica tu email - Quizy',
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
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
            .button {
              display: inline-block;
              padding: 15px 30px;
              background: #667eea;
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
              <h1>¡Bienvenido a Quizy!</h1>
            </div>
            <div class="content">
              <p>Hola <strong>${userName}</strong>,</p>
              
              <p>Gracias por registrarte en <strong>Quizy</strong>, tu plataforma de cuestionarios. Para completar tu registro y poder usar todas las funcionalidades, necesitamos verificar tu dirección de email.</p>
              
              <p>Haz clic en el siguiente botón para verificar tu email:</p>
              
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verificar Email</a>
              </div>
              
              <p>O copia y pega este enlace en tu navegador:</p>
              <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
              
              <p><strong>⏰ Este enlace expira en 24 horas.</strong></p>
              
              <p>Si no creaste esta cuenta, puedes ignorar este email.</p>
              
              <p>Saludos,<br>El equipo de Quizy</p>
            </div>
            <div class="footer">
              <p>Este es un email automático, por favor no respondas a este mensaje.</p>
            </div>
          </div>
        </body>
        </html>
      `
    }

    await transporter.sendMail(mailOptions)
    console.log('✓ Email de verificación enviado a:', to)
    return true

  } catch (error) {
    console.error('❌ Error enviando email:', error)
    return false
  }
}

/**
 * Envía un email al admin notificando de un nuevo ticket de soporte
 * @param {string} userEmail - Email del usuario que creó el ticket
 * @param {string} userName - Nombre del usuario
 * @param {string} subject - Asunto del ticket
 * @param {string} message - Mensaje del ticket
 * @param {number} ticketId - ID del ticket
 * @returns {Promise<boolean>} - true si se envió correctamente
 */
export async function sendNewTicketNotificationToAdmin(userEmail, userName, subject, message, ticketId) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn('⚠️ EMAIL_USER o EMAIL_PASSWORD no configurados. Email no enviado.')
    return false
  }

  try {
    const transporter = getTransporter()

    const mailOptions = {
      from: `"Quizy - Sistema de Soporte" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Enviar al admin (mismo email configurado)
      subject: `🎫 Nuevo ticket de soporte #${ticketId}: ${subject}`,
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
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #dc2626 0%, #ea580c 100%);
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
            .ticket-info {
              background: white;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .info-row {
              display: flex;
              padding: 10px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .info-row:last-child {
              border-bottom: none;
            }
            .info-label {
              font-weight: bold;
              width: 120px;
              color: #6b7280;
            }
            .info-value {
              flex: 1;
              color: #111827;
            }
            .message-box {
              background: white;
              border-left: 4px solid #dc2626;
              padding: 20px;
              border-radius: 5px;
              margin: 20px 0;
              white-space: pre-wrap;
              word-wrap: break-word;
            }
            .action-button {
              display: inline-block;
              padding: 12px 24px;
              background: #dc2626;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
            }
            .priority-badge {
              display: inline-block;
              padding: 4px 12px;
              background: #fef3c7;
              color: #92400e;
              border-radius: 12px;
              font-size: 12px;
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
              <h1>🎫 Nuevo Ticket de Soporte</h1>
              <p style="margin: 10px 0 0 0; font-size: 18px;">Ticket #${ticketId}</p>
            </div>
            <div class="content">
              <div style="text-align: center; margin-bottom: 20px;">
                <span class="priority-badge">⚡ REQUIERE ATENCIÓN</span>
              </div>

              <p><strong>Hola Admin de Quizy,</strong></p>
              
              <p>Se ha recibido un nuevo ticket de soporte que requiere tu atención:</p>
              
              <div class="ticket-info">
                <div class="info-row">
                  <span class="info-label">📋 Asunto:</span>
                  <span class="info-value"><strong>${subject}</strong></span>
                </div>
                <div class="info-row">
                  <span class="info-label">👤 Usuario:</span>
                  <span class="info-value">${userName}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">📧 Email:</span>
                  <span class="info-value">${userEmail}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">🆔 Ticket ID:</span>
                  <span class="info-value">#${ticketId}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">📊 Estado:</span>
                  <span class="info-value">⏳ Pendiente</span>
                </div>
              </div>
              
              <div class="message-box">
                <p style="margin: 0 0 10px 0;"><strong>💬 Mensaje del usuario:</strong></p>
                <div style="color: #374151; line-height: 1.6;">${message}</div>
              </div>

              <div style="text-align: center; margin-top: 30px;">
                <p style="margin-bottom: 15px;">Accede al panel de administración para responder:</p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'quizy.es'}/admin/support" class="action-button">
                  🔧 Ir al Panel de Soporte
                </a>
              </div>

              <div style="margin-top: 30px; padding: 15px; background: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
                <p style="margin: 0; color: #92400e;">
                  <strong>💡 Recordatorio:</strong> Responder rápidamente mejora la satisfacción del usuario. El usuario recibirá un email automático cuando actualices el estado o respondas al ticket.
                </p>
              </div>
            </div>
            <div class="footer">
              <p>Este es un email automático del sistema de soporte de Quizy.</p>
              <p style="margin-top: 5px;">Panel de administración: ${process.env.NEXT_PUBLIC_APP_URL || 'https://quiz-app.vercel.app'}/admin</p>
            </div>
          </div>
        </body>
        </html>
      `
    }

    await transporter.sendMail(mailOptions)
    console.log(`✓ Notificación de nuevo ticket enviada al admin (Ticket #${ticketId})`)
    return true

  } catch (error) {
    console.error('❌ Error enviando notificación al admin:', error)
    return false
  }
}

/**
 * Envía un email de notificación de cambios en ticket de soporte
 * @param {string} to - Email del destinatario
 * @param {string} userName - Nombre del usuario
 * @param {string} ticketSubject - Asunto del ticket
 * @param {string} oldStatus - Estado anterior
 * @param {string} newStatus - Estado nuevo
 * @param {string} adminMessage - Mensaje del administrador (opcional)
 * @returns {Promise<boolean>} - true si se envió correctamente
 */
export async function sendTicketUpdateEmail(to, userName, ticketSubject, oldStatus, newStatus, adminMessage = null) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn('⚠️ EMAIL_USER o EMAIL_PASSWORD no configurados. Email no enviado.')
    return false
  }

  try {
    const transporter = getTransporter()

    const statusLabels = {
      'pending': '⏳ Pendiente',
      'in_progress': '🔄 En progreso',
      'resolved': '✅ Resuelto',
      'discarded': '🗑️ Descartado'
    }

    const statusColors = {
      'pending': '#fbbf24',
      'in_progress': '#3b82f6',
      'resolved': '#10b981',
      'discarded': '#ef4444'
    }

    const mailOptions = {
      from: `"Quizy - Soporte" <${process.env.EMAIL_USER}>`,
      to,
      subject: `🔔 Actualización de ticket: ${ticketSubject}`,
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
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
            .ticket-info {
              background: white;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .status-change {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 15px;
              margin: 25px 0;
              font-size: 16px;
            }
            .status-badge {
              padding: 8px 16px;
              border-radius: 20px;
              font-weight: bold;
              color: white;
            }
            .arrow {
              font-size: 24px;
              color: #667eea;
            }
            .message-box {
              background: #fff4e6;
              border-left: 4px solid #f59e0b;
              padding: 20px;
              border-radius: 5px;
              margin: 20px 0;
            }
            .signature {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 2px solid #e5e7eb;
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
              <h1>🔔 Actualización de Ticket</h1>
            </div>
            <div class="content">
              <p>Hola <strong>${userName}</strong>,</p>
              
              <p>Hay una actualización en tu ticket de soporte:</p>
              
              <div class="ticket-info">
                <strong style="font-size: 18px;">📋 ${ticketSubject}</strong>
                
                <div class="status-change">
                  <span class="status-badge" style="background-color: ${statusColors[oldStatus] || '#6b7280'}">
                    ${statusLabels[oldStatus] || oldStatus}
                  </span>
                  <span class="arrow">→</span>
                  <span class="status-badge" style="background-color: ${statusColors[newStatus] || '#6b7280'}">
                    ${statusLabels[newStatus] || newStatus}
                  </span>
                </div>
              </div>
              
              ${adminMessage ? `
              <div class="message-box">
                <p><strong>💬 Mensaje del CEO de Quizy:</strong></p>
                <p style="margin-top: 10px; white-space: pre-wrap;">${adminMessage}</p>
              </div>
              ` : ''}
              
              <p style="margin-top: 25px;">
                ${newStatus === 'resolved' ? 
                  '¡Tu problema ha sido resuelto! Si tienes alguna otra pregunta, no dudes en contactarnos de nuevo.' :
                  newStatus === 'in_progress' ?
                  'Estamos trabajando en tu solicitud. Te mantendremos informado de cualquier novedad.' :
                  newStatus === 'discarded' ?
                  'Este ticket ha sido marcado como descartado. Si crees que fue un error, por favor contáctanos nuevamente.' :
                  'Tu ticket ha sido actualizado.'
                }
              </p>
              
              <div class="signature">
                <p>Atentamente,</p>
                <p><strong>El CEO de Quizy</strong><br>
                <span style="color: #667eea; font-size: 14px;">Tu plataforma de cuestionarios educativos</span></p>
              </div>
            </div>
            <div class="footer">
              <p>Este es un email automático, por favor no respondas a este mensaje.</p>
              <p style="margin-top: 5px;">Si necesitas más ayuda, crea un nuevo ticket desde la aplicación.</p>
            </div>
          </div>
        </body>
        </html>
      `
    }

    await transporter.sendMail(mailOptions)
    console.log('✓ Email de actualización de ticket enviado a:', to)
    return true

  } catch (error) {
    console.error('❌ Error enviando email de actualización:', error)
    return false
  }
}

/**
 * Envía un email de notificación de respuesta de soporte
 * @param {string} to - Email del destinatario
 * @param {string} userName - Nombre del usuario
 * @param {string} ticketSubject - Asunto del ticket
 * @param {string} adminResponse - Respuesta del administrador
 * @returns {Promise<boolean>} - true si se envió correctamente
 */
export async function sendSupportResponseEmail(to, userName, ticketSubject, adminResponse) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn('⚠️ EMAIL_USER o EMAIL_PASSWORD no configurados. Email no enviado.')
    return false
  }

  try {
    const transporter = getTransporter()

    const mailOptions = {
      from: `"Quiz App - Soporte" <${process.env.EMAIL_USER}>`,
      to,
      subject: `💬 Respuesta a tu ticket: ${ticketSubject}`,
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
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
            .ticket-info {
              background: white;
              padding: 15px;
              border-left: 4px solid #667eea;
              margin: 20px 0;
            }
            .response {
              background: white;
              padding: 20px;
              border-radius: 5px;
              margin: 20px 0;
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
              <h1>💬 Tienes una respuesta</h1>
            </div>
            <div class="content">
              <p>Hola <strong>${userName}</strong>,</p>
              
              <p>Hemos respondido a tu ticket de soporte:</p>
              
              <div class="ticket-info">
                <strong>Asunto:</strong> ${ticketSubject}
              </div>
              
              <div class="response">
                <p><strong>Respuesta del equipo:</strong></p>
                <p>${adminResponse.replace(/\n/g, '<br>')}</p>
              </div>
              
              <p>Puedes revisar el estado completo de tu ticket iniciando sesión en la aplicación.</p>
              
              <p>Saludos,<br>El equipo de Quiz App</p>
            </div>
            <div class="footer">
              <p>Este es un email automático, por favor no respondas a este mensaje.</p>
            </div>
          </div>
        </body>
        </html>
      `
    }

    await transporter.sendMail(mailOptions)
    console.log('✓ Email de respuesta enviado a:', to)
    return true

  } catch (error) {
    console.error('❌ Error enviando email:', error)
    return false
  }
}

/**
 * Envía un email de recuperación de contraseña
 * @param {string} to - Email del destinatario
 * @param {string} userName - Nombre del usuario
 * @param {string} resetUrl - URL para resetear la contraseña
 * @returns {Promise<boolean>} - true si se envió correctamente
 */
export async function sendPasswordResetEmail(to, userName, resetUrl) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn('⚠️ EMAIL_USER o EMAIL_PASSWORD no configurados. Email no enviado.')
    return false
  }

  try {
    const transporter = getTransporter()

    const mailOptions = {
      from: `"Quizy" <${process.env.EMAIL_USER}>`,
      to,
      subject: '🔐 Recuperación de contraseña - Quizy',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #f9f9f9;
              border-radius: 10px;
              padding: 30px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .header h1 {
              color: #2563eb;
              margin: 0;
            }
            .content {
              background-color: white;
              padding: 20px;
              border-radius: 5px;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background-color: #2563eb;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
            }
            .button:hover {
              background-color: #1d4ed8;
            }
            .warning {
              background-color: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 15px;
              margin: 20px 0;
              border-radius: 5px;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              color: #666;
              font-size: 12px;
            }
            .code {
              background-color: #f3f4f6;
              padding: 10px;
              border-radius: 5px;
              font-family: monospace;
              word-break: break-all;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Recuperación de contraseña</h1>
            </div>
            <div class="content">
              <p>Hola <strong>${userName}</strong>,</p>
              
              <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.</p>
              
              <p>Para crear una nueva contraseña, haz clic en el siguiente botón:</p>
              
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Restablecer contraseña</a>
              </div>
              
              <p>O copia y pega este enlace en tu navegador:</p>
              <div class="code">${resetUrl}</div>
              
              <div class="warning">
                <strong>⚠️ Importante:</strong>
                <ul style="margin: 10px 0;">
                  <li>Este enlace expirará en <strong>1 hora</strong></li>
                  <li>Solo puede ser usado una vez</li>
                  <li>La nueva contraseña debe ser diferente a la anterior</li>
                </ul>
              </div>
              
              <p>Si no solicitaste restablecer tu contraseña, puedes ignorar este correo. Tu contraseña actual seguirá siendo válida.</p>
              
              <p>Saludos,<br>El equipo de Quizy</p>
            </div>
            <div class="footer">
              <p>Este es un email automático, por favor no respondas a este mensaje.</p>
              <p>Si tienes problemas, contacta con el soporte técnico.</p>
            </div>
          </div>
        </body>
        </html>
      `
    }

    await transporter.sendMail(mailOptions)
    console.log('✓ Email de recuperación enviado a:', to)
    return true

  } catch (error) {
    console.error('❌ Error enviando email de recuperación:', error)
    return false
  }
}

/**
 * Envía un email de bienvenida
 * @param {string} to - Email del destinatario
 * @param {string} userName - Nombre del usuario
 * @returns {Promise<boolean>} - true si se envió correctamente
 */
export async function sendWelcomeEmail(to, userName) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn('⚠️ EMAIL_USER o EMAIL_PASSWORD no configurados. Email no enviado.')
    return false
  }

  try {
    const transporter = getTransporter()

    const mailOptions = {
      from: `"Quizy" <${process.env.EMAIL_USER}>`,
      to,
      subject: '🎉 ¡Bienvenido a Quizy! Tu viaje de aprendizaje comienza aquí',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background-color: #ffffff;
              border-radius: 10px;
              overflow: hidden;
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 40px 20px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
            }
            .content {
              padding: 30px;
            }
            .feature-box {
              background-color: #f8f9fa;
              border-left: 4px solid #667eea;
              padding: 15px;
              margin: 20px 0;
              border-radius: 5px;
            }
            .feature-box h3 {
              margin-top: 0;
              color: #667eea;
            }
            .cta-button {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 15px 30px;
              text-decoration: none;
              border-radius: 5px;
              font-weight: bold;
              margin: 20px 0;
            }
            .stats {
              display: flex;
              justify-content: space-around;
              margin: 30px 0;
              flex-wrap: wrap;
            }
            .stat-item {
              text-align: center;
              padding: 10px;
            }
            .stat-number {
              font-size: 32px;
              font-weight: bold;
              color: #667eea;
            }
            .stat-label {
              color: #666;
              font-size: 14px;
            }
            .footer {
              text-align: center;
              padding: 20px;
              background-color: #f8f9fa;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 ¡Bienvenido a Quizy!</h1>
              <p style="margin: 10px 0 0 0; font-size: 18px;">Hola ${userName}, estamos encantados de tenerte aquí</p>
            </div>
            
            <div class="content">
              <p>¡Gracias por unirte a <strong>Quizy</strong>! Estás a punto de comenzar una experiencia de aprendizaje increíble.</p>
              
              <div class="stats">
                <div class="stat-item">
                  <div class="stat-number">+500</div>
                  <div class="stat-label">Preguntas</div>
                </div>
                <div class="stat-item">
                  <div class="stat-number">+50</div>
                  <div class="stat-label">Tests</div>
                </div>
                <div class="stat-item">
                  <div class="stat-number">+10</div>
                  <div class="stat-label">Asignaturas</div>
                </div>
              </div>

              <div class="feature-box">
                <h3>📚 ¿Qué encontrarás en Quizy?</h3>
                <ul style="margin: 10px 0;">
                  <li><strong>Tests de ESO, Bachillerato y Universidad</strong> - Contenido adaptado a tu nivel</li>
                  <li><strong>Rankings en tiempo real</strong> - Compite con otros estudiantes</li>
                  <li><strong>Sistema de favoritos</strong> - Guarda tus tests favoritos</li>
                  <li><strong>Seguimiento de progreso</strong> - Ve tu evolución en cada asignatura</li>
                </ul>
              </div>

              <div class="feature-box">
                <h3>🚀 Primeros pasos</h3>
                <ol style="margin: 10px 0;">
                  <li>Explora los <strong>niveles académicos</strong> (ESO, Bachillerato, Universidad)</li>
                  <li>Elige una <strong>asignatura</strong> de tu interés</li>
                  <li>Realiza tu <strong>primer test</strong> y aparece en el ranking</li>
                  <li>Revisa tus <strong>estadísticas</strong> y mejora continuamente</li>
                </ol>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://quiz-app-coral-kappa.vercel.app'}" class="cta-button">
                  🎯 Comenzar a aprender
                </a>
              </div>

              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                💡 <strong>Consejo:</strong> ¡Marca tus tests favoritos y practica regularmente para mejorar tus resultados!
              </p>

              <p style="margin-top: 30px;">
                Si tienes alguna pregunta o sugerencia, no dudes en contactarnos a través del soporte en la aplicación.
              </p>

              <p>¡Mucha suerte en tu viaje de aprendizaje! 🌟</p>
              
              <p>Saludos,<br><strong>El equipo de Quizy</strong></p>
            </div>
            
            <div class="footer">
              <p>Este es un email automático, por favor no respondas a este mensaje.</p>
              <p>© 2025 Quizy - Tu plataforma de cuestionarios web</p>
            </div>
          </div>
        </body>
        </html>
      `
    }

    await transporter.sendMail(mailOptions)
    console.log('✓ Email de bienvenida enviado a:', to)
    return true

  } catch (error) {
    console.error('❌ Error enviando email de bienvenida:', error)
    return false
  }
}

/**
 * Envía un email de confirmación al usuario tras enviar propuesta de cuestionario
 * @param {string} to - Email del destinatario
 * @param {string} userName - Nombre del usuario
 * @param {string} quizTitle - Título del cuestionario propuesto
 * @returns {Promise<boolean>} - true si se envió correctamente
 */
export async function sendQuizProposalConfirmation(to, userName, quizTitle) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn('⚠️ EMAIL_USER o EMAIL_PASSWORD no configurados. Email no enviado.')
    return false
  }

  try {
    const transporter = getTransporter()

    const mailOptions = {
      from: `"Quizy" <${process.env.EMAIL_USER}>`,
      to,
      subject: '✅ Propuesta recibida - Gracias por contribuir a Quizy',
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
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white;
              padding: 40px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .success-box {
              background: white;
              border-left: 4px solid #10b981;
              padding: 20px;
              border-radius: 5px;
              margin: 20px 0;
            }
            .info-card {
              background: #ecfdf5;
              border: 1px solid #a7f3d0;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .timeline {
              margin: 25px 0;
              padding: 20px;
              background: white;
              border-radius: 8px;
            }
            .timeline-item {
              display: flex;
              gap: 15px;
              margin-bottom: 15px;
              align-items: flex-start;
            }
            .timeline-item:last-child {
              margin-bottom: 0;
            }
            .timeline-icon {
              flex-shrink: 0;
              width: 32px;
              height: 32px;
              background: #10b981;
              color: white;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
            }
            .timeline-content {
              flex: 1;
              padding-top: 4px;
            }
            .quote-box {
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 20px;
              border-radius: 5px;
              margin: 25px 0;
              font-style: italic;
            }
            .cta-button {
              display: inline-block;
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white;
              padding: 15px 30px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: bold;
              margin: 20px 0;
              text-align: center;
            }
            .footer {
              text-align: center;
              padding: 20px;
              background-color: #f3f4f6;
              color: #666;
              font-size: 12px;
              margin-top: 20px;
              border-radius: 8px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div style="font-size: 48px; margin-bottom: 10px;">✅</div>
              <h1>¡Propuesta Recibida!</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px;">Gracias por contribuir a Quizy</p>
            </div>
            
            <div class="content">
              <p>Hola <strong>${userName}</strong>,</p>
              
              <div class="success-box">
                <h3 style="margin-top: 0; color: #10b981;">📝 Hemos recibido tu propuesta</h3>
                <p style="margin: 10px 0 0 0;"><strong>Título:</strong> ${quizTitle}</p>
              </div>

              <p>¡Muchas gracias por tomarte el tiempo de compartir contenido con la comunidad de Quizy! Tu contribución es muy valiosa para nosotros y para todos los estudiantes que usan la plataforma.</p>

              <div class="info-card">
                <h3 style="margin-top: 0; color: #059669;">🔍 ¿Qué sucede ahora?</h3>
                <div class="timeline">
                  <div class="timeline-item">
                    <div class="timeline-icon">1</div>
                    <div class="timeline-content">
                      <strong>Revisión del contenido</strong>
                      <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Nuestro equipo analizará cuidadosamente tu propuesta</p>
                    </div>
                  </div>
                  
                  <div class="timeline-item">
                    <div class="timeline-icon">2</div>
                    <div class="timeline-content">
                      <strong>Validación de calidad</strong>
                      <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Verificaremos que cumpla con nuestros estándares educativos</p>
                    </div>
                  </div>
                  
                  <div class="timeline-item">
                    <div class="timeline-icon">3</div>
                    <div class="timeline-content">
                      <strong>Respuesta en 2-3 días hábiles</strong>
                      <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Te contactaremos con el resultado de la revisión</p>
                    </div>
                  </div>
                  
                  <div class="timeline-item">
                    <div class="timeline-icon">4</div>
                    <div class="timeline-content">
                      <strong>Publicación (si aprobado)</strong>
                      <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Lo subiremos a la plataforma dándote crédito como autor</p>
                    </div>
                  </div>
                </div>
              </div>

              <div class="quote-box">
                <p style="margin: 0; color: #92400e;">
                  <strong>💡 Recuerda:</strong> Intentaremos darte una respuesta lo antes posible. Mientras tanto, puedes seguir usando Quizy y proponer más cuestionarios si lo deseas.
                </p>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://quizy.es'}/levels" class="cta-button">
                  📚 Continuar practicando
                </a>
              </div>

              <p style="margin-top: 30px;">
                Si tienes alguna pregunta sobre tu propuesta o necesitas añadir información adicional, no dudes en contactarnos a través del <strong>sistema de soporte</strong> en la aplicación.
              </p>

              <div style="margin-top: 30px; padding: 20px; background: white; border-radius: 8px; border: 1px solid #e5e7eb;">
                <h4 style="margin-top: 0; color: #374151;">📊 Tu impacto en la comunidad</h4>
                <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 14px;">
                  Gracias a contribuidores como tú, Quizy crece cada día y ayuda a más estudiantes a alcanzar sus objetivos académicos. ¡Eres parte fundamental de esta comunidad! 🌟
                </p>
              </div>

              <p style="margin-top: 30px;">
                Saludos cordiales,<br>
                <strong>El equipo de Quizy</strong><br>
                <span style="color: #10b981; font-size: 14px;">Tu plataforma de aprendizaje colaborativo</span>
              </p>
            </div>
            
            <div class="footer">
              <p>Este es un email de confirmación automático.</p>
              <p style="margin-top: 5px;">© 2025 Quizy - Construyendo conocimiento juntos</p>
            </div>
          </div>
        </body>
        </html>
      `
    }

    await transporter.sendMail(mailOptions)
    console.log('✓ Email de confirmación de propuesta enviado a:', to)
    return true

  } catch (error) {
    console.error('❌ Error enviando email de confirmación:', error)
    return false
  }
}
