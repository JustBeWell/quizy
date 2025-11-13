/**
 * Script de prueba para el filtro de profanidad con Perspective API
 * 
 * Uso:
 *   node scripts/test_profanity_filter.js
 */

require('dotenv').config({ path: '.env.local' })

// Simulación de fetch para Node.js < 18
if (!global.fetch) {
  global.fetch = require('node-fetch')
}

const { checkProfanity, validateUsername, validateText } = require('../lib/profanity-filter')

async function testProfanityFilter() {
  console.log('🧪 Iniciando pruebas del filtro de profanidad...\n')

  // Test 1: Texto limpio
  console.log('Test 1: Texto limpio')
  const test1 = await checkProfanity('Hola, buenos días, ¿cómo estás?')
  console.log('Texto: "Hola, buenos días, ¿cómo estás?"')
  console.log('Resultado:', test1.isClean ? '✅ LIMPIO' : '❌ TÓXICO')
  console.log('Método:', test1.method)
  if (test1.details) console.log('Detalles:', test1.details)
  if (test1.scores) console.log('Scores:', JSON.stringify(test1.scores, null, 2))
  console.log('')

  // Test 2: Insulto directo
  console.log('Test 2: Insulto directo')
  const test2 = await checkProfanity('Eres un idiota estúpido')
  console.log('Texto: "Eres un idiota estúpido"')
  console.log('Resultado:', test2.isClean ? '✅ LIMPIO' : '❌ TÓXICO')
  console.log('Método:', test2.method)
  if (test2.details) console.log('Detalles:', test2.details)
  if (test2.scores) console.log('Scores:', JSON.stringify(test2.scores, null, 2))
  console.log('')

  // Test 3: Palabras vulgares
  console.log('Test 3: Lenguaje vulgar')
  const test3 = await checkProfanity('Que mierda de servicio')
  console.log('Texto: "Que mierda de servicio"')
  console.log('Resultado:', test3.isClean ? '✅ LIMPIO' : '❌ TÓXICO')
  console.log('Método:', test3.method)
  if (test3.details) console.log('Detalles:', test3.details)
  if (test3.scores) console.log('Scores:', JSON.stringify(test3.scores, null, 2))
  console.log('')

  // Test 4: Amenaza
  console.log('Test 4: Amenaza')
  const test4 = await checkProfanity('Te voy a matar')
  console.log('Texto: "Te voy a matar"')
  console.log('Resultado:', test4.isClean ? '✅ LIMPIO' : '❌ TÓXICO')
  console.log('Método:', test4.method)
  if (test4.details) console.log('Detalles:', test4.details)
  if (test4.scores) console.log('Scores:', JSON.stringify(test4.scores, null, 2))
  console.log('')

  // Test 5: Validación de username limpio
  console.log('Test 5: Username limpio')
  const test5 = await validateUsername('Juan García')
  console.log('Username: "Juan García"')
  console.log('Resultado:', test5.valid ? '✅ VÁLIDO' : '❌ INVÁLIDO')
  if (test5.error) console.log('Error:', test5.error)
  console.log('')

  // Test 6: Validación de username tóxico
  console.log('Test 6: Username tóxico')
  const test6 = await validateUsername('ElPutoAmo123')
  console.log('Username: "ElPutoAmo123"')
  console.log('Resultado:', test6.valid ? '✅ VÁLIDO' : '❌ INVÁLIDO')
  if (test6.error) console.log('Error:', test6.error)
  if (test6.details) console.log('Detalles:', test6.details)
  console.log('')

  // Test 7: Validación de texto limpio
  console.log('Test 7: Mensaje de soporte limpio')
  const test7 = await validateText('Tengo un problema con mi cuenta, ¿pueden ayudarme?', 500)
  console.log('Mensaje: "Tengo un problema con mi cuenta, ¿pueden ayudarme?"')
  console.log('Resultado:', test7.valid ? '✅ VÁLIDO' : '❌ INVÁLIDO')
  if (test7.error) console.log('Error:', test7.error)
  console.log('')

  // Test 8: Validación de texto tóxico
  console.log('Test 8: Mensaje de soporte tóxico')
  const test8 = await validateText('Esto es una mierda, sois unos inútiles', 500)
  console.log('Mensaje: "Esto es una mierda, sois unos inútiles"')
  console.log('Resultado:', test8.valid ? '✅ VÁLIDO' : '❌ INVÁLIDO')
  if (test8.error) console.log('Error:', test8.error)
  if (test8.details) console.log('Detalles:', test8.details)
  console.log('')

  // Resumen
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📊 RESUMEN DE PRUEBAS')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  const apiKeyConfigured = process.env.PERSPECTIVE_API_KEY ? '✅' : '❌'
  console.log(`API Key configurada: ${apiKeyConfigured}`)
  
  if (test1.method === 'perspective-api') {
    console.log('✅ Perspective API funcionando correctamente')
  } else {
    console.log('⚠️  Usando filtro local (Perspective API no disponible)')
    console.log('   → Configura PERSPECTIVE_API_KEY en .env.local')
    console.log('   → Ver instrucciones: PERSPECTIVE_API_SETUP.md')
  }
  
  console.log('\n🎉 Pruebas completadas!')
}

// Ejecutar tests
testProfanityFilter()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error en las pruebas:', error)
    process.exit(1)
  })
