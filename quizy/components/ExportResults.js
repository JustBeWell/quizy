import { useState } from 'react'
import dynamic from 'next/dynamic'

// Import dinamically to avoid SSR issues
const html2canvas = dynamic(() => import('html2canvas'), { ssr: false })
const jsPDF = dynamic(() => import('jspdf').then(mod => mod.jsPDF), { ssr: false })

export default function ExportResults({ bank, summary, score }) {
  const [exporting, setExporting] = useState(false)

  async function exportAsPDF() {
    if (!summary || !score) return
    
    setExporting(true)
    try {
      // Dynamic import for client-side only
      const html2canvasModule = await import('html2canvas')
      const jsPDFModule = await import('jspdf')
      
      const html2canvas = html2canvasModule.default
      const { jsPDF } = jsPDFModule

      const container = document.querySelector('.results-container')
      if (!container) {
        alert('No se pudo encontrar el contenedor de resultados')
        return
      }

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false
      })

      const imgData = canvas.toDataURL('image/jpeg', 0.95)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
      })

      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 20
      const imgWidth = pageWidth - margin * 2
      const imgHeight = canvas.height * imgWidth / canvas.width

      let heightLeft = imgHeight
      let position = margin

      // Add first page
      pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      // Add additional pages if needed
      while (heightLeft > 0) {
        pdf.addPage()
        position = margin - (imgHeight - heightLeft)
        pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      pdf.save(`Resultados_${bank}_${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (error) {
      console.error('Error exporting PDF:', error)
      alert('Error al generar el PDF: ' + (error.message || error))
    } finally {
      setExporting(false)
    }
  }

  async function exportAsText() {
    if (!summary || !score) return
    
    setExporting(true)
    try {
      const jsPDFModule = await import('jspdf')
      const { jsPDF } = jsPDFModule

      const answers = JSON.parse(localStorage.getItem(`quiz_${bank}_answers`) || '{}')
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
      })

      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 40
      const lineHeight = 14
      let y = margin

      // Header
      pdf.setFontSize(16)
      pdf.setFont(undefined, 'bold')
      pdf.text('Resultados del Quiz', margin, y)
      y += 25

      pdf.setFontSize(11)
      pdf.setFont(undefined, 'normal')
      pdf.text(`Recopilatorio: ${summary.name || bank}`, margin, y)
      y += lineHeight
      pdf.text(`Correctas: ${score.correct} | Incorrectas: ${score.incorrect}`, margin, y)
      y += lineHeight
      pdf.text(`Puntuación: ${score.percentage}%`, margin, y)
      y += lineHeight
      pdf.text(`Fecha: ${new Date().toLocaleString('es-ES')}`, margin, y)
      y += 25

      // Questions
      const questions = summary.questions || []
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i]
        
        // Check if we need a new page
        if (y + 60 > pageHeight - margin) {
          pdf.addPage()
          y = margin
        }

        // Question text
        pdf.setFontSize(10)
        pdf.setFont(undefined, 'bold')
        const questionText = `${i + 1}. ${q.question ? q.question.replace(/<[^>]+>/g, '') : ''}`
        const splitQuestion = pdf.splitTextToSize(questionText, pageWidth - margin * 2)
        pdf.text(splitQuestion, margin, y)
        y += splitQuestion.length * lineHeight + 5

        // User's answer
        const userAnswer = answers[q.id] !== undefined ? String(answers[q.id]) : '(sin respuesta)'
        pdf.setFont(undefined, 'normal')
        pdf.setTextColor(60, 60, 60)
        const userLine = `Tu respuesta: ${userAnswer}`
        const splitUser = pdf.splitTextToSize(userLine, pageWidth - margin * 2 - 10)
        pdf.text(splitUser, margin + 10, y)
        y += splitUser.length * lineHeight

        // Correct answer
        const correctAnswer = q.answers && q.answers.length ? q.answers.join(', ') : '(no disponible)'
        pdf.setTextColor(0, 120, 50)
        const correctLine = `Correcta: ${correctAnswer}`
        const splitCorrect = pdf.splitTextToSize(correctLine, pageWidth - margin * 2 - 10)
        pdf.text(splitCorrect, margin + 10, y)
        y += splitCorrect.length * lineHeight + 15

        pdf.setTextColor(0, 0, 0)
      }

      pdf.save(`Resultados_detalle_${bank}_${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (error) {
      console.error('Error exporting text PDF:', error)
      alert('Error al generar el PDF: ' + (error.message || error))
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <h3 className="font-semibold text-gray-900 mb-2">📄 Exportar resultados</h3>
      <p className="text-sm text-gray-600 mb-4">
        Descarga un PDF con el resumen de tus respuestas y puntuación
      </p>
      <div className="flex gap-3">
        <button 
          onClick={exportAsPDF}
          className="px-4 py-2 bg-blue-700 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-800 dark:hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
          disabled={exporting || !summary || !score}
        >
          {exporting ? '⏳ Generando...' : '📸 Exportar (imagen)'}
        </button>
        <button 
          onClick={exportAsText}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          disabled={exporting || !summary || !score}
        >
          {exporting ? '⏳ Generando...' : '📝 Exportar (detallado)'}
        </button>
      </div>
    </div>
  )
}
