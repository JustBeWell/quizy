/**
 * Script para añadir contenido de Biología - Bachillerato
 */

const fs = require('fs');
const path = require('path');

const questionBanks = [
  {
    name: 'Genética y Herencia',
    questions: [
      { id: 1, question: 'El ADN está formado por:', options: [{ key: 'a', text: 'Aminoácidos' }, { key: 'b', text: 'Nucleótidos' }, { key: 'c', text: 'Lípidos' }, { key: 'd', text: 'Glúcidos' }], answers: ['b'] },
      { id: 2, question: 'Las leyes de la herencia fueron descubiertas por:', options: [{ key: 'a', text: 'Darwin' }, { key: 'b', text: 'Mendel' }, { key: 'c', text: 'Watson' }, { key: 'd', text: 'Lamarck' }], answers: ['b'] },
      { id: 3, question: 'Un alelo dominante se representa con:', options: [{ key: 'a', text: 'Letra minúscula' }, { key: 'b', text: 'Letra mayúscula' }, { key: 'c', text: 'Números' }, { key: 'd', text: 'Símbolos' }], answers: ['b'] },
      { id: 4, question: 'El genotipo Aa es:', options: [{ key: 'a', text: 'Homocigoto dominante' }, { key: 'b', text: 'Homocigoto recesivo' }, { key: 'c', text: 'Heterocigoto' }, { key: 'd', text: 'Mutante' }], answers: ['c'] },
      { id: 5, question: 'El código genético está formado por:', options: [{ key: 'a', text: 'Dupletes' }, { key: 'b', text: 'Tripletes (codones)' }, { key: 'c', text: 'Cuatripletes' }, { key: 'd', text: 'Quintupletes' }], answers: ['b'] },
      { id: 6, question: 'La transcripción es el proceso de:', options: [{ key: 'a', text: 'ADN → ARN' }, { key: 'b', text: 'ARN → Proteína' }, { key: 'c', text: 'ADN → ADN' }, { key: 'd', text: 'Proteína → ARN' }], answers: ['a'] },
      { id: 7, question: 'La traducción ocurre en:', options: [{ key: 'a', text: 'El núcleo' }, { key: 'b', text: 'Los ribosomas' }, { key: 'c', text: 'Las mitocondrias' }, { key: 'd', text: 'El retículo' }], answers: ['b'] },
      { id: 8, question: 'Una mutación es:', options: [{ key: 'a', text: 'Un cambio en el ADN' }, { key: 'b', text: 'Una división celular' }, { key: 'c', text: 'Un tipo de reproducción' }, { key: 'd', text: 'Una enfermedad' }], answers: ['a'] },
      { id: 9, question: 'Los cromosomas homólogos:', options: [{ key: 'a', text: 'Son idénticos' }, { key: 'b', text: 'Contienen genes para los mismos caracteres' }, { key: 'c', text: 'Solo existen en bacterias' }, { key: 'd', text: 'No existen' }], answers: ['b'] },
      { id: 10, question: 'El cariotipo humano tiene:', options: [{ key: 'a', text: '23 cromosomas' }, { key: 'b', text: '46 cromosomas' }, { key: 'c', text: '48 cromosomas' }, { key: 'd', text: '92 cromosomas' }], answers: ['b'] }
    ]
  },
  {
    name: 'Evolución y Biodiversidad',
    questions: [
      { id: 1, question: 'La teoría de la evolución por selección natural fue propuesta por:', options: [{ key: 'a', text: 'Mendel' }, { key: 'b', text: 'Lamarck' }, { key: 'c', text: 'Darwin' }, { key: 'd', text: 'Watson' }], answers: ['c'] },
      { id: 2, question: 'La selección natural favorece:', options: [{ key: 'a', text: 'A los más grandes' }, { key: 'b', text: 'A los mejor adaptados' }, { key: 'c', text: 'A los más fuertes' }, { key: 'd', text: 'A todos por igual' }], answers: ['b'] },
      { id: 3, question: 'Las pruebas anatómicas de la evolución incluyen:', options: [{ key: 'a', text: 'Órganos homólogos' }, { key: 'b', text: 'Solo fósiles' }, { key: 'c', text: 'Solo ADN' }, { key: 'd', text: 'Ninguna prueba' }], answers: ['a'] },
      { id: 4, question: 'Un fósil es:', options: [{ key: 'a', text: 'Un organismo vivo' }, { key: 'b', text: 'Restos o huellas de organismos antiguos' }, { key: 'c', text: 'Una roca' }, { key: 'd', text: 'Un mineral' }], answers: ['b'] },
      { id: 5, question: 'La especiación es:', options: [{ key: 'a', text: 'La extinción de especies' }, { key: 'b', text: 'La formación de nuevas especies' }, { key: 'c', text: 'La migración' }, { key: 'd', text: 'La hibernación' }], answers: ['b'] },
      { id: 6, question: 'Los cinco reinos son:', options: [{ key: 'a', text: 'Monera, Protista, Fungi, Plantae, Animalia' }, { key: 'b', text: 'Solo Plantae y Animalia' }, { key: 'c', text: 'Bacteria, Archaea, Eukarya' }, { key: 'd', text: 'Vertebrados e invertebrados' }], answers: ['a'] },
      { id: 7, question: 'Las bacterias pertenecen al reino:', options: [{ key: 'a', text: 'Protista' }, { key: 'b', text: 'Monera' }, { key: 'c', text: 'Fungi' }, { key: 'd', text: 'Plantae' }], answers: ['b'] },
      { id: 8, question: 'La biodiversidad se refiere a:', options: [{ key: 'a', text: 'Solo plantas' }, { key: 'b', text: 'Solo animales' }, { key: 'c', text: 'La variedad de seres vivos' }, { key: 'd', text: 'Solo bacterias' }], answers: ['c'] },
      { id: 9, question: 'Un ecosistema incluye:', options: [{ key: 'a', text: 'Solo seres vivos' }, { key: 'b', text: 'Solo factores físicos' }, { key: 'c', text: 'Seres vivos y su medio ambiente' }, { key: 'd', text: 'Solo plantas' }], answers: ['c'] },
      { id: 10, question: 'La adaptación es:', options: [{ key: 'a', text: 'Un proceso rápido' }, { key: 'b', text: 'Una característica que aumenta la supervivencia' }, { key: 'c', text: 'Una enfermedad' }, { key: 'd', text: 'Imposible' }], answers: ['b'] }
    ]
  },
  {
    name: 'Bioquímica y Metabolismo',
    questions: [
      { id: 1, question: 'Las enzimas son:', options: [{ key: 'a', text: 'Lípidos' }, { key: 'b', text: 'Proteínas catalizadoras' }, { key: 'c', text: 'Carbohidratos' }, { key: 'd', text: 'Ácidos nucleicos' }], answers: ['b'] },
      { id: 2, question: 'El ATP es:', options: [{ key: 'a', text: 'Una proteína' }, { key: 'b', text: 'La moneda energética de la célula' }, { key: 'c', text: 'Un lípido' }, { key: 'd', text: 'Un tipo de ADN' }], answers: ['b'] },
      { id: 3, question: 'La glucólisis ocurre en:', options: [{ key: 'a', text: 'El núcleo' }, { key: 'b', text: 'Las mitocondrias' }, { key: 'c', text: 'El citoplasma' }, { key: 'd', text: 'Los cloroplastos' }], answers: ['c'] },
      { id: 4, question: 'La fotosíntesis produce:', options: [{ key: 'a', text: 'CO₂ y H₂O' }, { key: 'b', text: 'Glucosa y O₂' }, { key: 'c', text: 'Solo ATP' }, { key: 'd', text: 'Proteínas' }], answers: ['b'] },
      { id: 5, question: 'La respiración celular ocurre en:', options: [{ key: 'a', text: 'El núcleo' }, { key: 'b', text: 'Los cloroplastos' }, { key: 'c', text: 'Las mitocondrias' }, { key: 'd', text: 'Los ribosomas' }], answers: ['c'] },
      { id: 6, question: 'Los lípidos son:', options: [{ key: 'a', text: 'Hidrofílicos' }, { key: 'b', text: 'Hidrofóbicos' }, { key: 'c', text: 'Proteínas' }, { key: 'd', text: 'Ácidos nucleicos' }], answers: ['b'] },
      { id: 7, question: 'Los aminoácidos son los monómeros de:', options: [{ key: 'a', text: 'Carbohidratos' }, { key: 'b', text: 'Lípidos' }, { key: 'c', text: 'Proteínas' }, { key: 'd', text: 'Ácidos nucleicos' }], answers: ['c'] },
      { id: 8, question: 'El ciclo de Krebs ocurre en:', options: [{ key: 'a', text: 'El citoplasma' }, { key: 'b', text: 'La matriz mitocondrial' }, { key: 'c', text: 'El núcleo' }, { key: 'd', text: 'Los ribosomas' }], answers: ['b'] },
      { id: 9, question: 'La fermentación es un proceso:', options: [{ key: 'a', text: 'Aeróbico' }, { key: 'b', text: 'Anaeróbico' }, { key: 'c', text: 'Fotosintético' }, { key: 'd', text: 'Nuclear' }], answers: ['b'] },
      { id: 10, question: 'Los carbohidratos se descomponen en:', options: [{ key: 'a', text: 'Aminoácidos' }, { key: 'b', text: 'Ácidos grasos' }, { key: 'c', text: 'Monosacáridos' }, { key: 'd', text: 'Nucleótidos' }], answers: ['c'] }
    ]
  }
];

function createBankFiles() {
  console.log('📝 Creando tests de Biología - Bachillerato...\n');
  
  const subjectSlug = 'biologia-bach';
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
