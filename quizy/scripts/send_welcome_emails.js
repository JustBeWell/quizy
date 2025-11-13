/**
 * Script para enviar emails de bienvenida a todos los usuarios existentes
 * Uso: node scripts/send_welcome_emails.js
 */

// Cargar variables de entorno desde .env.local
require('dotenv').config({ path: '.env.local' })

const db = require('../lib/db')
const { sendWelcomeEmail } = require('../lib/email')

async function sendWelcomeToAllUsers() {
  console.log('📧 Iniciando envío de emails de bienvenida...\n')

  try {
    // Obtener todos los usuarios con email
    const result = await db.query(
      `SELECT id, name, email 
       FROM users 
       WHERE email IS NOT NULL AND email != ''
       ORDER BY created_at ASC`
    )

    const users = result.rows
    console.log(`✓ Encontrados ${users.length} usuarios con email\n`)

    if (users.length === 0) {
      console.log('⚠️ No hay usuarios con email en la base de datos')
      process.exit(0)
    }

    // Preguntar confirmación
    console.log('⚠️ Esto enviará un email de bienvenida a TODOS los usuarios.')
    console.log('📋 Usuarios que recibirán el email:')
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.email})`)
    })
    console.log('')

    // En un script real, aquí iría una confirmación interactiva
    // Para este ejemplo, procedemos directamente
    console.log('🚀 Enviando emails...\n')

    let successful = 0
    let failed = 0

    // Enviar emails con delay para no saturar el servidor SMTP
    for (let i = 0; i < users.length; i++) {
      const user = users[i]
      
      console.log(`[${i + 1}/${users.length}] Enviando a ${user.name} (${user.email})...`)
      
      try {
        const sent = await sendWelcomeEmail(user.email, user.name)
        
        if (sent) {
          successful++
          console.log(`   ✓ Enviado correctamente`)
        } else {
          failed++
          console.log(`   ✗ No se pudo enviar (revisar configuración de email)`)
        }
        
        // Esperar 2 segundos entre cada email para evitar rate limiting
        if (i < users.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
        
      } catch (error) {
        failed++
        console.error(`   ✗ Error: ${error.message}`)
      }
    }

    console.log('\n' + '='.repeat(50))
    console.log('📊 Resumen del envío:')
    console.log(`   ✓ Exitosos: ${successful}`)
    console.log(`   ✗ Fallidos: ${failed}`)
    console.log(`   📧 Total: ${users.length}`)
    console.log('='.repeat(50))

    if (failed > 0) {
      console.log('\n⚠️ Algunos emails no pudieron ser enviados.')
      console.log('   Verifica la configuración de EMAIL_USER y EMAIL_PASSWORD en .env')
    }

    process.exit(0)

  } catch (error) {
    console.error('❌ Error ejecutando el script:', error)
    process.exit(1)
  }
}

// Ejecutar el script
sendWelcomeToAllUsers()
