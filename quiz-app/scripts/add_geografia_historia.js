/**
 * Script para añadir contenido de Geografía e Historia ESO
 */

const fs = require('fs');
const path = require('path');

const questionBanks = [
  {
    name: 'Geografía Física: Relieve y Clima',
    questions: [
      { id: 1, question: '¿Cuál es el río más largo de España?', options: [{ key: 'a', text: 'Ebro' }, { key: 'b', text: 'Tajo' }, { key: 'c', text: 'Duero' }, { key: 'd', text: 'Guadalquivir' }], answers: ['b'] },
      { id: 2, question: 'Los Pirineos separan España de:', options: [{ key: 'a', text: 'Portugal' }, { key: 'b', text: 'Francia' }, { key: 'c', text: 'Andorra' }, { key: 'd', text: 'Marruecos' }], answers: ['b'] },
      { id: 3, question: '¿Qué tipo de clima predomina en Galicia?', options: [{ key: 'a', text: 'Mediterráneo' }, { key: 'b', text: 'Continental' }, { key: 'c', text: 'Oceánico' }, { key: 'd', text: 'Subtropical' }], answers: ['c'] },
      { id: 4, question: 'El pico más alto de España es:', options: [{ key: 'a', text: 'Aneto' }, { key: 'b', text: 'Mulhacén' }, { key: 'c', text: 'Teide' }, { key: 'd', text: 'Veleta' }], answers: ['c'] },
      { id: 5, question: '¿Qué mar baña la costa este de España?', options: [{ key: 'a', text: 'Mar Cantábrico' }, { key: 'b', text: 'Océano Atlántico' }, { key: 'c', text: 'Mar Mediterráneo' }, { key: 'd', text: 'Mar de Alborán' }], answers: ['c'] },
      { id: 6, question: 'La Meseta Central es:', options: [{ key: 'a', text: 'Una cordillera' }, { key: 'b', text: 'Una llanura elevada' }, { key: 'c', text: 'Un valle' }, { key: 'd', text: 'Una depresión' }], answers: ['b'] },
      { id: 7, question: '¿Qué comunidad autónoma tiene clima subtropical?', options: [{ key: 'a', text: 'Cataluña' }, { key: 'b', text: 'Galicia' }, { key: 'c', text: 'Canarias' }, { key: 'd', text: 'Andalucía' }], answers: ['c'] },
      { id: 8, question: 'El Sistema Central atraviesa:', options: [{ key: 'a', text: 'Andalucía' }, { key: 'b', text: 'La Meseta' }, { key: 'c', text: 'Cataluña' }, { key: 'd', text: 'Galicia' }], answers: ['b'] },
      { id: 9, question: '¿Cuál es la depresión más importante de España?', options: [{ key: 'a', text: 'Del Ebro' }, { key: 'b', text: 'Del Duero' }, { key: 'c', text: 'Del Tajo' }, { key: 'd', text: 'Del Júcar' }], answers: ['a'] },
      { id: 10, question: 'Las Islas Baleares están en el:', options: [{ key: 'a', text: 'Océano Atlántico' }, { key: 'b', text: 'Mar Cantábrico' }, { key: 'c', text: 'Mar Mediterráneo' }, { key: 'd', text: 'Estrecho de Gibraltar' }], answers: ['c'] }
    ]
  },
  {
    name: 'Historia Antigua: Grecia y Roma',
    questions: [
      { id: 1, question: 'La democracia nació en:', options: [{ key: 'a', text: 'Roma' }, { key: 'b', text: 'Atenas' }, { key: 'c', text: 'Esparta' }, { key: 'd', text: 'Creta' }], answers: ['b'] },
      { id: 2, question: '¿Quién fue el primer emperador romano?', options: [{ key: 'a', text: 'Julio César' }, { key: 'b', text: 'Augusto' }, { key: 'c', text: 'Nerón' }, { key: 'd', text: 'Trajano' }], answers: ['b'] },
      { id: 3, question: 'Los Juegos Olímpicos se celebraban en honor a:', options: [{ key: 'a', text: 'Ares' }, { key: 'b', text: 'Apolo' }, { key: 'c', text: 'Zeus' }, { key: 'd', text: 'Poseidón' }], answers: ['c'] },
      { id: 4, question: 'La civilización romana surgió en:', options: [{ key: 'a', text: 'Grecia' }, { key: 'b', text: 'Italia' }, { key: 'c', text: 'España' }, { key: 'd', text: 'Francia' }], answers: ['b'] },
      { id: 5, question: 'Alejandro Magno fue rey de:', options: [{ key: 'a', text: 'Esparta' }, { key: 'b', text: 'Atenas' }, { key: 'c', text: 'Macedonia' }, { key: 'd', text: 'Persia' }], answers: ['c'] },
      { id: 6, question: 'El Senado era la institución principal de:', options: [{ key: 'a', text: 'La República Romana' }, { key: 'b', text: 'Atenas democrática' }, { key: 'c', text: 'Esparta' }, { key: 'd', text: 'El Imperio Persa' }], answers: ['a'] },
      { id: 7, question: '¿En qué año cayó el Imperio Romano de Occidente?', options: [{ key: 'a', text: '395 d.C.' }, { key: 'b', text: '410 d.C.' }, { key: 'c', text: '476 d.C.' }, { key: 'd', text: '500 d.C.' }], answers: ['c'] },
      { id: 8, question: 'La Guerra del Peloponeso enfrentó a:', options: [{ key: 'a', text: 'Atenas y Esparta' }, { key: 'b', text: 'Roma y Cartago' }, { key: 'c', text: 'Grecia y Persia' }, { key: 'd', text: 'Macedonia y Persia' }], answers: ['a'] },
      { id: 9, question: 'Hispania fue conquistada por:', options: [{ key: 'a', text: 'Los griegos' }, { key: 'b', text: 'Los romanos' }, { key: 'c', text: 'Los cartagineses' }, { key: 'd', text: 'Los visigodos' }], answers: ['b'] },
      { id: 10, question: 'El Coliseo romano se construyó para:', options: [{ key: 'a', text: 'Ceremonias religiosas' }, { key: 'b', text: 'Espectáculos públicos' }, { key: 'c', text: 'Reuniones del Senado' }, { key: 'd', text: 'Residencia imperial' }], answers: ['b'] }
    ]
  },
  {
    name: 'Edad Media: Feudalismo y Al-Ándalus',
    questions: [
      { id: 1, question: 'El feudalismo se caracteriza por:', options: [{ key: 'a', text: 'La democracia' }, { key: 'b', text: 'Las relaciones de vasallaje' }, { key: 'c', text: 'El capitalismo' }, { key: 'd', text: 'La industrialización' }], answers: ['b'] },
      { id: 2, question: 'Los musulmanes entraron en la Península Ibérica en:', options: [{ key: 'a', text: '711' }, { key: 'b', text: '1492' }, { key: 'c', text: '800' }, { key: 'd', text: '1000' }], answers: ['a'] },
      { id: 3, question: 'La capital del Califato de Córdoba fue:', options: [{ key: 'a', text: 'Toledo' }, { key: 'b', text: 'Sevilla' }, { key: 'c', text: 'Córdoba' }, { key: 'd', text: 'Granada' }], answers: ['c'] },
      { id: 4, question: 'La Reconquista finalizó en:', options: [{ key: 'a', text: '1212' }, { key: 'b', text: '1492' }, { key: 'c', text: '1500' }, { key: 'd', text: '1469' }], answers: ['b'] },
      { id: 5, question: '¿Qué reino cristiano fue el más extenso?', options: [{ key: 'a', text: 'Navarra' }, { key: 'b', text: 'Aragón' }, { key: 'c', text: 'Castilla' }, { key: 'd', text: 'León' }], answers: ['c'] },
      { id: 6, question: 'Los siervos trabajaban en:', options: [{ key: 'a', text: 'Las ciudades' }, { key: 'b', text: 'Los castillos' }, { key: 'c', text: 'Las tierras del señor feudal' }, { key: 'd', text: 'Los monasterios' }], answers: ['c'] },
      { id: 7, question: 'La Alhambra de Granada fue construida por:', options: [{ key: 'a', text: 'Los visigodos' }, { key: 'b', text: 'Los romanos' }, { key: 'c', text: 'Los musulmanes' }, { key: 'd', text: 'Los cristianos' }], answers: ['c'] },
      { id: 8, question: 'Las Cruzadas fueron guerras:', options: [{ key: 'a', text: 'Entre musulmanes' }, { key: 'b', text: 'Religiosas cristianas' }, { key: 'c', text: 'Civiles' }, { key: 'd', text: 'Comerciales' }], answers: ['b'] },
      { id: 9, question: 'El Camino de Santiago se popularizó en:', options: [{ key: 'a', text: 'La Edad Antigua' }, { key: 'b', text: 'La Edad Media' }, { key: 'c', text: 'La Edad Moderna' }, { key: 'd', text: 'La Edad Contemporánea' }], answers: ['b'] },
      { id: 10, question: 'Los Reyes Católicos fueron:', options: [{ key: 'a', text: 'Carlos I y Juana' }, { key: 'b', text: 'Fernando e Isabel' }, { key: 'c', text: 'Felipe II y María' }, { key: 'd', text: 'Alfonso X y Beatriz' }], answers: ['b'] }
    ]
  }
];

function createBankFiles() {
  console.log('📝 Creando tests de Geografía e Historia ESO...\n');
  
  const subjectSlug = 'geografia-historia-eso';
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
