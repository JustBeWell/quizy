/**
 * Script para importar archivos TXT de Anki a la base de datos
 */

const fs = require('fs');
const path = require('path');
const { query } = require('../lib/db');

// Configuración
const TXT_FILE = process.argv[2];
const SUBJECT_SLUG = process.argv[3] || 'gestion-software';
const QUESTIONNAIRE_NAME = process.argv[4];

if (!TXT_FILE) {
  console.error('❌ Uso: node scripts/import_anki_txt.js <archivo.txt> [subject-slug] [nombre-cuestionario]');
  process.exit(1);
}

if (!fs.existsSync(TXT_FILE)) {
  console.error(`❌ El archivo ${TXT_FILE} no existe`);
  process.exit(1);
}

async function main() {
  console.log('📦 Importador de Anki TXT a Quizy\n');
  
  try {
    console.log('📂 Leyendo archivo...');
    const content = fs.readFileSync(TXT_FILE, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    console.log(`✓ ${lines.length} líneas encontradas`);

    const cards = [];
    let skipped = 0;
    
    for (let i = 2; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = line.split('\t');
      if (parts.length < 2) continue;

      // Campo 1: Pregunta completa con todas las opciones
      // Campo 2: Respuestas correctas (NO son opciones adicionales)
      const questionText = parts[0];
      const answerText = parts[1];

      if (questionText.includes('<img') || answerText.includes('<img')) {
        skipped++;
        continue;
      }

      cards.push({ question: questionText, answer: answerText });
    }

    console.log(`✓ ${cards.length} tarjetas encontradas (${skipped} imágenes omitidas)`);

    if (cards.length === 0) {
      console.log('⚠️  No se encontraron tarjetas');
      return;
    }

    console.log(`\n🎓 Verificando asignatura "${SUBJECT_SLUG}"...`);
    let subjectResult = await query('SELECT id FROM subjects WHERE slug = $1', [SUBJECT_SLUG]);

    let subjectId;
    if (subjectResult.rows.length === 0) {
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

    console.log(`\n📋 Procesando ${cards.length} preguntas...`);
    let successCount = 0;
    let errorCount = 0;
    const questionsArray = [];

    for (const card of cards) {
      try {
        const questionRaw = stripHTML(card.question);
        const answerRaw = stripHTML(card.answer);

        if (!questionRaw || !answerRaw) {
          errorCount++;
          continue;
        }

        const parsed = parseQuestionWithOptions(questionRaw);
        
        if (!parsed || !parsed.options || parsed.options.length === 0) {
          console.log('⚠️  Sin opciones:', questionRaw.substring(0, 60));
          errorCount++;
          continue;
        }

        let finalStatement = parsed.statement.trim();
        if (finalStatement.length < 10 || /^[\d\s\.\-""]*$/.test(finalStatement)) {
          finalStatement = `Selecciona la opción correcta:`;
        }

        let cleanAnswer = answerRaw.replace(/^["']|["']$/g, '').replace(/\s+/g, ' ').trim();

        const correctIndices = findCorrectOptions(parsed.options, cleanAnswer);
        
        if (correctIndices.length === 0) {
          console.log(`⚠️  Sin respuesta: ${parsed.statement.substring(0, 40)}`);
          errorCount++;
          continue;
        }

        const optionsWithLetterKeys = parsed.options.map((opt, idx) => ({
          key: String.fromCharCode(97 + idx),
          text: opt.text
        }));

        const answersAsLetters = correctIndices.map(idx => String.fromCharCode(97 + idx));

        questionsArray.push({
          id: successCount + 1,
          question: finalStatement,
          options: optionsWithLetterKeys,
          answers: answersAsLetters
        });

        successCount++;
      } catch (err) {
        console.error(`❌ Error:`, err.message);
        errorCount++;
      }
    }

    if (questionsArray.length === 0) {
      console.log('❌ No se pudieron procesar preguntas.');
      process.exit(1);
    }

    const questionnaireTitle = QUESTIONNAIRE_NAME || path.basename(TXT_FILE, '.txt').replace(/_/g, ' ');
    
    console.log(`\n📝 Creando cuestionario "${questionnaireTitle}"...`);

    const bankResult = await query(
      `INSERT INTO question_banks (name, subject_id, questions, created_by, is_published) 
       VALUES ($1, $2, $3, $4, false) 
       RETURNING id`,
      [questionnaireTitle, subjectId, JSON.stringify(questionsArray), 'system']
    );

    console.log(`\n✅ Importación completada:`);
    console.log(`   - ${successCount} preguntas`);
    console.log(`   - ${errorCount} errores`);
    console.log(`   - ${skipped} imágenes`);
    console.log(`   ID: ${bankResult.rows[0].id}`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

function stripHTML(html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function parseQuestionWithOptions(text) {
  const selectMarkerMatch = text.match(/Selecciona una.*?:/i);
  let startOfOptions = selectMarkerMatch ? text.indexOf(selectMarkerMatch[0]) + selectMarkerMatch[0].length : 0;
  
  const textAfterMarker = text.substring(startOfOptions);
  const optionPattern = /\n([a-h])\.\s+([^\n]+)/gi;
  
  const options = [];
  let match;
  let firstOptionIndex = -1;
  
  while ((match = optionPattern.exec(textAfterMarker)) !== null) {
    if (firstOptionIndex === -1) {
      firstOptionIndex = match.index;
    }
    
    const letter = match[1].toLowerCase();
    const optionText = match[2].trim();
    
    if (optionText.length > 0 && optionText.length < 300) {
      options.push({ letter: letter, text: optionText });
    }
  }
  
  if (options.length === 0) {
    if (text.toLowerCase().includes('verdadero') && text.toLowerCase().includes('falso')) {
      const statement = text.replace(/verdadero|falso/gi, '').replace(/Selecciona una.*/i, '').trim();
      return {
        statement: statement,
        options: [
          { letter: 'a', text: 'Verdadero' },
          { letter: 'b', text: 'Falso' }
        ]
      };
    }
    return null;
  }
  
  let statement = '';
  if (selectMarkerMatch && firstOptionIndex >= 0) {
    statement = text.substring(0, text.indexOf(selectMarkerMatch[0])).trim();
  } else if (firstOptionIndex >= 0) {
    statement = textAfterMarker.substring(0, firstOptionIndex).trim();
  } else {
    statement = text.trim();
  }
  
  return { statement, options };
}

function findCorrectOptions(options, answerText) {
  const correctIndices = [];
  
  options.forEach((opt, idx) => {
    const letterPattern = new RegExp(`\\b${opt.letter}\\.`, 'i');
    if (letterPattern.test(answerText)) {
      correctIndices.push(idx);
      return;
    }
    
    if (answerText.toLowerCase().includes(opt.text.toLowerCase())) {
      correctIndices.push(idx);
    }
  });
  
  return correctIndices;
}

main().catch(console.error);
