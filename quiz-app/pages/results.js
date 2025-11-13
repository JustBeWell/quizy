import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import ExportResults from '../components/ExportResults'

export default function Results(){
  const router = useRouter()
  const { bank, subject } = router.query
  const [summary, setSummary] = useState(null)
  const [score, setScore] = useState(null)
  const [userName, setUserName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(()=>{
    // Get user name from localStorage
    try {
      const user = localStorage.getItem('quiz_user')
      if(user) setUserName(user)
    } catch(e) {}
  }, [])

  useEffect(()=>{
    if(!bank) return
    
    const url = subject ? `/api/bank/${bank}?subject=${encodeURIComponent(subject)}` : `/api/bank/${bank}`
    
    fetch(url)
      .then(r => r.json())
      .then(async d => {
        if(!d || !d.questions) return
        
        setSummary({name:d.name || bank,total:d.questions.length,questions:d.questions})
        
        // compute score from localStorage answers
        try{
          const saved = JSON.parse(localStorage.getItem(`quiz_${bank}_answers`)||'{}')
          
          let correct = 0
          let incorrect = 0
          d.questions.forEach(q=>{
            const a = saved[q.id]
            if(a === undefined || a === null || a === '') return
            if(q.answers && q.answers.length){
              if(q.options && q.options.length){
                // Handle multiple choice: compare arrays if both are arrays
                const correctAnswers = Array.isArray(q.answers) ? q.answers.map(String) : [String(q.answers)]
                const userAnswers = Array.isArray(a) ? a.map(String) : [String(a)]
                
                // Check if the answer is correct (exact match for multi-answer questions)
                const isCorrect = correctAnswers.length === userAnswers.length &&
                  correctAnswers.every(ans => userAnswers.includes(ans))
                
                if(isCorrect) correct++
                else incorrect++
              }else{
                const got = String(a||'').trim().toLowerCase()
                const want = String(q.answers[0]||'').trim().toLowerCase()
                if(got && want && got === want) correct++
                else incorrect++
              }
            }
          })
          // apply penalty for incorrect answers: -0.33 per wrong
          const points = Math.max(0, correct - 0.33 * incorrect)
          const percentage = d.questions && d.questions.length ? Math.round((points / d.questions.length) * 100) : 0
          
          setScore({ correct, incorrect, points, percentage })
          
          // try to persist attempt to server-side endpoint with user info
          try{
            const answers = JSON.parse(localStorage.getItem(`quiz_${bank}_answers`)||'{}')
            const user = localStorage.getItem('quiz_user')
            
            // Use the bank ID for lookup, but save with the real name
            const bankIdentifier = bank // Keep original ID for DB lookup
            const bankDisplayName = d.name || bank // Use the name from API response
            
            const response = await fetch('/api/attempts', {
              method:'POST', 
              headers:{'Content-Type':'application/json'}, 
              body:JSON.stringify({ 
                bank: bankIdentifier, // ID for DB relations
                bank_name: bankDisplayName, // Display name for UI
                score: percentage, 
                answers, 
                user_name: user || null,
                subject_slug: subject || null
              })
            })
            
            // Verificar si el usuario fue eliminado
            if(!response.ok){
              const errorData = await response.json().catch(() => ({}))
              if(errorData.error === 'user_not_found'){
                // Usuario eliminado, cerrar sesión y redirigir
                alert('Tu cuenta de usuario ha sido eliminada. Serás redirigido al login.')
                localStorage.removeItem('quiz_user')
                localStorage.removeItem('quiz_token')
                localStorage.removeItem('quiz_user_data')
                router.push('/auth')
              }
            }
          }catch(e){
            console.error('Error saving attempt:', e)
          }
        }catch(e){
          console.error('Error calculating score:', e)
        }
      })
      .catch(e => console.error('Error loading bank:', e))
  },[bank, subject])

  if(!summary) return <div className="container"><p>Cargando...</p></div>

  return (
    <div className="container results-container">
      <div className="flex items-center gap-4 mb-6">
        <img src="/logo.png" alt="Quizy Logo" className="w-16 h-16 object-contain" />
        <div>
          <h2 className="text-2xl font-semibold">Resumen de Resultados</h2>
          <p className="text-gray-600">Recopilatorio: {summary.name}</p>
        </div>
      </div>
      <p>Total preguntas: {summary.total}</p>
      {score && (
        <div className="mt-4 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Correctas</p>
              <p className="text-2xl font-semibold text-green-600">{score.correct}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Incorrectas</p>
              <p className="text-2xl font-semibold text-red-600">{score.incorrect}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Puntos (con penalización)</p>
              <p className="text-2xl font-semibold">{score.points.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Porcentaje</p>
              <p className="text-2xl font-semibold text-brand-600">{score.percentage}%</p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6">
        <p className="text-sm text-gray-600 mb-3">
          Registrado como: <span className="font-semibold text-gray-900">{userName || 'Anónimo'}</span>
        </p>
        <div className="flex gap-3">
          <button 
            onClick={() => router.push('/ranking')} 
            className="btn-primary"
          >
            Ver ranking
          </button>
          <button 
            onClick={() => router.push('/levels')} 
            className="btn-ghost"
          >
            Volver al inicio
          </button>
        </div>
      </div>
      
      <ExportResults bank={bank} summary={summary} score={score} />
    </div>
  )
}
