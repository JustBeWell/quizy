/**
 * Script para importar mazos de Anki (.apkg) a la base de datos
 * 
 * Los archivos .apkg son archivos ZIP que contienen:
 * - collection.anki2: Base de datos SQLite con las tarjetas
 * - media: Archivos multimedia (opcional)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { query } = require('../lib/db');

// Configuración
const ANKI_FILE = process.argv[2]; // Ruta al archivo .apkg
const SUBJECT_SLUG = process.argv[3] || 'arq-virt'; // Slug de la asignatura
const QUESTIONNAIRE_NAME = process.argv[4]; // Nombre del cuestionario

if (!ANKI_FILE) {
  console.error('❌ Uso: node scripts/import_anki.js <archivo.apkg> [subject-slug] [nombre-cuestionario]');
  console.error('Ejemplo: node scripts/import_anki.js ./deck.apkg arq-virt "Examen Final"');
  process.exit(1);
}

if (!fs.existsSync(ANKI_FILE)) {
  console.error(`❌ El archivo ${ANKI_FILE} no existe`);
  process.exit(1);
}

async function main() {
  console.log('📦 Importador de Anki a Quizy\n');
  
  try {
    // 1. Crear directorio temporal
    const tmpDir = path.join(__dirname, 'tmp_anki');
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true });
    }
    fs.mkdirSync(tmpDir);
    console.log('✓ Directorio temporal creado');

    // 2. Descomprimir .apkg (es un archivo ZIP)
    console.log('📂 Extrayendo archivo Anki...');
    execSync(`unzip -q "${ANKI_FILE}" -d "${tmpDir}"`);
    console.log('✓ Archivo extraído');

    // 3. Leer la base de datos SQLite
    const dbPath = path.join(tmpDir, 'collection.anki2');
    if (!fs.existsSync(dbPath)) {
      throw new Error('No se encontró collection.anki2 en el archivo .apkg');
    }

    // 4. Extraer datos con sqlite3
    console.log('🔍 Extrayendo tarjetas...');
    const cardsJson = execSync(
      `sqlite3 "${dbPath}" "SELECT n.flds, n.tags FROM notes n" -json`,
      { encoding: 'utf8' }
    );
    
    const cards = JSON.parse(cardsJson);
    console.log(`✓ Encontradas ${cards.length} tarjetas`);

    if (cards.length === 0) {
      console.log('⚠️  No se encontraron tarjetas en el mazo');
      return;
    }

    // 5. Verificar/crear asignatura
    console.log(`\n🎓 Verificando asignatura "${SUBJECT_SLUG}"...`);
    let subjectResult = await query(
      'SELECT id FROM subjects WHERE slug = $1',
      [SUBJECT_SLUG]
    );

    let subjectId;
    if (subjectResult.rows.length === 0) {
      console.log('⚠️  Asignatura no encontrada. Creándola...');
      const name = SUBJECT_SLUG.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      const insertResult = await query(
        'INSERT INTO subjects (name, slug) VALUES ($1, $2) RETURNING id',
        [name, SUBJECT_SLUG]
      );
      subjectId = insertResult.rows[0].id;
      console.log(`✓ Asignatura creada con ID: ${subjectId}`);
    } else {
      subjectId = subjectResult.rows[0].id;
      console.log(`✓ Asignatura encontrada con ID: ${subjectId}`);
    }

    // 6. Procesar preguntas
    console.log(`\n📋 Procesando ${cards.length} preguntas...`);
    let successCount = 0;
    let errorCount = 0;
    const questionsArray = [];

    for (const card of cards) {
      try {
        // Los campos están separados por el carácter ASCII 31 (0x1F)
        const fields = card.flds.split('\x1f');
        
        if (fields.length < 2) {
          console.log(`⚠️  Tarjeta con formato inválido: ${card.flds.substring(0, 50)}...`);
          errorCount++;
          continue;
        }

        const question = stripHTML(fields[0].trim());
        const answer = stripHTML(fields[1].trim());

        if (!question || !answer) {
          console.log('⚠️  Pregunta o respuesta vacía, omitiendo...');
          errorCount++;
          continue;
        }

        // Crear 3 opciones incorrectas ficticias
        // (Anki no tiene opciones múltiples, solo pregunta/respuesta)
        const wrongOptions = [
          'Opción incorrecta 1',
          'Opción incorrecta 2',
          'Opción incorrecta 3'
        ];

        const allOptions = [answer, ...wrongOptions];
        shuffle(allOptions);
        const correctIndex = allOptions.indexOf(answer);

        questionsArray.push({
          question: question,
          options: allOptions,
          correct: correctIndex
        });

        successCount++;
      } catch (err) {
        console.error(`❌ Error procesando tarjeta:`, err.message);
        errorCount++;
      }
    }

    // 7. Crear cuestionario con todas las preguntas
    if (questionsArray.length === 0) {
      console.log('❌ No se pudieron procesar preguntas. Abortando.');
      process.exit(1);
    }

    const questionnaireTitle = QUESTIONNAIRE_NAME || 
      path.basename(ANKI_FILE, '.apkg').replace(/_/g, ' ');
    
    console.log(`\n📝 Creando cuestionario "${questionnaireTitle}"...`);
    
    // Verificar si ya existe
    const existingQuestionnaire = await query(
      'SELECT id FROM question_banks WHERE name = $1 AND subject_id = $2',
      [questionnaireTitle, subjectId]
    );

    if (existingQuestionnaire.rows.length > 0) {
      console.log('⚠️  Ya existe un cuestionario con ese nombre');
      console.log('¿Deseas continuar? (se creará uno nuevo)');
    }

    const bankResult = await query(
      `INSERT INTO question_banks (name, subject_id, questions, created_by, is_published) 
       VALUES ($1, $2, $3, $4, false) 
       RETURNING id`,
      [questionnaireTitle, subjectId, JSON.stringify(questionsArray), 'system']
    );
    const bankId = bankResult.rows[0].id;
    console.log(`✓ Cuestionario creado con ID: ${bankId}`)

    console.log(`\n✅ Importación completada:`);
    console.log(`   - ${successCount} preguntas importadas`);
    console.log(`   - ${errorCount} errores`);
    console.log(`\n📊 Cuestionario creado: "${questionnaireTitle}" (ID: ${bankId})`);
    console.log(`   Estado: No publicado (puedes publicarlo desde el panel de admin)`);

    // Limpiar
    fs.rmSync(tmpDir, { recursive: true });
    console.log('\n🧹 Archivos temporales eliminados');

  } catch (error) {
    console.error('\n❌ Error durante la importación:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Utilidades
function stripHTML(html) {
  return html
    .replace(/<[^>]*>/g, '') // Eliminar tags HTML
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

main().catch(console.error);
