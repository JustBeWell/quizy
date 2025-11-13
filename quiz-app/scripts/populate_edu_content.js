/**
 * Script para poblar la base de datos con asignaturas y tests reales
 * de ESO y Bachillerato
 */

const { query } = require('../lib/db');
const fs = require('fs');
const path = require('path');

// Asignaturas de ESO y Bachillerato
const subjects = [
  // ESO
  { name: 'Matemáticas ESO', slug: 'matematicas-eso', description: 'Matemáticas de Educación Secundaria Obligatoria' },
  { name: 'Lengua y Literatura ESO', slug: 'lengua-eso', description: 'Lengua Castellana y Literatura - ESO' },
  { name: 'Física y Química ESO', slug: 'fisica-quimica-eso', description: 'Física y Química - ESO' },
  { name: 'Biología y Geología ESO', slug: 'biologia-geologia-eso', description: 'Biología y Geología - ESO' },
  { name: 'Geografía e Historia ESO', slug: 'geografia-historia-eso', description: 'Geografía e Historia - ESO' },
  { name: 'Inglés ESO', slug: 'ingles-eso', description: 'Lengua Extranjera: Inglés - ESO' },
  
  // Bachillerato - Ciencias
  { name: 'Matemáticas I', slug: 'matematicas-1-bach', description: 'Matemáticas I - 1º Bachillerato (Ciencias)' },
  { name: 'Matemáticas II', slug: 'matematicas-2-bach', description: 'Matemáticas II - 2º Bachillerato (Ciencias)' },
  { name: 'Física', slug: 'fisica-bach', description: 'Física - Bachillerato' },
  { name: 'Química', slug: 'quimica-bach', description: 'Química - Bachillerato' },
  { name: 'Biología', slug: 'biologia-bach', description: 'Biología - Bachillerato' },
  
  // Bachillerato - Letras/Humanidades
  { name: 'Historia de España', slug: 'historia-espana-bach', description: 'Historia de España - 2º Bachillerato' },
  { name: 'Lengua Castellana y Literatura', slug: 'lengua-bach', description: 'Lengua Castellana y Literatura - Bachillerato' },
  { name: 'Filosofía', slug: 'filosofia-bach', description: 'Filosofía - Bachillerato' },
  { name: 'Historia de la Filosofía', slug: 'historia-filosofia-bach', description: 'Historia de la Filosofía - 2º Bachillerato' },
  { name: 'Economía', slug: 'economia-bach', description: 'Economía - Bachillerato' },
];

// Bancos de preguntas por asignatura - CONTENIDO EDUCATIVO REAL
const questionBanks = {
  'matematicas-eso': [
    {
      name: 'Números Enteros y Operaciones',
      questions: [
        { id: 1, question: '¿Cuál es el resultado de (-8) + (+5)?', options: [{ key: 'a', text: '-13' }, { key: 'b', text: '-3' }, { key: 'c', text: '+3' }, { key: 'd', text: '+13' }], answers: ['b'] },
        { id: 2, question: 'Calcula: (-12) - (-7)', options: [{ key: 'a', text: '-19' }, { key: 'b', text: '-5' }, { key: 'c', text: '+5' }, { key: 'd', text: '+19' }], answers: ['b'] },
        { id: 3, question: '¿Cuánto es (-4) × (+6)?', options: [{ key: 'a', text: '-24' }, { key: 'b', text: '-10' }, { key: 'c', text: '+10' }, { key: 'd', text: '+24' }], answers: ['a'] },
        { id: 4, question: 'Divide: (-36) ÷ (-9)', options: [{ key: 'a', text: '-4' }, { key: 'b', text: '+4' }, { key: 'c', text: '-27' }, { key: 'd', text: '+27' }], answers: ['b'] },
        { id: 5, question: 'El valor absoluto de -15 es:', options: [{ key: 'a', text: '-15' }, { key: 'b', text: '0' }, { key: 'c', text: '15' }, { key: 'd', text: '30' }], answers: ['c'] },
        { id: 6, question: 'Ordena de menor a mayor: -5, 3, -2, 0, 1', options: [{ key: 'a', text: '-5, -2, 0, 1, 3' }, { key: 'b', text: '0, -2, -5, 1, 3' }, { key: 'c', text: '3, 1, 0, -2, -5' }, { key: 'd', text: '-2, -5, 0, 1, 3' }], answers: ['a'] },
        { id: 7, question: '¿Cuál es el opuesto de -7?', options: [{ key: 'a', text: '-7' }, { key: 'b', text: '0' }, { key: 'c', text: '7' }, { key: 'd', text: '14' }], answers: ['c'] },
        { id: 8, question: 'Resuelve: 5 - 8 + 3', options: [{ key: 'a', text: '-6' }, { key: 'b', text: '0' }, { key: 'c', text: '6' }, { key: 'd', text: '16' }], answers: ['b'] },
        { id: 9, question: 'Si la temperatura era de -3°C y subió 7°C, ¿cuál es la temperatura final?', options: [{ key: 'a', text: '-10°C' }, { key: 'b', text: '-4°C' }, { key: 'c', text: '4°C' }, { key: 'd', text: '10°C' }], answers: ['c'] },
        { id: 10, question: 'Calcula: (-2)³', options: [{ key: 'a', text: '-8' }, { key: 'b', text: '-6' }, { key: 'c', text: '6' }, { key: 'd', text: '8' }], answers: ['a'] }
      ]
    },
    {
      name: 'Fracciones y Números Racionales',
      questions: [
        { id: 1, question: 'Simplifica la fracción 24/36:', options: [{ key: 'a', text: '2/3' }, { key: 'b', text: '3/4' }, { key: 'c', text: '4/6' }, { key: 'd', text: '12/18' }], answers: ['a'] },
        { id: 2, question: 'Suma: 1/2 + 1/3', options: [{ key: 'a', text: '2/5' }, { key: 'b', text: '2/6' }, { key: 'c', text: '5/6' }, { key: 'd', text: '3/5' }], answers: ['c'] },
        { id: 3, question: 'Multiplica: (2/5) × (3/4)', options: [{ key: 'a', text: '5/9' }, { key: 'b', text: '6/20' }, { key: 'c', text: '3/10' }, { key: 'd', text: '5/20' }], answers: ['c'] },
        { id: 4, question: 'Divide: (3/4) ÷ (2/3)', options: [{ key: 'a', text: '6/12' }, { key: 'b', text: '9/8' }, { key: 'c', text: '1/2' }, { key: 'd', text: '2' }], answers: ['b'] },
        { id: 5, question: '¿Qué fracción representa 0.75?', options: [{ key: 'a', text: '7/5' }, { key: 'b', text: '75/100' }, { key: 'c', text: '3/4' }, { key: 'd', text: '1/4' }], answers: ['c'] },
        { id: 6, question: 'El número decimal 0.333... es equivalente a:', options: [{ key: 'a', text: '1/4' }, { key: 'b', text: '1/3' }, { key: 'c', text: '3/10' }, { key: 'd', text: '1/2' }], answers: ['b'] },
        { id: 7, question: 'Ordena de menor a mayor: 1/2, 2/3, 3/4', options: [{ key: 'a', text: '1/2, 2/3, 3/4' }, { key: 'b', text: '3/4, 2/3, 1/2' }, { key: 'c', text: '2/3, 1/2, 3/4' }, { key: 'd', text: '1/2, 3/4, 2/3' }], answers: ['a'] },
        { id: 8, question: '¿Cuál es el m.c.m. de 12 y 18?', options: [{ key: 'a', text: '6' }, { key: 'b', text: '36' }, { key: 'c', text: '54' }, { key: 'd', text: '216' }], answers: ['b'] },
        { id: 9, question: 'El m.c.d. de 24 y 36 es:', options: [{ key: 'a', text: '4' }, { key: 'b', text: '6' }, { key: 'c', text: '12' }, { key: 'd', text: '72' }], answers: ['c'] },
        { id: 10, question: 'Resta: 5/6 - 1/4', options: [{ key: 'a', text: '4/2' }, { key: 'b', text: '7/12' }, { key: 'c', text: '4/10' }, { key: 'd', text: '1/2' }], answers: ['b'] }
      ]
    },
    {
      name: 'Potencias y Raíces',
      questions: [
        { id: 1, question: '¿Cuánto es 2⁵?', options: [{ key: 'a', text: '10' }, { key: 'b', text: '16' }, { key: 'c', text: '25' }, { key: 'd', text: '32' }], answers: ['d'] },
        { id: 2, question: 'Calcula: 10³', options: [{ key: 'a', text: '30' }, { key: 'b', text: '100' }, { key: 'c', text: '1000' }, { key: 'd', text: '10000' }], answers: ['c'] },
        { id: 3, question: '¿Cuál es el resultado de √144?', options: [{ key: 'a', text: '11' }, { key: 'b', text: '12' }, { key: 'c', text: '13' }, { key: 'd', text: '14' }], answers: ['b'] },
        { id: 4, question: 'Simplifica: 2³ × 2⁴', options: [{ key: 'a', text: '2⁷' }, { key: 'b', text: '2¹²' }, { key: 'c', text: '4⁷' }, { key: 'd', text: '128' }], answers: ['a'] },
        { id: 5, question: '¿Cuánto es √81 + √16?', options: [{ key: 'a', text: '9' }, { key: 'b', text: '11' }, { key: 'c', text: '13' }, { key: 'd', text: '15' }], answers: ['c'] },
        { id: 6, question: 'Calcula: (2³)²', options: [{ key: 'a', text: '2⁵' }, { key: 'b', text: '2⁶' }, { key: 'c', text: '2⁹' }, { key: 'd', text: '64' }], answers: ['b'] },
        { id: 7, question: '¿Cuál es el valor de 5⁰?', options: [{ key: 'a', text: '0' }, { key: 'b', text: '1' }, { key: 'c', text: '5' }, { key: 'd', text: 'No definido' }], answers: ['b'] },
        { id: 8, question: 'Resuelve: 3² + 4²', options: [{ key: 'a', text: '7' }, { key: 'b', text: '24' }, { key: 'c', text: '25' }, { key: 'd', text: '49' }], answers: ['c'] },
        { id: 9, question: '√(25 × 4) es igual a:', options: [{ key: 'a', text: '10' }, { key: 'b', text: '20' }, { key: 'c', text: '50' }, { key: 'd', text: '100' }], answers: ['a'] },
        { id: 10, question: 'Si 2ⁿ = 64, ¿cuánto vale n?', options: [{ key: 'a', text: '4' }, { key: 'b', text: '5' }, { key: 'c', text: '6' }, { key: 'd', text: '7' }], answers: ['c'] }
      ]
    },
    {
      name: 'Álgebra: Ecuaciones de Primer Grado',
      questions: [
        { id: 1, question: 'Resuelve: 3x + 7 = 22', options: [{ key: 'a', text: 'x = 3' }, { key: 'b', text: 'x = 5' }, { key: 'c', text: 'x = 7' }, { key: 'd', text: 'x = 15' }], answers: ['b'] },
        { id: 2, question: 'Si 2x - 5 = 13, entonces x =', options: [{ key: 'a', text: '4' }, { key: 'b', text: '8' }, { key: 'c', text: '9' }, { key: 'd', text: '18' }], answers: ['c'] },
        { id: 3, question: 'Resuelve: 5x = 35', options: [{ key: 'a', text: 'x = 5' }, { key: 'b', text: 'x = 7' }, { key: 'c', text: 'x = 30' }, { key: 'd', text: 'x = 40' }], answers: ['b'] },
        { id: 4, question: 'Si x/4 = 8, ¿cuánto vale x?', options: [{ key: 'a', text: '2' }, { key: 'b', text: '4' }, { key: 'c', text: '12' }, { key: 'd', text: '32' }], answers: ['d'] },
        { id: 5, question: 'Resuelve: 2(x + 3) = 14', options: [{ key: 'a', text: 'x = 2' }, { key: 'b', text: 'x = 4' }, { key: 'c', text: 'x = 5' }, { key: 'd', text: 'x = 7' }], answers: ['b'] },
        { id: 6, question: 'Si 3x + 2 = 2x + 7, entonces x =', options: [{ key: 'a', text: '3' }, { key: 'b', text: '5' }, { key: 'c', text: '7' }, { key: 'd', text: '9' }], answers: ['b'] },
        { id: 7, question: 'El doble de un número más 5 es 21. El número es:', options: [{ key: 'a', text: '6' }, { key: 'b', text: '8' }, { key: 'c', text: '10' }, { key: 'd', text: '13' }], answers: ['b'] },
        { id: 8, question: 'Resuelve: x - 9 = -3', options: [{ key: 'a', text: 'x = -12' }, { key: 'b', text: 'x = -6' }, { key: 'c', text: 'x = 6' }, { key: 'd', text: 'x = 12' }], answers: ['c'] },
        { id: 9, question: 'Si 4x - 3 = 2x + 9, entonces x =', options: [{ key: 'a', text: '3' }, { key: 'b', text: '4' }, { key: 'c', text: '6' }, { key: 'd', text: '12' }], answers: ['c'] },
        { id: 10, question: 'Un número multiplicado por 3 menos 7 da 20. ¿Qué número es?', options: [{ key: 'a', text: '7' }, { key: 'b', text: '9' }, { key: 'c', text: '11' }, { key: 'd', text: '13' }], answers: ['b'] }
      ]
    },
    {
      name: 'Geometría: Perímetros y Áreas',
      questions: [
        { id: 1, question: '¿Cuál es el perímetro de un cuadrado de lado 7 cm?', options: [{ key: 'a', text: '14 cm' }, { key: 'b', text: '21 cm' }, { key: 'c', text: '28 cm' }, { key: 'd', text: '49 cm' }], answers: ['c'] },
        { id: 2, question: 'El área de un rectángulo de 8 cm de base y 5 cm de altura es:', options: [{ key: 'a', text: '13 cm²' }, { key: 'b', text: '26 cm²' }, { key: 'c', text: '40 cm²' }, { key: 'd', text: '80 cm²' }], answers: ['c'] },
        { id: 3, question: 'El perímetro de un círculo de radio 7 cm es (π ≈ 3.14):', options: [{ key: 'a', text: '21.98 cm' }, { key: 'b', text: '43.96 cm' }, { key: 'c', text: '153.86 cm' }, { key: 'd', text: '615.44 cm' }], answers: ['b'] },
        { id: 4, question: '¿Cuál es el área de un triángulo de base 10 cm y altura 6 cm?', options: [{ key: 'a', text: '16 cm²' }, { key: 'b', text: '30 cm²' }, { key: 'c', text: '60 cm²' }, { key: 'd', text: '120 cm²' }], answers: ['b'] },
        { id: 5, question: 'Un cuadrado tiene área de 64 cm². ¿Cuánto mide su lado?', options: [{ key: 'a', text: '4 cm' }, { key: 'b', text: '8 cm' }, { key: 'c', text: '16 cm' }, { key: 'd', text: '32 cm' }], answers: ['b'] },
        { id: 6, question: 'El área de un círculo de radio 5 cm es (π ≈ 3.14):', options: [{ key: 'a', text: '15.7 cm²' }, { key: 'b', text: '31.4 cm²' }, { key: 'c', text: '78.5 cm²' }, { key: 'd', text: '157 cm²' }], answers: ['c'] },
        { id: 7, question: '¿Cuál es el perímetro de un rectángulo de 12 cm × 5 cm?', options: [{ key: 'a', text: '17 cm' }, { key: 'b', text: '24 cm' }, { key: 'c', text: '34 cm' }, { key: 'd', text: '60 cm' }], answers: ['c'] },
        { id: 8, question: 'La diagonal de un cuadrado de lado 10 cm mide aproximadamente:', options: [{ key: 'a', text: '10 cm' }, { key: 'b', text: '14.14 cm' }, { key: 'c', text: '20 cm' }, { key: 'd', text: '28.28 cm' }], answers: ['b'] },
        { id: 9, question: '¿Cuál es el área de un paralelogramo de base 9 cm y altura 4 cm?', options: [{ key: 'a', text: '13 cm²' }, { key: 'b', text: '18 cm²' }, { key: 'c', text: '36 cm²' }, { key: 'd', text: '72 cm²' }], answers: ['c'] },
        { id: 10, question: 'Un rectángulo tiene área de 48 cm² y base de 8 cm. Su altura es:', options: [{ key: 'a', text: '4 cm' }, { key: 'b', text: '6 cm' }, { key: 'c', text: '8 cm' }, { key: 'd', text: '12 cm' }], answers: ['b'] }
      ]
    },
    {
      name: 'Proporcionalidad y Porcentajes',
      questions: [
        { id: 1, question: 'Si 3 kg de manzanas cuestan 6€, ¿cuánto costarán 5 kg?', options: [{ key: 'a', text: '8€' }, { key: 'b', text: '9€' }, { key: 'c', text: '10€' }, { key: 'd', text: '12€' }], answers: ['c'] },
        { id: 2, question: '¿Cuánto es el 25% de 80?', options: [{ key: 'a', text: '15' }, { key: 'b', text: '20' }, { key: 'c', text: '25' }, { key: 'd', text: '30' }], answers: ['b'] },
        { id: 3, question: 'Un artículo de 50€ tiene un descuento del 20%. ¿Cuánto pagarás?', options: [{ key: 'a', text: '30€' }, { key: 'b', text: '35€' }, { key: 'c', text: '40€' }, { key: 'd', text: '45€' }], answers: ['c'] },
        { id: 4, question: 'Si 4 obreros tardan 6 días en hacer un trabajo, ¿cuánto tardarán 8 obreros?', options: [{ key: 'a', text: '2 días' }, { key: 'b', text: '3 días' }, { key: 'c', text: '4 días' }, { key: 'd', text: '12 días' }], answers: ['b'] },
        { id: 5, question: '¿Qué porcentaje es 15 de 60?', options: [{ key: 'a', text: '15%' }, { key: 'b', text: '20%' }, { key: 'c', text: '25%' }, { key: 'd', text: '30%' }], answers: ['c'] },
        { id: 6, question: 'Si aumentamos 200 en un 15%, obtenemos:', options: [{ key: 'a', text: '215' }, { key: 'b', text: '220' }, { key: 'c', text: '230' }, { key: 'd', text: '300' }], answers: ['c'] },
        { id: 7, question: 'La razón entre 12 y 18 simplificada es:', options: [{ key: 'a', text: '1/2' }, { key: 'b', text: '2/3' }, { key: 'c', text: '3/4' }, { key: 'd', text: '6/9' }], answers: ['b'] },
        { id: 8, question: 'Un coche consume 6 litros en 100 km. ¿Cuánto consumirá en 250 km?', options: [{ key: 'a', text: '12 litros' }, { key: 'b', text: '15 litros' }, { key: 'c', text: '18 litros' }, { key: 'd', text: '20 litros' }], answers: ['b'] },
        { id: 9, question: 'El IVA es el 21%. ¿Cuánto pagas por un artículo de 100€ con IVA?', options: [{ key: 'a', text: '110€' }, { key: 'b', text: '115€' }, { key: 'c', text: '121€' }, { key: 'd', text: '130€' }], answers: ['c'] },
        { id: 10, question: 'Si una magnitud disminuye de 80 a 60, el porcentaje de disminución es:', options: [{ key: 'a', text: '20%' }, { key: 'b', text: '25%' }, { key: 'c', text: '30%' }, { key: 'd', text: '33%' }], answers: ['b'] }
      ]
    }
  ],

  'lengua-eso': [
    {
      name: 'Sintaxis: Análisis de Oraciones',
      questions: [
        {
          id: 1,
          question: '¿Cuál es el área de un rectángulo de 8 cm de base y 5 cm de altura?',
          options: [
            { key: 'a', text: '13 cm²' },
            { key: 'b', text: '26 cm²' },
            { key: 'c', text: '40 cm²' },
            { key: 'd', text: '80 cm²' }
          ],
          answers: ['c']
        },
        {
          id: 2,
          question: 'Un círculo tiene un radio de 7 cm. ¿Cuál es su perímetro aproximado? (usa π ≈ 3.14)',
          options: [
            { key: 'a', text: '21.98 cm' },
            { key: 'b', text: '43.96 cm' },
            { key: 'c', text: '153.86 cm' },
            { key: 'd', text: '615.44 cm' }
          ],
          answers: ['b']
        },
        {
          id: 3,
          question: '¿Cuál es el área de un triángulo de base 12 cm y altura 8 cm?',
          options: [
            { key: 'a', text: '20 cm²' },
            { key: 'b', text: '40 cm²' },
            { key: 'c', text: '48 cm²' },
            { key: 'd', text: '96 cm²' }
          ],
          answers: ['c']
        },
        {
          id: 4,
          question: 'Un cuadrado tiene un perímetro de 36 cm. ¿Cuál es su área?',
          options: [
            { key: 'a', text: '36 cm²' },
            { key: 'b', text: '64 cm²' },
            { key: 'c', text: '81 cm²' },
            { key: 'd', text: '144 cm²' }
          ],
          answers: ['c']
        },
        {
          id: 5,
          question: '¿Cuánto mide la diagonal de un cuadrado de lado 10 cm? (redondea a dos decimales)',
          options: [
            { key: 'a', text: '10.00 cm' },
            { key: 'b', text: '14.14 cm' },
            { key: 'c', text: '20.00 cm' },
            { key: 'd', text: '28.28 cm' }
          ],
          answers: ['b']
        }
      ]
    }
  ],
  
  'fisica-quimica-eso': [
    {
      name: 'Estructura de la Materia',
      questions: [
        {
          id: 1,
          question: '¿Qué partículas subatómicas tienen carga negativa?',
          options: [
            { key: 'a', text: 'Protones' },
            { key: 'b', text: 'Neutrones' },
            { key: 'c', text: 'Electrones' },
            { key: 'd', text: 'Quarks' }
          ],
          answers: ['c']
        },
        {
          id: 2,
          question: '¿Qué determina el número atómico de un elemento?',
          options: [
            { key: 'a', text: 'Número de neutrones' },
            { key: 'b', text: 'Número de protones' },
            { key: 'c', text: 'Número de electrones' },
            { key: 'd', text: 'Suma de protones y neutrones' }
          ],
          answers: ['b']
        },
        {
          id: 3,
          question: '¿Cuál es el símbolo químico del sodio?',
          options: [
            { key: 'a', text: 'S' },
            { key: 'b', text: 'So' },
            { key: 'c', text: 'Na' },
            { key: 'd', text: 'Sd' }
          ],
          answers: ['c']
        },
        {
          id: 4,
          question: 'Los elementos de un mismo grupo en la tabla periódica tienen:',
          options: [
            { key: 'a', text: 'El mismo número de electrones' },
            { key: 'b', text: 'El mismo número de protones' },
            { key: 'c', text: 'El mismo número de electrones en su última capa' },
            { key: 'd', text: 'La misma masa atómica' }
          ],
          answers: ['c']
        },
        {
          id: 5,
          question: '¿Qué tipo de enlace se forma cuando dos átomos comparten electrones?',
          options: [
            { key: 'a', text: 'Enlace iónico' },
            { key: 'b', text: 'Enlace covalente' },
            { key: 'c', text: 'Enlace metálico' },
            { key: 'd', text: 'Enlace de hidrógeno' }
          ],
          answers: ['b']
        }
      ]
    },
    {
      name: 'Leyes del Movimiento',
      questions: [
        {
          id: 1,
          question: 'Según la primera ley de Newton, un cuerpo en reposo:',
          options: [
            { key: 'a', text: 'Siempre estará en movimiento' },
            { key: 'b', text: 'Permanecerá en reposo a menos que actúe una fuerza' },
            { key: 'c', text: 'Acelerará constantemente' },
            { key: 'd', text: 'Caerá por la gravedad' }
          ],
          answers: ['b']
        },
        {
          id: 2,
          question: 'La fórmula F = m · a corresponde a:',
          options: [
            { key: 'a', text: 'Primera ley de Newton' },
            { key: 'b', text: 'Segunda ley de Newton' },
            { key: 'c', text: 'Tercera ley de Newton' },
            { key: 'd', text: 'Ley de gravitación universal' }
          ],
          answers: ['b']
        },
        {
          id: 3,
          question: 'Si duplicamos la masa de un objeto y aplicamos la misma fuerza, su aceleración:',
          options: [
            { key: 'a', text: 'Se duplica' },
            { key: 'b', text: 'Se reduce a la mitad' },
            { key: 'c', text: 'Se cuadruplica' },
            { key: 'd', text: 'No cambia' }
          ],
          answers: ['b']
        },
        {
          id: 4,
          question: 'Un objeto se mueve con velocidad constante. Esto significa que:',
          options: [
            { key: 'a', text: 'Su aceleración es cero' },
            { key: 'b', text: 'No actúan fuerzas sobre él' },
            { key: 'c', text: 'Las fuerzas están equilibradas' },
            { key: 'd', text: 'Todas las anteriores son correctas' }
          ],
          answers: ['d']
        },
        {
          id: 5,
          question: 'La tercera ley de Newton establece que:',
          options: [
            { key: 'a', text: 'A toda acción le corresponde una reacción igual y opuesta' },
            { key: 'b', text: 'La fuerza es igual a masa por aceleración' },
            { key: 'c', text: 'Un cuerpo permanece en reposo o movimiento uniforme' },
            { key: 'd', text: 'La energía no se crea ni se destruye' }
          ],
          answers: ['a']
        }
      ]
    }
  ],
  
  'lengua-eso': [
    {
      name: 'Sintaxis: Análisis de Oraciones',
      questions: [
        {
          id: 1,
          question: 'En la oración "María estudia matemáticas", ¿cuál es el sujeto?',
          options: [
            { key: 'a', text: 'María' },
            { key: 'b', text: 'estudia' },
            { key: 'c', text: 'matemáticas' },
            { key: 'd', text: 'estudia matemáticas' }
          ],
          answers: ['a']
        },
        {
          id: 2,
          question: '¿Qué función sintáctica tiene "a mi hermano" en "Le presté el libro a mi hermano"?',
          options: [
            { key: 'a', text: 'Sujeto' },
            { key: 'b', text: 'Complemento directo' },
            { key: 'c', text: 'Complemento indirecto' },
            { key: 'd', text: 'Complemento circunstancial' }
          ],
          answers: ['c']
        },
        {
          id: 3,
          question: 'Identifica el predicado nominal: ',
          options: [
            { key: 'a', text: 'Los niños juegan en el parque' },
            { key: 'b', text: 'Mi hermana es profesora' },
            { key: 'c', text: 'Compramos fruta en el mercado' },
            { key: 'd', text: 'Corrieron toda la tarde' }
          ],
          answers: ['b']
        },
        {
          id: 4,
          question: '¿Cuál de estas oraciones tiene un complemento circunstancial de tiempo?',
          options: [
            { key: 'a', text: 'El libro está sobre la mesa' },
            { key: 'b', text: 'Llegamos ayer por la tarde' },
            { key: 'c', text: 'Vive cerca de la escuela' },
            { key: 'd', text: 'Lo hice con mucha alegría' }
          ],
          answers: ['b']
        },
        {
          id: 5,
          question: 'En "Me gusta el chocolate", el sujeto es:',
          options: [
            { key: 'a', text: 'Me' },
            { key: 'b', text: 'gusta' },
            { key: 'c', text: 'el chocolate' },
            { key: 'd', text: 'No tiene sujeto' }
          ],
          answers: ['c']
        }
      ]
    },
    {
      name: 'Morfología: Clases de Palabras',
      questions: [
        {
          id: 1,
          question: '¿Qué clase de palabra es "rápidamente"?',
          options: [
            { key: 'a', text: 'Adjetivo' },
            { key: 'b', text: 'Adverbio' },
            { key: 'c', text: 'Verbo' },
            { key: 'd', text: 'Sustantivo' }
          ],
          answers: ['b']
        },
        {
          id: 2,
          question: 'Identifica el verbo copulativo:',
          options: [
            { key: 'a', text: 'Correr' },
            { key: 'b', text: 'Parecer' },
            { key: 'c', text: 'Comer' },
            { key: 'd', text: 'Saltar' }
          ],
          answers: ['b']
        },
        {
          id: 3,
          question: '¿Cuál es el género del sustantivo "análisis"?',
          options: [
            { key: 'a', text: 'Masculino' },
            { key: 'b', text: 'Femenino' },
            { key: 'c', text: 'Neutro' },
            { key: 'd', text: 'Ambiguo' }
          ],
          answers: ['a']
        },
        {
          id: 4,
          question: 'El plural de "carácter" es:',
          options: [
            { key: 'a', text: 'caracteres' },
            { key: 'b', text: 'caractereses' },
            { key: 'c', text: 'carácteres' },
            { key: 'd', text: 'caractéres' }
          ],
          answers: ['a']
        },
        {
          id: 5,
          question: '¿Qué tipo de determinante es "algún"?',
          options: [
            { key: 'a', text: 'Artículo' },
            { key: 'b', text: 'Demostrativo' },
            { key: 'c', text: 'Indefinido' },
            { key: 'd', text: 'Posesivo' }
          ],
          answers: ['c']
        }
      ]
    }
  ],
  
  'biologia-geologia-eso': [
    {
      name: 'La Célula',
      questions: [
        {
          id: 1,
          question: '¿Cuál es la función principal de las mitocondrias?',
          options: [
            { key: 'a', text: 'Síntesis de proteínas' },
            { key: 'b', text: 'Producción de energía (ATP)' },
            { key: 'c', text: 'Fotosíntesis' },
            { key: 'd', text: 'División celular' }
          ],
          answers: ['b']
        },
        {
          id: 2,
          question: '¿Qué orgánulo contiene el material genético en células eucariotas?',
          options: [
            { key: 'a', text: 'Ribosomas' },
            { key: 'b', text: 'Mitocondrias' },
            { key: 'c', text: 'Núcleo' },
            { key: 'd', text: 'Retículo endoplasmático' }
          ],
          answers: ['c']
        },
        {
          id: 3,
          question: 'La pared celular está presente en:',
          options: [
            { key: 'a', text: 'Todas las células' },
            { key: 'b', text: 'Solo células animales' },
            { key: 'c', text: 'Solo células vegetales' },
            { key: 'd', text: 'Solo células procariotas' }
          ],
          answers: ['c']
        },
        {
          id: 4,
          question: '¿Qué proceso permite a las células vegetales producir su propio alimento?',
          options: [
            { key: 'a', text: 'Respiración celular' },
            { key: 'b', text: 'Fotosíntesis' },
            { key: 'c', text: 'Fermentación' },
            { key: 'd', text: 'Digestión' }
          ],
          answers: ['b']
        },
        {
          id: 5,
          question: 'Los ribosomas son responsables de:',
          options: [
            { key: 'a', text: 'Síntesis de lípidos' },
            { key: 'b', text: 'Síntesis de proteínas' },
            { key: 'c', text: 'Respiración celular' },
            { key: 'd', text: 'Reproducción celular' }
          ],
          answers: ['b']
        }
      ]
    },
    {
      name: 'Geología: Rocas y Minerales',
      questions: [
        {
          id: 1,
          question: '¿Qué tipo de roca se forma por enfriamiento del magma?',
          options: [
            { key: 'a', text: 'Roca sedimentaria' },
            { key: 'b', text: 'Roca metamórfica' },
            { key: 'c', text: 'Roca ígnea' },
            { key: 'd', text: 'Roca volcánica' }
          ],
          answers: ['c']
        },
        {
          id: 2,
          question: 'El granito es un ejemplo de roca:',
          options: [
            { key: 'a', text: 'Sedimentaria' },
            { key: 'b', text: 'Ígnea plutónica' },
            { key: 'c', text: 'Ígnea volcánica' },
            { key: 'd', text: 'Metamórfica' }
          ],
          answers: ['b']
        },
        {
          id: 3,
          question: '¿Cuál es el mineral más duro según la escala de Mohs?',
          options: [
            { key: 'a', text: 'Cuarzo' },
            { key: 'b', text: 'Diamante' },
            { key: 'c', text: 'Corindón' },
            { key: 'd', text: 'Topacio' }
          ],
          answers: ['b']
        },
        {
          id: 4,
          question: 'Las rocas sedimentarias se forman por:',
          options: [
            { key: 'a', text: 'Enfriamiento del magma' },
            { key: 'b', text: 'Presión y temperatura extremas' },
            { key: 'c', text: 'Acumulación y compactación de sedimentos' },
            { key: 'd', text: 'Erosión del viento' }
          ],
          answers: ['c']
        },
        {
          id: 5,
          question: 'El mármol es una roca metamórfica que proviene de:',
          options: [
            { key: 'a', text: 'Granito' },
            { key: 'b', text: 'Basalto' },
            { key: 'c', text: 'Caliza' },
            { key: 'd', text: 'Arenisca' }
          ],
          answers: ['c']
        }
      ]
    }
  ],
  
  'historia-espana-bach': [
    {
      name: 'La Guerra Civil Española (1936-1939)',
      questions: [
        {
          id: 1,
          question: '¿En qué año comenzó la Guerra Civil Española?',
          options: [
            { key: 'a', text: '1934' },
            { key: 'b', text: '1936' },
            { key: 'c', text: '1938' },
            { key: 'd', text: '1939' }
          ],
          answers: ['b']
        },
        {
          id: 2,
          question: '¿Quién lideró el bando sublevado durante la Guerra Civil?',
          options: [
            { key: 'a', text: 'Manuel Azaña' },
            { key: 'b', text: 'Francisco Largo Caballero' },
            { key: 'c', text: 'Francisco Franco' },
            { key: 'd', text: 'José Antonio Primo de Rivera' }
          ],
          answers: ['c']
        },
        {
          id: 3,
          question: 'La Batalla del Ebro (1938) fue:',
          options: [
            { key: 'a', text: 'La primera batalla de la guerra' },
            { key: 'b', text: 'Una de las batallas más largas y sangrientas' },
            { key: 'c', text: 'Una victoria decisiva del bando republicano' },
            { key: 'd', text: 'El fin de la guerra' }
          ],
          answers: ['b']
        },
        {
          id: 4,
          question: '¿Qué potencias extranjeras apoyaron al bando franquista?',
          options: [
            { key: 'a', text: 'Francia y Reino Unido' },
            { key: 'b', text: 'Estados Unidos y Canadá' },
            { key: 'c', text: 'Alemania nazi e Italia fascista' },
            { key: 'd', text: 'Unión Soviética' }
          ],
          answers: ['c']
        },
        {
          id: 5,
          question: 'El bombardeo de Guernica (1937) fue perpetrado por:',
          options: [
            { key: 'a', text: 'Aviación italiana' },
            { key: 'b', text: 'Legión Cóndor alemana' },
            { key: 'c', text: 'Aviación francesa' },
            { key: 'd', text: 'Aviación republicana' }
          ],
          answers: ['b']
        }
      ]
    },
    {
      name: 'La Transición Democrática',
      questions: [
        {
          id: 1,
          question: '¿En qué año murió Francisco Franco?',
          options: [
            { key: 'a', text: '1973' },
            { key: 'b', text: '1975' },
            { key: 'c', text: '1977' },
            { key: 'd', text: '1978' }
          ],
          answers: ['b']
        },
        {
          id: 2,
          question: '¿Quién fue proclamado Rey de España tras la muerte de Franco?',
          options: [
            { key: 'a', text: 'Juan de Borbón' },
            { key: 'b', text: 'Juan Carlos I' },
            { key: 'c', text: 'Alfonso XIII' },
            { key: 'd', text: 'Felipe VI' }
          ],
          answers: ['b']
        },
        {
          id: 3,
          question: 'La Constitución Española fue aprobada en referéndum en:',
          options: [
            { key: 'a', text: '1975' },
            { key: 'b', text: '1977' },
            { key: 'c', text: '1978' },
            { key: 'd', text: '1979' }
          ],
          answers: ['c']
        },
        {
          id: 4,
          question: '¿Quién fue el primer presidente del gobierno elegido democráticamente tras el franquismo?',
          options: [
            { key: 'a', text: 'Adolfo Suárez' },
            { key: 'b', text: 'Felipe González' },
            { key: 'c', text: 'Leopoldo Calvo-Sotelo' },
            { key: 'd', text: 'Santiago Carrillo' }
          ],
          answers: ['a']
        },
        {
          id: 5,
          question: 'El intento de golpe de Estado del 23-F tuvo lugar en:',
          options: [
            { key: 'a', text: '1978' },
            { key: 'b', text: '1979' },
            { key: 'c', text: '1981' },
            { key: 'd', text: '1982' }
          ],
          answers: ['c']
        }
      ]
    }
  ],
  
  'filosofia-bach': [
    {
      name: 'Filosofía Antigua: Platón y Aristóteles',
      questions: [
        {
          id: 1,
          question: 'Según Platón, ¿dónde se encuentran las Ideas o Formas perfectas?',
          options: [
            { key: 'a', text: 'En el mundo sensible' },
            { key: 'b', text: 'En el mundo inteligible' },
            { key: 'c', text: 'En la mente humana' },
            { key: 'd', text: 'No existen' }
          ],
          answers: ['b']
        },
        {
          id: 2,
          question: 'El mito de la caverna de Platón representa:',
          options: [
            { key: 'a', text: 'La teoría del conocimiento' },
            { key: 'b', text: 'La teoría política' },
            { key: 'c', text: 'La teoría ética' },
            { key: 'd', text: 'Todas las anteriores' }
          ],
          answers: ['d']
        },
        {
          id: 3,
          question: 'Para Aristóteles, la causa final de un ser es:',
          options: [
            { key: 'a', text: 'Su materia' },
            { key: 'b', text: 'Su forma' },
            { key: 'c', text: 'Su propósito o finalidad' },
            { key: 'd', text: 'Su origen' }
          ],
          answers: ['c']
        },
        {
          id: 4,
          question: 'Aristóteles define al ser humano como:',
          options: [
            { key: 'a', text: 'Un animal racional' },
            { key: 'b', text: 'Un ser político' },
            { key: 'c', text: 'Ambas definiciones son correctas' },
            { key: 'd', text: 'Un alma inmortal' }
          ],
          answers: ['c']
        },
        {
          id: 5,
          question: 'La virtud, según Aristóteles, es:',
          options: [
            { key: 'a', text: 'Innata en el ser humano' },
            { key: 'b', text: 'Un término medio entre dos extremos' },
            { key: 'c', text: 'Imposible de alcanzar' },
            { key: 'd', text: 'Solo para filósofos' }
          ],
          answers: ['b']
        }
      ]
    }
  ]
};

async function insertSubjects() {
  console.log('📚 Insertando asignaturas...');
  
  for (const subject of subjects) {
    try {
      const result = await query(
        'INSERT INTO subjects (name, slug, description) VALUES ($1, $2, $3) ON CONFLICT (slug) DO UPDATE SET name = $1, description = $3 RETURNING id',
        [subject.name, subject.slug, subject.description]
      );
      console.log(`  ✓ ${subject.name} (ID: ${result.rows[0].id})`);
    } catch (error) {
      console.error(`  ✗ Error con ${subject.name}:`, error.message);
    }
  }
}

async function createBankFiles() {
  console.log('\n📝 Creando archivos JSON de bancos de preguntas...');
  
  for (const [subjectSlug, banks] of Object.entries(questionBanks)) {
    // Crear directorio si no existe
    const subjectDir = path.join(process.cwd(), 'data', subjectSlug);
    if (!fs.existsSync(subjectDir)) {
      fs.mkdirSync(subjectDir, { recursive: true });
    }
    
    // Crear archivo JSON para cada banco
    for (let i = 0; i < banks.length; i++) {
      const bank = banks[i];
      const fileName = `exam${i + 1}.json`;
      const filePath = path.join(subjectDir, fileName);
      
      const bankData = {
        name: bank.name,
        questions: bank.questions
      };
      
      fs.writeFileSync(filePath, JSON.stringify(bankData, null, 2), 'utf8');
      console.log(`  ✓ ${subjectSlug}/${fileName} - ${bank.name}`);
    }
  }
}

async function main() {
  try {
    console.log('🚀 Iniciando población de contenido educativo...\n');
    
    await insertSubjects();
    await createBankFiles();
    
    console.log('\n✅ ¡Contenido educativo creado exitosamente!');
    console.log(`\n📊 Resumen:`);
    console.log(`   - ${subjects.length} asignaturas`);
    console.log(`   - ${Object.keys(questionBanks).length} asignaturas con tests`);
    
    let totalBanks = 0;
    let totalQuestions = 0;
    for (const banks of Object.values(questionBanks)) {
      totalBanks += banks.length;
      for (const bank of banks) {
        totalQuestions += bank.questions.length;
      }
    }
    
    console.log(`   - ${totalBanks} bancos de preguntas`);
    console.log(`   - ${totalQuestions} preguntas en total`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
