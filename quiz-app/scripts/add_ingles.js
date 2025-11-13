/**
 * Script para añadir contenido de Inglés ESO
 */

const fs = require('fs');
const path = require('path');

const questionBanks = [
  {
    name: 'Grammar: Present Tenses',
    questions: [
      { id: 1, question: 'Choose the correct form: She ___ to school every day.', options: [{ key: 'a', text: 'go' }, { key: 'b', text: 'goes' }, { key: 'c', text: 'going' }, { key: 'd', text: 'gone' }], answers: ['b'] },
      { id: 2, question: 'What is happening now? They ___ football.', options: [{ key: 'a', text: 'play' }, { key: 'b', text: 'plays' }, { key: 'c', text: 'are playing' }, { key: 'd', text: 'played' }], answers: ['c'] },
      { id: 3, question: 'Complete: I ___ English since 2020.', options: [{ key: 'a', text: 'study' }, { key: 'b', text: 'am studying' }, { key: 'c', text: 'have studied' }, { key: 'd', text: 'studied' }], answers: ['c'] },
      { id: 4, question: 'She ___ her homework right now.', options: [{ key: 'a', text: 'does' }, { key: 'b', text: 'is doing' }, { key: 'c', text: 'do' }, { key: 'd', text: 'has done' }], answers: ['b'] },
      { id: 5, question: 'We usually ___ breakfast at 8 am.', options: [{ key: 'a', text: 'have' }, { key: 'b', text: 'has' }, { key: 'c', text: 'are having' }, { key: 'd', text: 'had' }], answers: ['a'] },
      { id: 6, question: 'How long ___ here?', options: [{ key: 'a', text: 'do you live' }, { key: 'b', text: 'are you living' }, { key: 'c', text: 'have you lived' }, { key: 'd', text: 'did you live' }], answers: ['c'] },
      { id: 7, question: 'Look! The sun ___.', options: [{ key: 'a', text: 'shines' }, { key: 'b', text: 'is shining' }, { key: 'c', text: 'shine' }, { key: 'd', text: 'has shined' }], answers: ['b'] },
      { id: 8, question: 'He ___ three languages fluently.', options: [{ key: 'a', text: 'speak' }, { key: 'b', text: 'speaks' }, { key: 'c', text: 'is speaking' }, { key: 'd', text: 'has spoken' }], answers: ['b'] },
      { id: 9, question: 'I ___ my keys! I can\'t find them.', options: [{ key: 'a', text: 'lose' }, { key: 'b', text: 'am losing' }, { key: 'c', text: 'have lost' }, { key: 'd', text: 'lost' }], answers: ['c'] },
      { id: 10, question: 'Water ___ at 100 degrees Celsius.', options: [{ key: 'a', text: 'boil' }, { key: 'b', text: 'boils' }, { key: 'c', text: 'is boiling' }, { key: 'd', text: 'has boiled' }], answers: ['b'] }
    ]
  },
  {
    name: 'Grammar: Past Tenses',
    questions: [
      { id: 1, question: 'Yesterday, I ___ to the cinema.', options: [{ key: 'a', text: 'go' }, { key: 'b', text: 'goes' }, { key: 'c', text: 'went' }, { key: 'd', text: 'have gone' }], answers: ['c'] },
      { id: 2, question: 'When I arrived, they ___ dinner.', options: [{ key: 'a', text: 'had' }, { key: 'b', text: 'were having' }, { key: 'c', text: 'have' }, { key: 'd', text: 'are having' }], answers: ['b'] },
      { id: 3, question: 'She ___ the book before the movie came out.', options: [{ key: 'a', text: 'read' }, { key: 'b', text: 'was reading' }, { key: 'c', text: 'has read' }, { key: 'd', text: 'had read' }], answers: ['d'] },
      { id: 4, question: 'Last week, we ___ to Paris.', options: [{ key: 'a', text: 'travel' }, { key: 'b', text: 'travelled' }, { key: 'c', text: 'have travelled' }, { key: 'd', text: 'had travelled' }], answers: ['b'] },
      { id: 5, question: 'While I ___, the phone rang.', options: [{ key: 'a', text: 'study' }, { key: 'b', text: 'studied' }, { key: 'c', text: 'was studying' }, { key: 'd', text: 'have studied' }], answers: ['c'] },
      { id: 6, question: 'They ___ in London for five years before moving.', options: [{ key: 'a', text: 'lived' }, { key: 'b', text: 'were living' }, { key: 'c', text: 'have lived' }, { key: 'd', text: 'had lived' }], answers: ['d'] },
      { id: 7, question: 'Did you ___ your homework?', options: [{ key: 'a', text: 'finish' }, { key: 'b', text: 'finished' }, { key: 'c', text: 'finishing' }, { key: 'd', text: 'finishes' }], answers: ['a'] },
      { id: 8, question: 'He ___ when I called him.', options: [{ key: 'a', text: 'sleeps' }, { key: 'b', text: 'slept' }, { key: 'c', text: 'was sleeping' }, { key: 'd', text: 'has slept' }], answers: ['c'] },
      { id: 9, question: 'I ___ never ___ sushi before that day.', options: [{ key: 'a', text: 'have - eaten' }, { key: 'b', text: 'had - eaten' }, { key: 'c', text: 'was - eating' }, { key: 'd', text: 'did - eat' }], answers: ['b'] },
      { id: 10, question: 'The train ___ when we arrived at the station.', options: [{ key: 'a', text: 'left' }, { key: 'b', text: 'was leaving' }, { key: 'c', text: 'has left' }, { key: 'd', text: 'had left' }], answers: ['d'] }
    ]
  },
  {
    name: 'Vocabulary: Daily Life and Family',
    questions: [
      { id: 1, question: 'My mother\'s sister is my ___.', options: [{ key: 'a', text: 'cousin' }, { key: 'b', text: 'aunt' }, { key: 'c', text: 'niece' }, { key: 'd', text: 'sister' }], answers: ['b'] },
      { id: 2, question: 'What do you call your father\'s father?', options: [{ key: 'a', text: 'uncle' }, { key: 'b', text: 'brother' }, { key: 'c', text: 'grandfather' }, { key: 'd', text: 'cousin' }], answers: ['c'] },
      { id: 3, question: 'I ___ my teeth every morning.', options: [{ key: 'a', text: 'wash' }, { key: 'b', text: 'brush' }, { key: 'c', text: 'clean' }, { key: 'd', text: 'make' }], answers: ['b'] },
      { id: 4, question: 'We usually ___ dinner at 8 pm.', options: [{ key: 'a', text: 'do' }, { key: 'b', text: 'make' }, { key: 'c', text: 'have' }, { key: 'd', text: 'take' }], answers: ['c'] },
      { id: 5, question: 'The opposite of "cheap" is:', options: [{ key: 'a', text: 'poor' }, { key: 'b', text: 'expensive' }, { key: 'c', text: 'rich' }, { key: 'd', text: 'big' }], answers: ['b'] },
      { id: 6, question: 'A place where you can buy medicine:', options: [{ key: 'a', text: 'bakery' }, { key: 'b', text: 'pharmacy' }, { key: 'c', text: 'library' }, { key: 'd', text: 'bank' }], answers: ['b'] },
      { id: 7, question: 'Your brother\'s daughter is your:', options: [{ key: 'a', text: 'niece' }, { key: 'b', text: 'nephew' }, { key: 'c', text: 'cousin' }, { key: 'd', text: 'sister' }], answers: ['a'] },
      { id: 8, question: 'What time do you usually ___ up?', options: [{ key: 'a', text: 'stand' }, { key: 'b', text: 'get' }, { key: 'c', text: 'make' }, { key: 'd', text: 'take' }], answers: ['b'] },
      { id: 9, question: 'I need to ___ my room before my parents arrive.', options: [{ key: 'a', text: 'do' }, { key: 'b', text: 'make' }, { key: 'c', text: 'clean' }, { key: 'd', text: 'wash' }], answers: ['c'] },
      { id: 10, question: 'The meal you have in the middle of the day:', options: [{ key: 'a', text: 'breakfast' }, { key: 'b', text: 'lunch' }, { key: 'c', text: 'dinner' }, { key: 'd', text: 'supper' }], answers: ['b'] }
    ]
  }
];

function createBankFiles() {
  console.log('📝 Creando tests de Inglés ESO...\n');
  
  const subjectSlug = 'ingles-eso';
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
