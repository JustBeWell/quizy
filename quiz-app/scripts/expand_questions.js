/**
 * Script para expandir las preguntas de los tests existentes de 5 a 10 preguntas
 */

const fs = require('fs');
const path = require('path');

// Preguntas adicionales por archivo
const additionalQuestions = {
  'fisica-quimica-eso/exam1.json': [
    { id: 6, question: 'La masa se mide en:', options: [{ key: 'a', text: 'Litros' }, { key: 'b', text: 'Kilogramos' }, { key: 'c', text: 'Metros' }, { key: 'd', text: 'Segundos' }], answers: ['b'] },
    { id: 7, question: 'Un cambio químico implica:', options: [{ key: 'a', text: 'Cambio de forma' }, { key: 'b', text: 'Cambio de tamaño' }, { key: 'c', text: 'Formación de nuevas sustancias' }, { key: 'd', text: 'Cambio de temperatura' }], answers: ['c'] },
    { id: 8, question: 'El número atómico indica:', options: [{ key: 'a', text: 'El número de neutrones' }, { key: 'b', text: 'El número de protones' }, { key: 'c', text: 'La masa del átomo' }, { key: 'd', text: 'El número de electrones libres' }], answers: ['b'] },
    { id: 9, question: 'Los isótopos de un elemento tienen:', options: [{ key: 'a', text: 'Distinto número de protones' }, { key: 'b', text: 'Distinto número de neutrones' }, { key: 'c', text: 'Distinto número de electrones' }, { key: 'd', text: 'Distinta configuración electrónica' }], answers: ['b'] },
    { id: 10, question: 'Un mol contiene aproximadamente:', options: [{ key: 'a', text: '6.02 × 10²³ partículas' }, { key: 'b', text: '1000 partículas' }, { key: 'c', text: '100 partículas' }, { key: 'd', text: '12 partículas' }], answers: ['a'] }
  ],
  'fisica-quimica-eso/exam2.json': [
    { id: 6, question: 'La velocidad es una magnitud:', options: [{ key: 'a', text: 'Escalar' }, { key: 'b', text: 'Vectorial' }, { key: 'c', text: 'Constante' }, { key: 'd', text: 'Relativa' }], answers: ['b'] },
    { id: 7, question: 'La unidad de fuerza en el SI es:', options: [{ key: 'a', text: 'El julio' }, { key: 'b', text: 'El newton' }, { key: 'c', text: 'El kilogramo' }, { key: 'd', text: 'El metro' }], answers: ['b'] },
    { id: 8, question: 'El peso de un cuerpo depende de:', options: [{ key: 'a', text: 'Solo su masa' }, { key: 'b', text: 'Su volumen' }, { key: 'c', text: 'La gravedad del lugar' }, { key: 'd', text: 'Su temperatura' }], answers: ['c'] },
    { id: 9, question: 'La inercia es la tendencia de un cuerpo a:', options: [{ key: 'a', text: 'Acelerarse' }, { key: 'b', text: 'Mantenerse en su estado de reposo o movimiento' }, { key: 'c', text: 'Cambiar de dirección' }, { key: 'd', text: 'Caer' }], answers: ['b'] },
    { id: 10, question: 'Si la aceleración de un cuerpo es cero:', options: [{ key: 'a', text: 'Está en reposo' }, { key: 'b', text: 'Se mueve con velocidad constante' }, { key: 'c', text: 'No actúa ninguna fuerza sobre él' }, { key: 'd', text: 'Puede estar en reposo o moviéndose con velocidad constante' }], answers: ['d'] }
  ],
  'biologia-geologia-eso/exam1.json': [
    { id: 6, question: 'El ADN se encuentra en:', options: [{ key: 'a', text: 'El citoplasma' }, { key: 'b', text: 'El núcleo' }, { key: 'c', text: 'La membrana' }, { key: 'd', text: 'Los ribosomas' }], answers: ['b'] },
    { id: 7, question: 'La función de las mitocondrias es:', options: [{ key: 'a', text: 'Sintetizar proteínas' }, { key: 'b', text: 'Producir energía (ATP)' }, { key: 'c', text: 'Digerir sustancias' }, { key: 'd', text: 'Almacenar agua' }], answers: ['b'] },
    { id: 8, question: 'La célula procariota se caracteriza por:', options: [{ key: 'a', text: 'Tener núcleo definido' }, { key: 'b', text: 'No tener núcleo definido' }, { key: 'c', text: 'Tener muchos orgánulos' }, { key: 'd', text: 'Ser siempre eucariota' }], answers: ['b'] },
    { id: 9, question: 'Los cloroplastos se encuentran en:', options: [{ key: 'a', text: 'Células animales' }, { key: 'b', text: 'Células vegetales' }, { key: 'c', text: 'Todas las células' }, { key: 'd', text: 'Solo en bacterias' }], answers: ['b'] },
    { id: 10, question: 'La división celular que produce células idénticas es:', options: [{ key: 'a', text: 'Meiosis' }, { key: 'b', text: 'Mitosis' }, { key: 'c', text: 'Fecundación' }, { key: 'd', text: 'Reproducción sexual' }], answers: ['b'] }
  ],
  'biologia-geologia-eso/exam2.json': [
    { id: 6, question: 'La roca sedimentaria más común es:', options: [{ key: 'a', text: 'El granito' }, { key: 'b', text: 'El mármol' }, { key: 'c', text: 'La caliza' }, { key: 'd', text: 'El basalto' }], answers: ['c'] },
    { id: 7, question: 'Las rocas ígneas se forman por:', options: [{ key: 'a', text: 'Sedimentación' }, { key: 'b', text: 'Solidificación del magma' }, { key: 'c', text: 'Metamorfismo' }, { key: 'd', text: 'Erosión' }], answers: ['b'] },
    { id: 8, question: 'El mineral más duro en la escala de Mohs es:', options: [{ key: 'a', text: 'El talco' }, { key: 'b', text: 'El yeso' }, { key: 'c', text: 'El cuarzo' }, { key: 'd', text: 'El diamante' }], answers: ['d'] },
    { id: 9, question: 'La meteorización es:', options: [{ key: 'a', text: 'El transporte de sedimentos' }, { key: 'b', text: 'La alteración de las rocas por agentes externos' }, { key: 'c', text: 'La formación de montañas' }, { key: 'd', text: 'La solidificación del magma' }], answers: ['b'] },
    { id: 10, question: 'Las placas tectónicas se mueven debido a:', options: [{ key: 'a', text: 'La gravedad' }, { key: 'b', text: 'Las corrientes de convección en el manto' }, { key: 'c', text: 'El viento' }, { key: 'd', text: 'Las mareas' }], answers: ['b'] }
  ],
  'historia-espana-bach/exam1.json': [
    { id: 6, question: 'El bando nacional estaba liderado por:', options: [{ key: 'a', text: 'Manuel Azaña' }, { key: 'b', text: 'Francisco Largo Caballero' }, { key: 'c', text: 'Francisco Franco' }, { key: 'd', text: 'José Antonio Primo de Rivera' }], answers: ['c'] },
    { id: 7, question: 'La batalla del Ebro tuvo lugar en:', options: [{ key: 'a', text: '1936' }, { key: 'b', text: '1937' }, { key: 'c', text: '1938' }, { key: 'd', text: '1939' }], answers: ['c'] },
    { id: 8, question: 'Las Brigadas Internacionales apoyaron a:', options: [{ key: 'a', text: 'El bando nacional' }, { key: 'b', text: 'El bando republicano' }, { key: 'c', text: 'Ambos bandos' }, { key: 'd', text: 'Ningún bando' }], answers: ['b'] },
    { id: 9, question: 'El bombardeo de Guernica fue realizado por:', options: [{ key: 'a', text: 'La Legión Cóndor alemana' }, { key: 'b', text: 'Las tropas republicanas' }, { key: 'c', text: 'Las Brigadas Internacionales' }, { key: 'd', text: 'El ejército francés' }], answers: ['a'] },
    { id: 10, question: 'La guerra terminó oficialmente el:', options: [{ key: 'a', text: '1 de abril de 1939' }, { key: 'b', text: '18 de julio de 1936' }, { key: 'c', text: '1 de octubre de 1938' }, { key: 'd', text: '14 de abril de 1931' }], answers: ['a'] }
  ],
  'historia-espana-bach/exam2.json': [
    { id: 6, question: 'El rey Juan Carlos I fue proclamado rey en:', options: [{ key: 'a', text: '1975' }, { key: 'b', text: '1976' }, { key: 'c', text: '1977' }, { key: 'd', text: '1978' }], answers: ['a'] },
    { id: 7, question: 'El intento de golpe de estado del 23-F ocurrió en:', options: [{ key: 'a', text: '1978' }, { key: 'b', text: '1981' }, { key: 'c', text: '1982' }, { key: 'd', text: '1985' }], answers: ['b'] },
    { id: 8, question: 'La figura clave de la Transición fue:', options: [{ key: 'a', text: 'Felipe González' }, { key: 'b', text: 'Adolfo Suárez' }, { key: 'c', text: 'Santiago Carrillo' }, { key: 'd', text: 'Manuel Fraga' }], answers: ['b'] },
    { id: 9, question: 'Las primeras elecciones democráticas se celebraron en:', options: [{ key: 'a', text: '1975' }, { key: 'b', text: '1976' }, { key: 'c', text: '1977' }, { key: 'd', text: '1978' }], answers: ['c'] },
    { id: 10, question: 'La legalización del PCE (Partido Comunista) tuvo lugar en:', options: [{ key: 'a', text: '1975' }, { key: 'b', text: '1976' }, { key: 'c', text: '1977' }, { key: 'd', text: '1982' }], answers: ['c'] }
  ],
  'filosofia-bach/exam1.json': [
    { id: 6, question: 'La teoría de las Ideas de Platón sostiene que:', options: [{ key: 'a', text: 'Solo existe el mundo sensible' }, { key: 'b', text: 'Existen dos mundos: el sensible y el inteligible' }, { key: 'c', text: 'No existe la realidad' }, { key: 'd', text: 'Todo es materia' }], answers: ['b'] },
    { id: 7, question: 'El mito de la caverna ilustra:', options: [{ key: 'a', text: 'La política' }, { key: 'b', text: 'El conocimiento y la ignorancia' }, { key: 'c', text: 'La ética' }, { key: 'd', text: 'La lógica' }], answers: ['b'] },
    { id: 8, question: 'Para Aristóteles, la sustancia es:', options: [{ key: 'a', text: 'La forma pura' }, { key: 'b', text: 'La materia pura' }, { key: 'c', text: 'La unión de materia y forma' }, { key: 'd', text: 'Una idea abstracta' }], answers: ['c'] },
    { id: 9, question: 'El concepto de "eudaimonía" en Aristóteles se refiere a:', options: [{ key: 'a', text: 'El placer' }, { key: 'b', text: 'El poder' }, { key: 'c', text: 'La felicidad o vida plena' }, { key: 'd', text: 'La riqueza' }], answers: ['c'] },
    { id: 10, question: 'Según Platón, el gobernante ideal debe ser:', options: [{ key: 'a', text: 'El más rico' }, { key: 'b', text: 'El filósofo-rey' }, { key: 'c', text: 'El más fuerte' }, { key: 'd', text: 'El elegido por el pueblo' }], answers: ['b'] }
  ]
};

async function expandQuestions() {
  console.log('🚀 Expandiendo preguntas de los tests...\n');
  
  let totalAdded = 0;
  
  for (const [filePath, questions] of Object.entries(additionalQuestions)) {
    const fullPath = path.join(process.cwd(), 'data', filePath);
    
    try {
      // Leer archivo existente
      const fileContent = fs.readFileSync(fullPath, 'utf8');
      const bankData = JSON.parse(fileContent);
      
      const originalCount = bankData.questions.length;
      
      // Agregar nuevas preguntas
      bankData.questions.push(...questions);
      
      // Guardar archivo
      fs.writeFileSync(fullPath, JSON.stringify(bankData, null, 2), 'utf8');
      
      console.log(`  ✓ ${filePath}: ${originalCount} → ${bankData.questions.length} preguntas`);
      totalAdded += questions.length;
    } catch (error) {
      console.error(`  ✗ Error con ${filePath}:`, error.message);
    }
  }
  
  console.log(`\n✅ ¡Expansión completada!`);
  console.log(`   ${totalAdded} preguntas añadidas en total`);
}

expandQuestions();
