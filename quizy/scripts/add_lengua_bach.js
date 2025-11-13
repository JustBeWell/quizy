/**
 * Script para añadir contenido de Lengua Castellana y Literatura - Bachillerato
 */

const fs = require('fs');
const path = require('path');

const questionBanks = [
  {
    name: 'Literatura Española: Siglo de Oro',
    questions: [
      { id: 1, question: '¿Quién escribió "Don Quijote de la Mancha"?', options: [{ key: 'a', text: 'Lope de Vega' }, { key: 'b', text: 'Miguel de Cervantes' }, { key: 'c', text: 'Garcilaso de la Vega' }, { key: 'd', text: 'Calderón de la Barca' }], answers: ['b'] },
      { id: 2, question: 'El Siglo de Oro español comprende:', options: [{ key: 'a', text: 'Siglos XVI y XVII' }, { key: 'b', text: 'Solo el siglo XVI' }, { key: 'c', text: 'Siglos XVIII y XIX' }, { key: 'd', text: 'Solo el siglo XVII' }], answers: ['a'] },
      { id: 3, question: 'Garcilaso de la Vega introdujo en España:', options: [{ key: 'a', text: 'El romance' }, { key: 'b', text: 'El soneto italiano' }, { key: 'c', text: 'La novela' }, { key: 'd', text: 'El teatro' }], answers: ['b'] },
      { id: 4, question: '"Fuenteovejuna" fue escrita por:', options: [{ key: 'a', text: 'Cervantes' }, { key: 'b', text: 'Lope de Vega' }, { key: 'c', text: 'Quevedo' }, { key: 'd', text: 'Góngora' }], answers: ['b'] },
      { id: 5, question: 'La obra "La vida es sueño" es de:', options: [{ key: 'a', text: 'Lope de Vega' }, { key: 'b', text: 'Tirso de Molina' }, { key: 'c', text: 'Calderón de la Barca' }, { key: 'd', text: 'Cervantes' }], answers: ['c'] },
      { id: 6, question: 'El Lazarillo de Tormes es:', options: [{ key: 'a', text: 'Una novela caballeresca' }, { key: 'b', text: 'Una novela picaresca' }, { key: 'c', text: 'Una obra de teatro' }, { key: 'd', text: 'Un poema épico' }], answers: ['b'] },
      { id: 7, question: 'Luis de Góngora es representante del:', options: [{ key: 'a', text: 'Conceptismo' }, { key: 'b', text: 'Culteranismo' }, { key: 'c', text: 'Realismo' }, { key: 'd', text: 'Romanticismo' }], answers: ['b'] },
      { id: 8, question: 'Francisco de Quevedo es conocido por su:', options: [{ key: 'a', text: 'Prosa satírica' }, { key: 'b', text: 'Teatro religioso' }, { key: 'c', text: 'Novela caballeresca' }, { key: 'd', text: 'Poesía épica' }], answers: ['a'] },
      { id: 9, question: 'El teatro del Siglo de Oro se caracteriza por:', options: [{ key: 'a', text: 'Respetar las tres unidades clásicas' }, { key: 'b', text: 'Mezclar lo trágico y lo cómico' }, { key: 'c', text: 'Ser solo religioso' }, { key: 'd', text: 'Estar en prosa' }], answers: ['b'] },
      { id: 10, question: 'Santa Teresa de Jesús escribió:', options: [{ key: 'a', text: 'Novelas' }, { key: 'b', text: 'Obras místicas' }, { key: 'c', text: 'Teatro' }, { key: 'd', text: 'Poesía épica' }], answers: ['b'] }
    ]
  },
  {
    name: 'Literatura Contemporánea: Generación del 27',
    questions: [
      { id: 1, question: 'Federico García Lorca escribió:', options: [{ key: 'a', text: 'La casa de Bernarda Alba' }, { key: 'b', text: 'Don Quijote' }, { key: 'c', text: 'El Lazarillo' }, { key: 'd', text: 'Fuenteovejuna' }], answers: ['a'] },
      { id: 2, question: 'La Generación del 27 se caracteriza por:', options: [{ key: 'a', text: 'Rechazar la tradición' }, { key: 'b', text: 'Fusionar tradición y vanguardia' }, { key: 'c', text: 'Solo escribir prosa' }, { key: 'd', text: 'Ser realistas' }], answers: ['b'] },
      { id: 3, question: 'Rafael Alberti fue:', options: [{ key: 'a', text: 'Novelista' }, { key: 'b', text: 'Poeta' }, { key: 'c', text: 'Dramaturgo exclusivamente' }, { key: 'd', text: 'Ensayista' }], answers: ['b'] },
      { id: 4, question: '"Poeta en Nueva York" es de:', options: [{ key: 'a', text: 'Rafael Alberti' }, { key: 'b', text: 'Federico García Lorca' }, { key: 'c', text: 'Pedro Salinas' }, { key: 'd', text: 'Jorge Guillén' }], answers: ['b'] },
      { id: 5, question: 'Luis Cernuda pertenece a:', options: [{ key: 'a', text: 'La Generación del 98' }, { key: 'b', text: 'La Generación del 27' }, { key: 'c', text: 'El Romanticismo' }, { key: 'd', text: 'El Realismo' }], answers: ['b'] },
      { id: 6, question: 'Vicente Aleixandre ganó:', options: [{ key: 'a', text: 'El Premio Cervantes' }, { key: 'b', text: 'El Premio Nobel de Literatura' }, { key: 'c', text: 'El Premio Príncipe de Asturias' }, { key: 'd', text: 'Ningún premio' }], answers: ['b'] },
      { id: 7, question: 'El surrealismo influyó en:', options: [{ key: 'a', text: 'Todos los autores del 27' }, { key: 'b', text: 'Solo García Lorca' }, { key: 'c', text: 'Ningún autor español' }, { key: 'd', text: 'Solo poetas extranjeros' }], answers: ['a'] },
      { id: 8, question: 'La Guerra Civil afectó a la Generación del 27:', options: [{ key: 'a', text: 'No les afectó' }, { key: 'b', text: 'Provocó exilio y represión' }, { key: 'c', text: 'Les benefició' }, { key: 'd', text: 'No existían entonces' }], answers: ['b'] },
      { id: 9, question: 'Pedro Salinas es conocido por su poesía:', options: [{ key: 'a', text: 'Épica' }, { key: 'b', text: 'Amorosa' }, { key: 'c', text: 'Religiosa' }, { key: 'd', text: 'Satírica' }], answers: ['b'] },
      { id: 10, question: 'Dámaso Alonso fue:', options: [{ key: 'a', text: 'Solo poeta' }, { key: 'b', text: 'Poeta y crítico literario' }, { key: 'c', text: 'Novelista' }, { key: 'd', text: 'Dramaturgo' }], answers: ['b'] }
    ]
  },
  {
    name: 'Análisis de Textos y Comentario',
    questions: [
      { id: 1, question: 'Un texto narrativo se caracteriza por:', options: [{ key: 'a', text: 'Contar hechos' }, { key: 'b', text: 'Expresar sentimientos' }, { key: 'c', text: 'Argumentar ideas' }, { key: 'd', text: 'Dar órdenes' }], answers: ['a'] },
      { id: 2, question: 'El narrador omnisciente:', options: [{ key: 'a', text: 'Es un personaje' }, { key: 'b', text: 'Lo sabe todo' }, { key: 'c', text: 'Solo cuenta lo que ve' }, { key: 'd', text: 'No existe' }], answers: ['b'] },
      { id: 3, question: 'Una metáfora es:', options: [{ key: 'a', text: 'Una comparación explícita' }, { key: 'b', text: 'Una identificación implícita' }, { key: 'c', text: 'Una exageración' }, { key: 'd', text: 'Una personificación' }], answers: ['b'] },
      { id: 4, question: 'El símil usa:', options: [{ key: 'a', text: 'Identificación directa' }, { key: 'b', text: 'Comparación con "como" o "cual"' }, { key: 'c', text: 'Exageración' }, { key: 'd', text: 'Ironía' }], answers: ['b'] },
      { id: 5, question: 'La hipérbole consiste en:', options: [{ key: 'a', text: 'Comparar' }, { key: 'b', text: 'Exagerar' }, { key: 'c', text: 'Personificar' }, { key: 'd', text: 'Repetir' }], answers: ['b'] },
      { id: 6, question: 'Un texto argumentativo busca:', options: [{ key: 'a', text: 'Narrar hechos' }, { key: 'b', text: 'Describir' }, { key: 'c', text: 'Convencer' }, { key: 'd', text: 'Informar objetivamente' }], answers: ['c'] },
      { id: 7, question: 'La personificación atribuye:', options: [{ key: 'a', text: 'Cualidades humanas a seres inanimados' }, { key: 'b', text: 'Cualidades animales a humanos' }, { key: 'c', text: 'Exageración' }, { key: 'd', text: 'Comparación' }], answers: ['a'] },
      { id: 8, question: 'El clímax de una narración es:', options: [{ key: 'a', text: 'La introducción' }, { key: 'b', text: 'El momento de mayor tensión' }, { key: 'c', text: 'El desenlace' }, { key: 'd', text: 'La presentación de personajes' }], answers: ['b'] },
      { id: 9, question: 'Un texto expositivo tiene como objetivo:', options: [{ key: 'a', text: 'Convencer' }, { key: 'b', text: 'Informar objetivamente' }, { key: 'c', text: 'Expresar emociones' }, { key: 'd', text: 'Narrar hechos ficticios' }], answers: ['b'] },
      { id: 10, question: 'La anáfora es:', options: [{ key: 'a', text: 'Repetición al inicio de versos' }, { key: 'b', text: 'Una comparación' }, { key: 'c', text: 'Una exageración' }, { key: 'd', text: 'Un tipo de rima' }], answers: ['a'] }
    ]
  }
];

function createBankFiles() {
  console.log('📝 Creando tests de Lengua Castellana y Literatura - Bachillerato...\n');
  
  const subjectSlug = 'lengua-bach';
  const subjectDir = path.join(process.cwd(), 'data', subjectSlug);
  
  if (!fs.existsSync(subjectDir)) {
    fs.mkdirSync(subjectDir, { recursive: true });
  }
  
  questionBanks.forEach((bank, index) => {
    const fileName = `exam${index + 1}.json`;
    const filePath = path.join(subjectDir, fileName);
    
    const bankData = {
      name: bank.name,
      questions: bank.questions
    };
    
    fs.writeFileSync(filePath, JSON.stringify(bankData, null, 2), 'utf8');
    console.log(`  ✓ ${fileName} - ${bank.name} (${bank.questions.length} preguntas)`);
  });
  
  const totalQuestions = questionBanks.reduce((sum, bank) => sum + bank.questions.length, 0);
  console.log(`\n✅ ¡Completado! ${questionBanks.length} tests, ${totalQuestions} preguntas totales`);
}

createBankFiles();
