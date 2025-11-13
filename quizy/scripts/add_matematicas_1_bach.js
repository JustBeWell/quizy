/**
 * Script para añadir contenido de Matemáticas I - Bachillerato
 */

const fs = require('fs');
const path = require('path');

const questionBanks = [
  {
    name: 'Números Reales y Complejos',
    questions: [
      { id: 1, question: '¿Cuál es la parte imaginaria de 3 + 4i?', options: [{ key: 'a', text: '3' }, { key: 'b', text: '4' }, { key: 'c', text: '4i' }, { key: 'd', text: '7' }], answers: ['b'] },
      { id: 2, question: 'El número π es:', options: [{ key: 'a', text: 'Racional' }, { key: 'b', text: 'Irracional' }, { key: 'c', text: 'Entero' }, { key: 'd', text: 'Imaginario' }], answers: ['b'] },
      { id: 3, question: 'Calcula: (2 + 3i) + (1 - 2i)', options: [{ key: 'a', text: '3 + i' }, { key: 'b', text: '3 - i' }, { key: 'c', text: '1 + i' }, { key: 'd', text: '3 + 5i' }], answers: ['a'] },
      { id: 4, question: 'El conjugado de 5 - 7i es:', options: [{ key: 'a', text: '-5 + 7i' }, { key: 'b', text: '5 + 7i' }, { key: 'c', text: '-5 - 7i' }, { key: 'd', text: '7 - 5i' }], answers: ['b'] },
      { id: 5, question: '√(-16) es igual a:', options: [{ key: 'a', text: '-4' }, { key: 'b', text: '4i' }, { key: 'c', text: '-4i' }, { key: 'd', text: 'No existe' }], answers: ['b'] },
      { id: 6, question: 'El valor absoluto de -8 es:', options: [{ key: 'a', text: '-8' }, { key: 'b', text: '0' }, { key: 'c', text: '8' }, { key: 'd', text: '±8' }], answers: ['c'] },
      { id: 7, question: 'Resuelve: |2x - 4| = 6', options: [{ key: 'a', text: 'x = 5' }, { key: 'b', text: 'x = -1 o x = 5' }, { key: 'c', text: 'x = 1' }, { key: 'd', text: 'x = 3' }], answers: ['b'] },
      { id: 8, question: 'El módulo de 3 + 4i es:', options: [{ key: 'a', text: '3' }, { key: 'b', text: '4' }, { key: 'c', text: '5' }, { key: 'd', text: '7' }], answers: ['c'] },
      { id: 9, question: 'Entre dos números racionales siempre hay:', options: [{ key: 'a', text: 'Un entero' }, { key: 'b', text: 'Infinitos racionales' }, { key: 'c', text: 'Un primo' }, { key: 'd', text: 'Nada' }], answers: ['b'] },
      { id: 10, question: '(2i)(3i) es igual a:', options: [{ key: 'a', text: '6i' }, { key: 'b', text: '-6' }, { key: 'c', text: '6' }, { key: 'd', text: '-6i' }], answers: ['b'] }
    ]
  },
  {
    name: 'Trigonometría',
    questions: [
      { id: 1, question: 'sen²(x) + cos²(x) es igual a:', options: [{ key: 'a', text: '0' }, { key: 'b', text: '1' }, { key: 'c', text: '2' }, { key: 'd', text: 'tan(x)' }], answers: ['b'] },
      { id: 2, question: 'El valor de sen(30°) es:', options: [{ key: 'a', text: '1/2' }, { key: 'b', text: '√2/2' }, { key: 'c', text: '√3/2' }, { key: 'd', text: '1' }], answers: ['a'] },
      { id: 3, question: 'cos(60°) es igual a:', options: [{ key: 'a', text: '0' }, { key: 'b', text: '1/2' }, { key: 'c', text: '√2/2' }, { key: 'd', text: '√3/2' }], answers: ['b'] },
      { id: 4, question: 'tan(45°) es:', options: [{ key: 'a', text: '0' }, { key: 'b', text: '1/2' }, { key: 'c', text: '1' }, { key: 'd', text: '√3' }], answers: ['c'] },
      { id: 5, question: 'El periodo de sen(x) es:', options: [{ key: 'a', text: 'π' }, { key: 'b', text: '2π' }, { key: 'c', text: 'π/2' }, { key: 'd', text: '4π' }], answers: ['b'] },
      { id: 6, question: 'sen(90°) es igual a:', options: [{ key: 'a', text: '0' }, { key: 'b', text: '1/2' }, { key: 'c', text: '1' }, { key: 'd', text: '√2/2' }], answers: ['c'] },
      { id: 7, question: 'La función cos(x) es:', options: [{ key: 'a', text: 'Par' }, { key: 'b', text: 'Impar' }, { key: 'c', text: 'Ni par ni impar' }, { key: 'd', text: 'Constante' }], answers: ['a'] },
      { id: 8, question: 'El valor de cos(0°) es:', options: [{ key: 'a', text: '0' }, { key: 'b', text: '1/2' }, { key: 'c', text: '1' }, { key: 'd', text: '-1' }], answers: ['c'] },
      { id: 9, question: 'sen(-x) es igual a:', options: [{ key: 'a', text: 'sen(x)' }, { key: 'b', text: '-sen(x)' }, { key: 'c', text: 'cos(x)' }, { key: 'd', text: '-cos(x)' }], answers: ['b'] },
      { id: 10, question: 'En un triángulo rectángulo, sen(α) se define como:', options: [{ key: 'a', text: 'cateto adyacente / hipotenusa' }, { key: 'b', text: 'cateto opuesto / hipotenusa' }, { key: 'c', text: 'hipotenusa / cateto opuesto' }, { key: 'd', text: 'cateto opuesto / cateto adyacente' }], answers: ['b'] }
    ]
  },
  {
    name: 'Límites y Continuidad',
    questions: [
      { id: 1, question: 'lim(x→∞) (1/x) es:', options: [{ key: 'a', text: '0' }, { key: 'b', text: '1' }, { key: 'c', text: '∞' }, { key: 'd', text: 'No existe' }], answers: ['a'] },
      { id: 2, question: 'Una función es continua en un punto si:', options: [{ key: 'a', text: 'Existe el límite' }, { key: 'b', text: 'Existe el límite y coincide con el valor de la función' }, { key: 'c', text: 'Está definida' }, { key: 'd', text: 'Es derivable' }], answers: ['b'] },
      { id: 3, question: 'lim(x→0) (sen(x)/x) es:', options: [{ key: 'a', text: '0' }, { key: 'b', text: '1' }, { key: 'c', text: '∞' }, { key: 'd', text: 'No existe' }], answers: ['b'] },
      { id: 4, question: 'Una asíntota vertical se da cuando:', options: [{ key: 'a', text: 'El límite es finito' }, { key: 'b', text: 'El límite es infinito' }, { key: 'c', text: 'La función es continua' }, { key: 'd', text: 'La función es constante' }], answers: ['b'] },
      { id: 5, question: 'lim(x→2) (x² - 4)/(x - 2) es:', options: [{ key: 'a', text: '0' }, { key: 'b', text: '2' }, { key: 'c', text: '4' }, { key: 'd', text: 'No existe' }], answers: ['c'] },
      { id: 6, question: 'La función f(x) = 1/x tiene una discontinuidad en:', options: [{ key: 'a', text: 'x = 1' }, { key: 'b', text: 'x = 0' }, { key: 'c', text: 'x = -1' }, { key: 'd', text: 'Es continua en todos los puntos' }], answers: ['b'] },
      { id: 7, question: 'lim(x→∞) (3x² + 2x)/(x² - 1) es:', options: [{ key: 'a', text: '0' }, { key: 'b', text: '1' }, { key: 'c', text: '3' }, { key: 'd', text: '∞' }], answers: ['c'] },
      { id: 8, question: 'Una función polinómica es:', options: [{ key: 'a', text: 'Continua en ℝ' }, { key: 'b', text: 'Discontinua' }, { key: 'c', text: 'No derivable' }, { key: 'd', text: 'Periódica' }], answers: ['a'] },
      { id: 9, question: 'Si lim(x→a⁺) f(x) ≠ lim(x→a⁻) f(x), la función tiene:', options: [{ key: 'a', text: 'Continuidad' }, { key: 'b', text: 'Discontinuidad de salto' }, { key: 'c', text: 'Discontinuidad evitable' }, { key: 'd', text: 'Asíntota horizontal' }], answers: ['b'] },
      { id: 10, question: 'lim(x→0⁺) (1/x) es:', options: [{ key: 'a', text: '0' }, { key: 'b', text: '-∞' }, { key: 'c', text: '+∞' }, { key: 'd', text: '1' }], answers: ['c'] }
    ]
  }
];

function createBankFiles() {
  console.log('📝 Creando tests de Matemáticas I - Bachillerato...\n');
  
  const subjectSlug = 'matematicas-1-bach';
  const subjectDir = path.join(process.cwd(), 'data', subjectSlug);
  
  // Crear directorio si no existe
  if (!fs.existsSync(subjectDir)) {
    fs.mkdirSync(subjectDir, { recursive: true });
  }
  
  // Crear archivo JSON para cada banco
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
