/**
 * Script para añadir contenido de Física - Bachillerato
 */

const fs = require('fs');
const path = require('path');

const questionBanks = [
  {
    name: 'Cinemática: Movimiento Rectilíneo',
    questions: [
      { id: 1, question: 'En un MRU, la velocidad es:', options: [{ key: 'a', text: 'Constante' }, { key: 'b', text: 'Variable' }, { key: 'c', text: 'Nula' }, { key: 'd', text: 'Creciente' }], answers: ['a'] },
      { id: 2, question: 'La ecuación del MRUA es:', options: [{ key: 'a', text: 'x = v·t' }, { key: 'b', text: 'x = x₀ + v₀·t + ½a·t²' }, { key: 'c', text: 'v = a·t' }, { key: 'd', text: 'F = m·a' }], answers: ['b'] },
      { id: 3, question: 'La aceleración en un MRU es:', options: [{ key: 'a', text: 'Positiva' }, { key: 'b', text: 'Negativa' }, { key: 'c', text: 'Cero' }, { key: 'd', text: 'Variable' }], answers: ['c'] },
      { id: 4, question: 'Un objeto cae libremente con aceleración:', options: [{ key: 'a', text: '0 m/s²' }, { key: 'b', text: '9.8 m/s²' }, { key: 'c', text: '1 m/s²' }, { key: 'd', text: '10 km/s²' }], answers: ['b'] },
      { id: 5, question: 'La pendiente en una gráfica x-t representa:', options: [{ key: 'a', text: 'Aceleración' }, { key: 'b', text: 'Velocidad' }, { key: 'c', text: 'Posición' }, { key: 'd', text: 'Tiempo' }], answers: ['b'] },
      { id: 6, question: 'En un MRUA, si v₀ = 0 y a = 2 m/s², ¿qué velocidad tiene tras 5 s?', options: [{ key: 'a', text: '2 m/s' }, { key: 'b', text: '5 m/s' }, { key: 'c', text: '7 m/s' }, { key: 'd', text: '10 m/s' }], answers: ['d'] },
      { id: 7, question: 'Un coche frena con a = -3 m/s². Si v₀ = 30 m/s, ¿cuánto tarda en parar?', options: [{ key: 'a', text: '5 s' }, { key: 'b', text: '10 s' }, { key: 'c', text: '15 s' }, { key: 'd', text: '20 s' }], answers: ['b'] },
      { id: 8, question: 'La posición en función del tiempo en MRU es una función:', options: [{ key: 'a', text: 'Constante' }, { key: 'b', text: 'Lineal' }, { key: 'c', text: 'Cuadrática' }, { key: 'd', text: 'Exponencial' }], answers: ['b'] },
      { id: 9, question: 'Si lanzamos un objeto verticalmente hacia arriba, en el punto más alto:', options: [{ key: 'a', text: 'v = 0, a = 0' }, { key: 'b', text: 'v = 0, a = g' }, { key: 'c', text: 'v = g, a = 0' }, { key: 'd', text: 'v = g, a = g' }], answers: ['b'] },
      { id: 10, question: 'La distancia recorrida en un MRU durante 10 s a 5 m/s es:', options: [{ key: 'a', text: '5 m' }, { key: 'b', text: '10 m' }, { key: 'c', text: '15 m' }, { key: 'd', text: '50 m' }], answers: ['d'] }
    ]
  },
  {
    name: 'Dinámica: Leyes de Newton',
    questions: [
      { id: 1, question: 'La Primera Ley de Newton también se llama:', options: [{ key: 'a', text: 'Ley de la inercia' }, { key: 'b', text: 'Ley de la fuerza' }, { key: 'c', text: 'Ley de acción-reacción' }, { key: 'd', text: 'Ley de la gravedad' }], answers: ['a'] },
      { id: 2, question: 'F = m·a corresponde a:', options: [{ key: 'a', text: 'Primera Ley' }, { key: 'b', text: 'Segunda Ley' }, { key: 'c', text: 'Tercera Ley' }, { key: 'd', text: 'Ley de la gravitación' }], answers: ['b'] },
      { id: 3, question: 'Si duplicamos la masa y mantenemos la fuerza, la aceleración:', options: [{ key: 'a', text: 'Se duplica' }, { key: 'b', text: 'Se reduce a la mitad' }, { key: 'c', text: 'Se cuadruplica' }, { key: 'd', text: 'No cambia' }], answers: ['b'] },
      { id: 4, question: 'La Tercera Ley establece que:', options: [{ key: 'a', text: 'Todo cuerpo permanece en reposo' }, { key: 'b', text: 'F = m·a' }, { key: 'c', text: 'A toda acción hay una reacción igual y opuesta' }, { key: 'd', text: 'La velocidad es constante' }], answers: ['c'] },
      { id: 5, question: 'El peso de un objeto es:', options: [{ key: 'a', text: 'Su masa' }, { key: 'b', text: 'La fuerza gravitatoria sobre él' }, { key: 'c', text: 'Su volumen' }, { key: 'd', text: 'Su densidad' }], answers: ['b'] },
      { id: 6, question: 'Un objeto de 5 kg sobre el que actúa F = 20 N tiene aceleración:', options: [{ key: 'a', text: '2 m/s²' }, { key: 'b', text: '4 m/s²' }, { key: 'c', text: '10 m/s²' }, { key: 'd', text: '25 m/s²' }], answers: ['b'] },
      { id: 7, question: 'La fuerza normal es:', options: [{ key: 'a', text: 'Siempre vertical' }, { key: 'b', text: 'Perpendicular a la superficie de contacto' }, { key: 'c', text: 'Igual al peso' }, { key: 'd', text: 'Una fuerza de rozamiento' }], answers: ['b'] },
      { id: 8, question: 'En ausencia de fuerzas externas, un objeto:', options: [{ key: 'a', text: 'Se detiene' }, { key: 'b', text: 'Mantiene su velocidad constante' }, { key: 'c', text: 'Acelera' }, { key: 'd', text: 'Cae' }], answers: ['b'] },
      { id: 9, question: 'La fuerza de rozamiento:', options: [{ key: 'a', text: 'Facilita el movimiento' }, { key: 'b', text: 'Se opone al movimiento' }, { key: 'c', text: 'Es perpendicular al movimiento' }, { key: 'd', text: 'Es igual a la normal' }], answers: ['b'] },
      { id: 10, question: 'El peso de un objeto de 10 kg en la Tierra (g = 10 m/s²) es:', options: [{ key: 'a', text: '1 N' }, { key: 'b', text: '10 N' }, { key: 'c', text: '20 N' }, { key: 'd', text: '100 N' }], answers: ['d'] }
    ]
  },
  {
    name: 'Energía y Trabajo',
    questions: [
      { id: 1, question: 'El trabajo se mide en:', options: [{ key: 'a', text: 'Newtons' }, { key: 'b', text: 'Julios' }, { key: 'c', text: 'Watts' }, { key: 'd', text: 'Metros' }], answers: ['b'] },
      { id: 2, question: 'La energía cinética depende de:', options: [{ key: 'a', text: 'La masa' }, { key: 'b', text: 'La velocidad' }, { key: 'c', text: 'La masa y la velocidad' }, { key: 'd', text: 'Solo la altura' }], answers: ['c'] },
      { id: 3, question: 'La fórmula de la energía cinética es:', options: [{ key: 'a', text: 'E = m·g·h' }, { key: 'b', text: 'E = ½·m·v²' }, { key: 'c', text: 'E = F·d' }, { key: 'd', text: 'E = m·a' }], answers: ['b'] },
      { id: 4, question: 'La energía potencial gravitatoria es:', options: [{ key: 'a', text: 'E = ½·m·v²' }, { key: 'b', text: 'E = m·g·h' }, { key: 'c', text: 'E = F·d' }, { key: 'd', text: 'E = P·t' }], answers: ['b'] },
      { id: 5, question: 'El principio de conservación de la energía establece que:', options: [{ key: 'a', text: 'La energía se crea' }, { key: 'b', text: 'La energía se destruye' }, { key: 'c', text: 'La energía ni se crea ni se destruye, solo se transforma' }, { key: 'd', text: 'La energía es infinita' }], answers: ['c'] },
      { id: 6, question: 'El trabajo realizado por una fuerza perpendicular al desplazamiento es:', options: [{ key: 'a', text: 'Máximo' }, { key: 'b', text: 'Mínimo' }, { key: 'c', text: 'Cero' }, { key: 'd', text: 'Negativo' }], answers: ['c'] },
      { id: 7, question: 'La potencia es:', options: [{ key: 'a', text: 'Trabajo por unidad de tiempo' }, { key: 'b', text: 'Fuerza por desplazamiento' }, { key: 'c', text: 'Masa por aceleración' }, { key: 'd', text: 'Energía total' }], answers: ['a'] },
      { id: 8, question: 'Un objeto de 2 kg cae desde 5 m. Su energía potencial inicial es (g=10 m/s²):', options: [{ key: 'a', text: '10 J' }, { key: 'b', text: '50 J' }, { key: 'c', text: '100 J' }, { key: 'd', text: '200 J' }], answers: ['c'] },
      { id: 9, question: 'Si un objeto duplica su velocidad, su energía cinética:', options: [{ key: 'a', text: 'Se duplica' }, { key: 'b', text: 'Se triplica' }, { key: 'c', text: 'Se cuadruplica' }, { key: 'd', text: 'Permanece igual' }], answers: ['c'] },
      { id: 10, question: 'La unidad de potencia en el SI es:', options: [{ key: 'a', text: 'Julio' }, { key: 'b', text: 'Newton' }, { key: 'c', text: 'Watt' }, { key: 'd', text: 'Voltio' }], answers: ['c'] }
    ]
  }
];

function createBankFiles() {
  console.log('📝 Creando tests de Física - Bachillerato...\n');
  
  const subjectSlug = 'fisica-bach';
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
