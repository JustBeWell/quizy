/**
 * Script para añadir contenido de Economía - Bachillerato
 */

const fs = require('fs');
const path = require('path');

const questionBanks = [
  {
    name: 'Fundamentos de Economía',
    questions: [
      { id: 1, question: 'La economía estudia:', options: [{ key: 'a', text: 'Solo el dinero' }, { key: 'b', text: 'La gestión de recursos escasos' }, { key: 'c', text: 'Solo las empresas' }, { key: 'd', text: 'Solo el gobierno' }], answers: ['b'] },
      { id: 2, question: 'El coste de oportunidad es:', options: [{ key: 'a', text: 'El precio de un bien' }, { key: 'b', text: 'Lo que renunciamos al elegir' }, { key: 'c', text: 'El beneficio obtenido' }, { key: 'd', text: 'El ahorro' }], answers: ['b'] },
      { id: 3, question: 'En una economía de mercado, los precios se determinan por:', options: [{ key: 'a', text: 'El gobierno' }, { key: 'b', text: 'La oferta y la demanda' }, { key: 'c', text: 'Las empresas' }, { key: 'd', text: 'Los trabajadores' }], answers: ['b'] },
      { id: 4, question: 'Si aumenta la demanda y la oferta permanece constante:', options: [{ key: 'a', text: 'El precio baja' }, { key: 'b', text: 'El precio sube' }, { key: 'c', text: 'El precio no cambia' }, { key: 'd', text: 'Desaparece el mercado' }], answers: ['b'] },
      { id: 5, question: 'Los factores de producción son:', options: [{ key: 'a', text: 'Tierra, trabajo, capital' }, { key: 'b', text: 'Solo dinero' }, { key: 'c', text: 'Solo tecnología' }, { key: 'd', text: 'Solo recursos naturales' }], answers: ['a'] },
      { id: 6, question: 'El PIB mide:', options: [{ key: 'a', text: 'La población' }, { key: 'b', text: 'El valor de bienes y servicios producidos' }, { key: 'c', text: 'Solo las exportaciones' }, { key: 'd', text: 'La inflación' }], answers: ['b'] },
      { id: 7, question: 'La inflación es:', options: [{ key: 'a', text: 'La caída de precios' }, { key: 'b', text: 'El aumento generalizado de precios' }, { key: 'c', text: 'El desempleo' }, { key: 'd', text: 'El crecimiento económico' }], answers: ['b'] },
      { id: 8, question: 'El desempleo friccional es:', options: [{ key: 'a', text: 'Permanente' }, { key: 'b', text: 'Temporal entre trabajos' }, { key: 'c', text: 'Por falta de cualificación' }, { key: 'd', text: 'Por crisis económica' }], answers: ['b'] },
      { id: 9, question: 'Un bien inferior es aquel:', options: [{ key: 'a', text: 'De mala calidad' }, { key: 'b', text: 'Cuya demanda baja al aumentar la renta' }, { key: 'c', text: 'Muy caro' }, { key: 'd', text: 'Sin demanda' }], answers: ['b'] },
      { id: 10, question: 'La elasticidad precio de la demanda mide:', options: [{ key: 'a', text: 'El cambio en la demanda ante cambios en el precio' }, { key: 'b', text: 'Solo el precio' }, { key: 'c', text: 'Solo la cantidad' }, { key: 'd', text: 'La inflación' }], answers: ['a'] }
    ]
  },
  {
    name: 'Empresa y Producción',
    questions: [
      { id: 1, question: 'El objetivo principal de una empresa es:', options: [{ key: 'a', text: 'Maximizar beneficios' }, { key: 'b', text: 'Contratar empleados' }, { key: 'c', text: 'Pagar impuestos' }, { key: 'd', text: 'Perder dinero' }], answers: ['a'] },
      { id: 2, question: 'Los costes fijos:', options: [{ key: 'a', text: 'Varían con la producción' }, { key: 'b', text: 'No varían con la producción' }, { key: 'c', text: 'No existen' }, { key: 'd', text: 'Son siempre cero' }], answers: ['b'] },
      { id: 3, question: 'El punto muerto es cuando:', options: [{ key: 'a', text: 'Ingresos = Costes' }, { key: 'b', text: 'Ingresos > Costes' }, { key: 'c', text: 'Ingresos < Costes' }, { key: 'd', text: 'No hay producción' }], answers: ['a'] },
      { id: 4, question: 'Una S.A. (Sociedad Anónima) se caracteriza por:', options: [{ key: 'a', text: 'Responsabilidad ilimitada' }, { key: 'b', text: 'Capital dividido en acciones' }, { key: 'c', text: 'Un solo propietario' }, { key: 'd', text: 'No tener personalidad jurídica' }], answers: ['b'] },
      { id: 5, question: 'La productividad es:', options: [{ key: 'a', text: 'El número de trabajadores' }, { key: 'b', text: 'La relación entre producción y factores empleados' }, { key: 'c', text: 'El beneficio' }, { key: 'd', text: 'El precio' }], answers: ['b'] },
      { id: 6, question: 'El marketing se ocupa de:', options: [{ key: 'a', text: 'Solo la publicidad' }, { key: 'b', text: 'Identificar y satisfacer necesidades' }, { key: 'c', text: 'Solo las ventas' }, { key: 'd', text: 'La contabilidad' }], answers: ['b'] },
      { id: 7, question: 'El balance de situación muestra:', options: [{ key: 'a', text: 'Solo beneficios' }, { key: 'b', text: 'Activo, pasivo y patrimonio neto' }, { key: 'c', text: 'Solo deudas' }, { key: 'd', text: 'Los empleados' }], answers: ['b'] },
      { id: 8, question: 'La amortización es:', options: [{ key: 'a', text: 'Un ingreso' }, { key: 'b', text: 'La pérdida de valor de activos fijos' }, { key: 'c', text: 'Un beneficio' }, { key: 'd', text: 'Un impuesto' }], answers: ['b'] },
      { id: 9, question: 'El capital social de una empresa es:', options: [{ key: 'a', text: 'El dinero en caja' }, { key: 'b', text: 'Las aportaciones de los socios' }, { key: 'c', text: 'Las deudas' }, { key: 'd', text: 'Los beneficios' }], answers: ['b'] },
      { id: 10, question: 'La cuenta de pérdidas y ganancias refleja:', options: [{ key: 'a', text: 'El patrimonio' }, { key: 'b', text: 'El resultado del ejercicio' }, { key: 'c', text: 'Solo activos' }, { key: 'd', text: 'Solo pasivos' }], answers: ['b'] }
    ]
  },
  {
    name: 'Sistema Financiero y Dinero',
    questions: [
      { id: 1, question: 'El Banco Central Europeo tiene como objetivo principal:', options: [{ key: 'a', text: 'Maximizar el empleo' }, { key: 'b', text: 'Mantener la estabilidad de precios' }, { key: 'c', text: 'Aumentar el PIB' }, { key: 'd', text: 'Recaudar impuestos' }], answers: ['b'] },
      { id: 2, question: 'Las funciones del dinero son:', options: [{ key: 'a', text: 'Medio de cambio, unidad de cuenta, depósito de valor' }, { key: 'b', text: 'Solo medio de cambio' }, { key: 'c', text: 'Solo decoración' }, { key: 'd', text: 'Ninguna función' }], answers: ['a'] },
      { id: 3, question: 'Los bancos comerciales:', options: [{ key: 'a', text: 'Solo guardan dinero' }, { key: 'b', text: 'Captan depósitos y conceden préstamos' }, { key: 'c', text: 'Solo prestan' }, { key: 'd', text: 'Emiten billetes' }], answers: ['b'] },
      { id: 4, question: 'El tipo de interés es:', options: [{ key: 'a', text: 'El precio del dinero' }, { key: 'b', text: 'Un impuesto' }, { key: 'c', text: 'Un salario' }, { key: 'd', text: 'Una tasa de desempleo' }], answers: ['a'] },
      { id: 5, question: 'La bolsa de valores es un mercado donde se negocian:', options: [{ key: 'a', text: 'Solo bienes físicos' }, { key: 'b', text: 'Acciones y otros valores' }, { key: 'c', text: 'Solo inmuebles' }, { key: 'd', text: 'Solo alimentos' }], answers: ['b'] },
      { id: 6, question: 'Un accionista es:', options: [{ key: 'a', text: 'Un empleado' }, { key: 'b', text: 'Un propietario parcial de la empresa' }, { key: 'c', text: 'Un cliente' }, { key: 'd', text: 'Un proveedor' }], answers: ['b'] },
      { id: 7, question: 'El riesgo financiero se refiere a:', options: [{ key: 'a', text: 'La posibilidad de pérdidas' }, { key: 'b', text: 'Ganar siempre' }, { key: 'c', text: 'No invertir' }, { key: 'd', text: 'Solo ahorrar' }], answers: ['a'] },
      { id: 8, question: 'La diversificación de inversiones busca:', options: [{ key: 'a', text: 'Aumentar el riesgo' }, { key: 'b', text: 'Reducir el riesgo' }, { key: 'c', text: 'Eliminar beneficios' }, { key: 'd', text: 'Perder dinero' }], answers: ['b'] },
      { id: 9, question: 'Un depósito a plazo fijo:', options: [{ key: 'a', text: 'Se puede retirar en cualquier momento' }, { key: 'b', text: 'Tiene un periodo determinado' }, { key: 'c', text: 'No da intereses' }, { key: 'd', text: 'No existe' }], answers: ['b'] },
      { id: 10, question: 'La política monetaria la lleva a cabo:', options: [{ key: 'a', text: 'El gobierno' }, { key: 'b', text: 'El banco central' }, { key: 'c', text: 'Las empresas' }, { key: 'd', text: 'Los sindicatos' }], answers: ['b'] }
    ]
  }
];

function createBankFiles() {
  console.log('📝 Creando tests de Economía - Bachillerato...\n');
  
  const subjectSlug = 'economia-bach';
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
