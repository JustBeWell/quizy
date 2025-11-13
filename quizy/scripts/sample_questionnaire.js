// Script de ejemplo para crear un cuestionario de prueba
// Este script demuestra cómo crear un cuestionario programáticamente

const sampleQuestionnaire = {
  name: "Introducción a JavaScript",
  description: "Cuestionario básico sobre conceptos fundamentales de JavaScript",
  subject_id: null, // Cambia esto al ID de una asignatura existente si deseas
  questions: [
    {
      id: 1,
      question: "¿Qué tipo de lenguaje es JavaScript?",
      options: [
        { key: "a", text: "Compilado" },
        { key: "b", text: "Interpretado" },
        { key: "c", text: "Ensamblador" },
        { key: "d", text: "De bajo nivel" }
      ],
      answers: ["b"]
    },
    {
      id: 2,
      question: "¿Cuáles de las siguientes son formas válidas de declarar variables en JavaScript?",
      options: [
        { key: "a", text: "var" },
        { key: "b", text: "let" },
        { key: "c", text: "const" },
        { key: "d", text: "dim" }
      ],
      answers: ["a", "b", "c"] // Múltiples respuestas correctas
    },
    {
      id: 3,
      question: "¿Qué retorna typeof null en JavaScript?",
      options: [
        { key: "a", text: "null" },
        { key: "b", text: "undefined" },
        { key: "c", text: "object" },
        { key: "d", text: "number" }
      ],
      answers: ["c"]
    },
    {
      id: 4,
      question: "¿Cuál es el resultado de 2 + '2' en JavaScript?",
      options: [
        { key: "a", text: "4" },
        { key: "b", text: "22" },
        { key: "c", text: "NaN" },
        { key: "d", text: "Error" }
      ],
      answers: ["b"]
    },
    {
      id: 5,
      question: "¿Cuáles métodos de array modifican el array original?",
      options: [
        { key: "a", text: "push()" },
        { key: "b", text: "map()" },
        { key: "c", text: "splice()" },
        { key: "d", text: "filter()" }
      ],
      answers: ["a", "c"]
    }
  ]
}

console.log("=== Ejemplo de Cuestionario ===")
console.log(JSON.stringify(sampleQuestionnaire, null, 2))
console.log("\n=== Instrucciones ===")
console.log("Para crear este cuestionario:")
console.log("1. Inicia sesión como administrador en la aplicación")
console.log("2. Ve a /admin/questionnaires")
console.log("3. Clic en 'Nuevo Cuestionario'")
console.log("4. Completa el formulario con los datos anteriores")
console.log("\nO usa la API directamente:")
console.log("POST /api/admin/questionnaires")
console.log("Headers: { 'Authorization': 'Bearer <tu-token>', 'Content-Type': 'application/json' }")
console.log("Body:", JSON.stringify(sampleQuestionnaire, null, 2))
