/**
 * Script para añadir contenido de Matemáticas II - Bachillerato
 */

const fs = require('fs');
const path = require('path');

const questionBanks = [
  {
    name: 'Cálculo Diferencial: Derivadas',
    questions: [
      { id: 1, question: 'La derivada de x² es:', options: [{ key: 'a', text: 'x' }, { key: 'b', text: '2x' }, { key: 'c', text: 'x²' }, { key: 'd', text: '2' }], answers: ['b'] },
      { id: 2, question: 'La derivada de una constante es:', options: [{ key: 'a', text: 'La constante' }, { key: 'b', text: '0' }, { key: 'c', text: '1' }, { key: 'd', text: 'Infinito' }], answers: ['b'] },
      { id: 3, question: 'La derivada de sen(x) es:', options: [{ key: 'a', text: 'cos(x)' }, { key: 'b', text: '-cos(x)' }, { key: 'c', text: '-sen(x)' }, { key: 'd', text: 'tan(x)' }], answers: ['a'] },
      { id: 4, question: 'La derivada de eˣ es:', options: [{ key: 'a', text: 'x·eˣ' }, { key: 'b', text: 'eˣ' }, { key: 'c', text: 'eˣ⁻¹' }, { key: 'd', text: 'ln(x)' }], answers: ['b'] },
      { id: 5, question: 'La derivada de ln(x) es:', options: [{ key: 'a', text: '1' }, { key: 'b', text: 'x' }, { key: 'c', text: '1/x' }, { key: 'd', text: 'ln(x-1)' }], answers: ['c'] },
      { id: 6, question: 'Si f(x) = x³, entonces f\'(2) es:', options: [{ key: 'a', text: '6' }, { key: 'b', text: '8' }, { key: 'c', text: '12' }, { key: 'd', text: '3' }], answers: ['c'] },
      { id: 7, question: 'La regla de la cadena se usa para derivar:', options: [{ key: 'a', text: 'Funciones simples' }, { key: 'b', text: 'Funciones compuestas' }, { key: 'c', text: 'Constantes' }, { key: 'd', text: 'Polinomios' }], answers: ['b'] },
      { id: 8, question: 'La derivada de cos(x) es:', options: [{ key: 'a', text: 'sen(x)' }, { key: 'b', text: '-sen(x)' }, { key: 'c', text: '-cos(x)' }, { key: 'd', text: 'tan(x)' }], answers: ['b'] },
      { id: 9, question: 'Un máximo relativo se da cuando:', options: [{ key: 'a', text: 'f\'(x) = 0 y f\'\'(x) < 0' }, { key: 'b', text: 'f\'(x) = 0 y f\'\'(x) > 0' }, { key: 'c', text: 'f(x) = 0' }, { key: 'd', text: 'f\'\'(x) = 0' }], answers: ['a'] },
      { id: 10, question: 'La derivada de 3x⁴ es:', options: [{ key: 'a', text: '12x³' }, { key: 'b', text: '4x³' }, { key: 'c', text: '3x³' }, { key: 'd', text: '12x⁴' }], answers: ['a'] }
    ]
  },
  {
    name: 'Cálculo Integral',
    questions: [
      { id: 1, question: 'La integral de x dx es:', options: [{ key: 'a', text: 'x' }, { key: 'b', text: 'x²/2 + C' }, { key: 'c', text: 'x² + C' }, { key: 'd', text: '2x + C' }], answers: ['b'] },
      { id: 2, question: 'La integral de una constante k es:', options: [{ key: 'a', text: '0' }, { key: 'b', text: 'k' }, { key: 'c', text: 'kx + C' }, { key: 'd', text: 'k/x + C' }], answers: ['c'] },
      { id: 3, question: '∫ cos(x) dx es:', options: [{ key: 'a', text: 'sen(x) + C' }, { key: 'b', text: '-sen(x) + C' }, { key: 'c', text: 'cos(x) + C' }, { key: 'd', text: '-cos(x) + C' }], answers: ['a'] },
      { id: 4, question: '∫ eˣ dx es:', options: [{ key: 'a', text: 'eˣ⁺¹ + C' }, { key: 'b', text: 'eˣ + C' }, { key: 'c', text: 'xeˣ + C' }, { key: 'd', text: 'eˣ/x + C' }], answers: ['b'] },
      { id: 5, question: 'El Teorema Fundamental del Cálculo relaciona:', options: [{ key: 'a', text: 'Derivadas e integrales' }, { key: 'b', text: 'Límites y derivadas' }, { key: 'c', text: 'Solo integrales' }, { key: 'd', text: 'Solo derivadas' }], answers: ['a'] },
      { id: 6, question: '∫₀² 2x dx es:', options: [{ key: 'a', text: '2' }, { key: 'b', text: '4' }, { key: 'c', text: '6' }, { key: 'd', text: '8' }], answers: ['b'] },
      { id: 7, question: 'La integral definida representa:', options: [{ key: 'a', text: 'La pendiente' }, { key: 'b', text: 'El área bajo la curva' }, { key: 'c', text: 'El máximo' }, { key: 'd', text: 'El límite' }], answers: ['b'] },
      { id: 8, question: '∫ 1/x dx es:', options: [{ key: 'a', text: 'x² + C' }, { key: 'b', text: 'ln(x) + C' }, { key: 'c', text: '1/x² + C' }, { key: 'd', text: 'eˣ + C' }], answers: ['b'] },
      { id: 9, question: '∫ sen(x) dx es:', options: [{ key: 'a', text: 'cos(x) + C' }, { key: 'b', text: '-cos(x) + C' }, { key: 'c', text: 'sen(x) + C' }, { key: 'd', text: '-sen(x) + C' }], answers: ['b'] },
      { id: 10, question: 'La constante de integración C aparece en:', options: [{ key: 'a', text: 'Integrales definidas' }, { key: 'b', text: 'Integrales indefinidas' }, { key: 'c', text: 'Derivadas' }, { key: 'd', text: 'Límites' }], answers: ['b'] }
    ]
  },
  {
    name: 'Álgebra Lineal: Matrices y Determinantes',
    questions: [
      { id: 1, question: 'Una matriz 2×3 tiene:', options: [{ key: 'a', text: '2 filas y 3 columnas' }, { key: 'b', text: '3 filas y 2 columnas' }, { key: 'c', text: '5 elementos' }, { key: 'd', text: '6 filas' }], answers: ['a'] },
      { id: 2, question: 'El determinante de una matriz 2×2 [[a,b],[c,d]] es:', options: [{ key: 'a', text: 'a+d-b-c' }, { key: 'b', text: 'ad-bc' }, { key: 'c', text: 'ac-bd' }, { key: 'd', text: 'abcd' }], answers: ['b'] },
      { id: 3, question: 'Dos matrices se pueden multiplicar si:', options: [{ key: 'a', text: 'Tienen igual tamaño' }, { key: 'b', text: 'El número de columnas de la primera = filas de la segunda' }, { key: 'c', text: 'Son cuadradas' }, { key: 'd', text: 'Siempre se pueden multiplicar' }], answers: ['b'] },
      { id: 4, question: 'La matriz identidad cumple:', options: [{ key: 'a', text: 'A·I = A' }, { key: 'b', text: 'A·I = 0' }, { key: 'c', text: 'A·I = I' }, { key: 'd', text: 'No existe' }], answers: ['a'] },
      { id: 5, question: 'El rango de una matriz es:', options: [{ key: 'a', text: 'El número de filas' }, { key: 'b', text: 'El número de columnas' }, { key: 'c', text: 'El número de filas/columnas linealmente independientes' }, { key: 'd', text: 'El determinante' }], answers: ['c'] },
      { id: 6, question: 'Una matriz tiene inversa si:', options: [{ key: 'a', text: 'Es cuadrada' }, { key: 'b', text: 'Su determinante es distinto de cero' }, { key: 'c', text: 'Es simétrica' }, { key: 'd', text: 'Tiene rango 1' }], answers: ['b'] },
      { id: 7, question: 'La matriz traspuesta de A se denota:', options: [{ key: 'a', text: 'A⁻¹' }, { key: 'b', text: 'Aᵀ' }, { key: 'c', text: '|A|' }, { key: 'd', text: 'A²' }], answers: ['b'] },
      { id: 8, question: 'El determinante de una matriz triangular es:', options: [{ key: 'a', text: 'Cero' }, { key: 'b', text: 'Uno' }, { key: 'c', text: 'El producto de los elementos de la diagonal' }, { key: 'd', text: 'La suma de todos los elementos' }], answers: ['c'] },
      { id: 9, question: 'Si |A| = 0, la matriz es:', options: [{ key: 'a', text: 'Invertible' }, { key: 'b', text: 'Singular' }, { key: 'c', text: 'Identidad' }, { key: 'd', text: 'Nula' }], answers: ['b'] },
      { id: 10, question: 'La multiplicación de matrices es:', options: [{ key: 'a', text: 'Conmutativa' }, { key: 'b', text: 'No conmutativa' }, { key: 'c', text: 'Imposible' }, { key: 'd', text: 'Solo para matrices cuadradas' }], answers: ['b'] }
    ]
  }
];

function createBankFiles() {
  console.log('📝 Creando tests de Matemáticas II - Bachillerato...\n');
  
  const subjectSlug = 'matematicas-2-bach';
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
