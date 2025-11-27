import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

export default function AttemptsPage(){
  const [attempts, setAttempts] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState(null)
  const [expandedSubjects, setExpandedSubjects] = useState({})

  useEffect(()=>{
    async function load(){
      setLoading(true)
      let user = null
      try{
        if(typeof window !== 'undefined'){
          user = localStorage.getItem('quiz_user')
        }
      }catch(e){}
      
      setUserName(user)
      
      try {
        // Cargar intentos del usuario
        const q = user ? `/api/attempts?user_name=${encodeURIComponent(user)}` : '/api/attempts'
        const res = await fetch(q)
        
        if (!res.ok) {
          throw new Error('Error al cargar intentos')
        }
        
        const json = await res.json()
        setAttempts(json || [])
        
        // Cargar asignaturas para mostrar nombres
        const subjRes = await fetch('/api/subjects')
        
        if (!subjRes.ok) {
          throw new Error('Error al cargar asignaturas')
        }
        
        const subjJson = await subjRes.json()
        setSubjects(subjJson.subjects || [])
      } catch (error) {
        console.error('Error loading attempts:', error)
        setAttempts([])
        setSubjects([])
      } finally {
        setLoading(false)
      }
    }
    load()
  },[])

  // Agrupar intentos por asignatura
  const groupedAttempts = {}
  const unknownAttempts = []
  
  attempts.forEach(attempt => {
    if(attempt.subject_name){
      if(!groupedAttempts[attempt.subject_name]){
        groupedAttempts[attempt.subject_name] = {
          slug: attempt.subject_slug,
          attempts: []
        }
      }
      groupedAttempts[attempt.subject_name].attempts.push(attempt)
    } else {
      unknownAttempts.push(attempt)
    }
  })
  
  // Auto-expandir si solo hay una asignatura
  useEffect(() => {
    const subjectNames = Object.keys(groupedAttempts)
    if(subjectNames.length === 1 && !expandedSubjects[subjectNames[0]]){
      setExpandedSubjects({ [subjectNames[0]]: true })
    }
  }, [attempts])

  function toggleSubject(subjectName){
    setExpandedSubjects(prev => ({
      ...prev,
      [subjectName]: !prev[subjectName]
    }))
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">📊 Historial de intentos</h1>
          <p className="text-gray-600">
            {userName ? `Mostrando intentos de ${userName}` : 'Mostrando intentos globales'}
          </p>
        </div>
        <Link href="/levels" className="btn-ghost">← Volver al inicio</Link>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando historial...</p>
        </div>
      ) : attempts.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center text-gray-500">
          <p className="text-lg">No hay intentos todavía</p>
          <p className="mt-2">Completa un quiz para ver tu historial aquí</p>
          <Link href="/levels">
            <a className="mt-4 inline-block text-blue-600 underline">Ir al inicio</a>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Resumen general */}
          <div className="bg-gradient-to-r from-brand-500 to-brand-600 rounded-xl p-6 text-white shadow-lg">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold">{attempts.length}</div>
                <div className="text-sm opacity-90">Total intentos</div>
              </div>
              <div>
                <div className="text-3xl font-bold">{Object.keys(groupedAttempts).length}</div>
                <div className="text-sm opacity-90">Asignaturas</div>
              </div>
              <div>
                <div className="text-3xl font-bold">
                  {attempts.length > 0 ? (attempts.reduce((acc, a) => acc + (a.score || 0), 0) / attempts.length).toFixed(1) : 0}%
                </div>
                <div className="text-sm opacity-90">Promedio global</div>
              </div>
            </div>
          </div>

          {/* Intentos agrupados por asignatura */}
          {Object.keys(groupedAttempts).sort().map(subjectName => {
            const group = groupedAttempts[subjectName]
            const isExpanded = expandedSubjects[subjectName]
            const totalAttempts = group.attempts.length
            const avgScore = group.attempts.reduce((acc, a) => acc + (a.score || 0), 0) / totalAttempts
            const bestScore = Math.max(...group.attempts.map(a => a.score || 0))
            
            // Ordenar intentos del más reciente al más antiguo
            const sortedAttempts = [...group.attempts].sort((a, b) => 
              new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
            )
            
            return (
              <div key={subjectName} className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                <button
                  onClick={() => toggleSubject(subjectName)}
                  className="w-full px-6 py-5 flex items-center justify-between hover:bg-gradient-to-r hover:from-gray-50 hover:to-white transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className={`transform transition-transform duration-200 text-brand-500 text-xl ${isExpanded ? 'rotate-90' : ''}`}>
                      ▶
                    </div>
                    <div className="text-left">
                      <h3 className="text-xl font-bold text-gray-900">{subjectName}</h3>
                      <div className="flex gap-4 mt-1 text-sm text-gray-600">
                        <span>📚 {totalAttempts} intento{totalAttempts !== 1 ? 's' : ''}</span>
                        <span>📊 Promedio: <span className="font-semibold text-brand-600">{avgScore.toFixed(1)}%</span></span>
                        <span>🏆 Mejor: <span className="font-semibold text-green-600">{bestScore}%</span></span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium text-brand-600">
                      {isExpanded ? 'Ocultar' : 'Mostrar'}
                    </div>
                    <svg 
                      className={`w-5 h-5 text-brand-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="border-t-2 border-gray-200"
                    >
                      <div className="p-6 space-y-3 bg-gradient-to-b from-gray-50 to-white">
                        {sortedAttempts.map((a, idx) => {
                          const scoreColor = a.score >= 80 ? 'text-green-600 bg-green-50' : 
                                            a.score >= 60 ? 'text-blue-600 bg-blue-50' : 
                                            a.score >= 40 ? 'text-yellow-600 bg-yellow-50' : 
                                            'text-red-600 bg-red-50'
                          
                          return (
                            <motion.div 
                              key={a.id || (a.created_at+Math.random())}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className="p-5 bg-white rounded-lg shadow-sm border border-gray-200 hover:border-brand-300 hover:shadow-md transition-all"
                            >
                              <div className="flex justify-between items-center">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-brand-100 text-brand-800">
                                      {a.bank_name || (a.bank?.toUpperCase()) || '—'}
                                    </span>
                                    {idx === 0 && (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                        Más reciente
                                      </span>
                                    )}
                                    {a.score === bestScore && (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                        🏆 Mejor puntuación
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-600 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    {new Date(a.created_at || Date.now()).toLocaleDateString('es-ES', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                </div>
                                <div className={`text-right px-6 py-3 rounded-lg ${scoreColor}`}>
                                  <div className="text-3xl font-bold">{a.score ?? 0}%</div>
                                  <div className="text-xs font-medium opacity-75">Puntuación</div>
                                </div>
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}

          {/* Intentos sin asignatura (legacy) */}
          {unknownAttempts.length > 0 && (
            <div className="bg-white rounded-xl border-2 border-gray-300 overflow-hidden shadow-md">
              <div className="px-6 py-4 bg-gradient-to-r from-gray-100 to-gray-200 border-b border-gray-300">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📦</span>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">Sin asignatura</h3>
                    <p className="text-sm text-gray-600">
                      {unknownAttempts.length} intento{unknownAttempts.length !== 1 ? 's' : ''} antiguo{unknownAttempts.length !== 1 ? 's' : ''} (antes de la actualización)
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-3 bg-gray-50">
                {unknownAttempts.sort((a, b) => 
                  new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
                ).map(a => (
                  <div key={a.id || (a.created_at+Math.random())} className="p-5 bg-white rounded-lg shadow-sm border border-gray-200 hover:border-gray-300 transition-all">
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-800 mb-2">
                          {a.bank_name || (a.bank?.toUpperCase()) || '—'}
                        </span>
                        <div className="text-sm text-gray-600 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {new Date(a.created_at || Date.now()).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                      <div className="text-right px-6 py-3 rounded-lg bg-gray-100">
                        <div className="text-3xl font-bold text-gray-700">{a.score ?? 0}%</div>
                        <div className="text-xs font-medium text-gray-600">Puntuación</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
