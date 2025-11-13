/**
 * Script para añadir contenido de Química - Bachillerato
 */

const fs = require('fs');
const path = require('path');

const questionBanks = [
  {
    name: 'Estructura Atómica y Tabla Periódica',
    questions: [
      { id: 1, question: 'El número atómico indica:', options: [{ key: 'a', text: 'Número de neutrones' }, { key: 'b', text: 'Número de protones' }, { key: 'c', text: 'Masa atómica' }, { key: 'd', text: 'Número de electrones libres' }], answers: ['b'] },
      { id: 2, question: 'Los elementos del mismo grupo tienen:', options: [{ key: 'a', text: 'Igual masa atómica' }, { key: 'b', text: 'Igual número de protones' }, { key: 'c', text: 'Igual configuración electrónica externa' }, { key: 'd', text: 'Igual número de neutrones' }], answers: ['c'] },
      { id: 3, question: 'Un isótopo tiene distinto número de:', options: [{ key: 'a', text: 'Protones' }, { key: 'b', text: 'Electrones' }, { key: 'c', text: 'Neutrones' }, { key: 'd', text: 'Átomos' }], answers: ['c'] },
      { id: 4, question: 'Los gases nobles se caracterizan por:', options: [{ key: 'a', text: 'Ser muy reactivos' }, { key: 'b', text: 'Tener capa externa completa' }, { key: 'c', text: 'Ser metales' }, { key: 'd', text: 'Formar enlaces iónicos' }], answers: ['b'] },
      { id: 5, question: 'El radio atómico aumenta:', options: [{ key: 'a', text: 'Hacia arriba y derecha' }, { key: 'b', text: 'Hacia abajo y izquierda' }, { key: 'c', text: 'Hacia arriba y izquierda' }, { key: 'd', text: 'Hacia abajo y derecha' }], answers: ['b'] },
      { id: 6, question: 'La electronegatividad es:', options: [{ key: 'a', text: 'La tendencia a ganar electrones' }, { key: 'b', text: 'La tendencia a perder electrones' }, { key: 'c', text: 'El número de electrones' }, { key: 'd', text: 'La masa del electrón' }], answers: ['a'] },
      { id: 7, question: 'El elemento más electronegativo es:', options: [{ key: 'a', text: 'Oxígeno' }, { key: 'b', text: 'Cloro' }, { key: 'c', text: 'Flúor' }, { key: 'd', text: 'Nitrógeno' }], answers: ['c'] },
      { id: 8, question: 'Los metales alcalinos están en el grupo:', options: [{ key: 'a', text: '1' }, { key: 'b', text: '2' }, { key: 'c', text: '17' }, { key: 'd', text: '18' }], answers: ['a'] },
      { id: 9, question: 'Un catión se forma cuando un átomo:', options: [{ key: 'a', text: 'Gana electrones' }, { key: 'b', text: 'Pierde electrones' }, { key: 'c', text: 'Gana protones' }, { key: 'd', text: 'Pierde neutrones' }], answers: ['b'] },
      { id: 10, question: 'Los halógenos están en el grupo:', options: [{ key: 'a', text: '1' }, { key: 'b', text: '2' }, { key: 'c', text: '17' }, { key: 'd', text: '18' }], answers: ['c'] }
    ]
  },
  {
    name: 'Enlaces Químicos',
    questions: [
      { id: 1, question: 'El enlace iónico se forma entre:', options: [{ key: 'a', text: 'Dos metales' }, { key: 'b', text: 'Dos no metales' }, { key: 'c', text: 'Un metal y un no metal' }, { key: 'd', text: 'Gases nobles' }], answers: ['c'] },
      { id: 2, question: 'El enlace covalente implica:', options: [{ key: 'a', text: 'Transferencia de electrones' }, { key: 'b', text: 'Compartir electrones' }, { key: 'c', text: 'Perder electrones' }, { key: 'd', text: 'Ganar protones' }], answers: ['b'] },
      { id: 3, question: 'NaCl es un ejemplo de enlace:', options: [{ key: 'a', text: 'Covalente' }, { key: 'b', text: 'Iónico' }, { key: 'c', text: 'Metálico' }, { key: 'd', text: 'De hidrógeno' }], answers: ['b'] },
      { id: 4, question: 'El H₂O forma enlaces:', options: [{ key: 'a', text: 'Iónicos' }, { key: 'b', text: 'Metálicos' }, { key: 'c', text: 'Covalentes polares' }, { key: 'd', text: 'Covalentes apolares' }], answers: ['c'] },
      { id: 5, question: 'Los enlaces de hidrógeno se dan en:', options: [{ key: 'a', text: 'Moléculas con H unido a O, N o F' }, { key: 'b', text: 'Todos los compuestos' }, { key: 'c', text: 'Solo en gases' }, { key: 'd', text: 'Metales' }], answers: ['a'] },
      { id: 6, question: 'La molécula de O₂ tiene enlace:', options: [{ key: 'a', text: 'Simple' }, { key: 'b', text: 'Doble' }, { key: 'c', text: 'Triple' }, { key: 'd', text: 'Iónico' }], answers: ['b'] },
      { id: 7, question: 'El enlace metálico se caracteriza por:', options: [{ key: 'a', text: 'Electrones localizados' }, { key: 'b', text: 'Electrones des localizados' }, { key: 'c', text: 'Ausencia de electrones' }, { key: 'd', text: 'Transferencia completa' }], answers: ['b'] },
      { id: 8, question: 'Un enlace covalente apolar se da entre:', options: [{ key: 'a', text: 'Átomos muy distintos' }, { key: 'b', text: 'Átomos iguales o similar electronegatividad' }, { key: 'c', text: 'Metal y no metal' }, { key: 'd', text: 'Gases nobles' }], answers: ['b'] },
      { id: 9, question: 'La molécula de N₂ tiene enlace:', options: [{ key: 'a', text: 'Simple' }, { key: 'b', text: 'Doble' }, { key: 'c', text: 'Triple' }, { key: 'd', text: 'Iónico' }], answers: ['c'] },
      { id: 10, question: 'El CO₂ es una molécula:', options: [{ key: 'a', text: 'Lineal' }, { key: 'b', text: 'Angular' }, { key: 'c', text: 'Tetraédrica' }, { key: 'd', text: 'Trigonal' }], answers: ['a'] }
    ]
  },
  {
    name: 'Reacciones Químicas y Estequiometría',
    questions: [
      { id: 1, question: 'En una reacción química, la masa:', options: [{ key: 'a', text: 'Se crea' }, { key: 'b', text: 'Se destruye' }, { key: 'c', text: 'Se conserva' }, { key: 'd', text: 'Aumenta siempre' }], answers: ['c'] },
      { id: 2, question: 'Un mol contiene:', options: [{ key: 'a', text: '6.02 × 10²³ partículas' }, { key: 'b', text: '1000 partículas' }, { key: 'c', text: '100 partículas' }, { key: 'd', text: '12 partículas' }], answers: ['a'] },
      { id: 3, question: 'La masa molar del agua (H₂O) es aproximadamente:', options: [{ key: 'a', text: '2 g/mol' }, { key: 'b', text: '16 g/mol' }, { key: 'c', text: '18 g/mol' }, { key: 'd', text: '20 g/mol' }], answers: ['c'] },
      { id: 4, question: 'Una reacción exotérmica:', options: [{ key: 'a', text: 'Absorbe calor' }, { key: 'b', text: 'Libera calor' }, { key: 'c', text: 'No intercambia calor' }, { key: 'd', text: 'Solo ocurre en frío' }], answers: ['b'] },
      { id: 5, question: 'En la ecuación 2H₂ + O₂ → 2H₂O, el coeficiente estequiométrico del H₂ es:', options: [{ key: 'a', text: '1' }, { key: 'b', text: '2' }, { key: 'c', text: '3' }, { key: 'd', text: '4' }], answers: ['b'] },
      { id: 6, question: 'Un catalizador:', options: [{ key: 'a', text: 'Se consume en la reacción' }, { key: 'b', text: 'Acelera la reacción sin consumirse' }, { key: 'c', text: 'Frena la reacción' }, { key: 'd', text: 'Cambia los productos' }], answers: ['b'] },
      { id: 7, question: 'La velocidad de reacción aumenta con:', options: [{ key: 'a', text: 'Temperatura' }, { key: 'b', text: 'Concentración' }, { key: 'c', text: 'Catalizadores' }, { key: 'd', text: 'Todas las anteriores' }], answers: ['d'] },
      { id: 8, question: 'El reactivo limitante es:', options: [{ key: 'a', text: 'El que sobra' }, { key: 'b', text: 'El que se consume primero' }, { key: 'c', text: 'El más caro' }, { key: 'd', text: 'El de menor masa' }], answers: ['b'] },
      { id: 9, question: 'Una reacción de combustión requiere:', options: [{ key: 'a', text: 'Agua' }, { key: 'b', text: 'Oxígeno' }, { key: 'c', text: 'Nitrógeno' }, { key: 'd', text: 'Helio' }], answers: ['b'] },
      { id: 10, question: 'El pH de una disolución neutra es:', options: [{ key: 'a', text: '0' }, { key: 'b', text: '7' }, { key: 'c', text: '14' }, { key: 'd', text: '10' }], answers: ['b'] }
    ]
  }
];

function createBankFiles() {
  console.log('📝 Creando tests de Química - Bachillerato...\n');
  
  const subjectSlug = 'quimica-bach';
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
