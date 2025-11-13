import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function Ranking(){
  const [rankings, setRankings] = useState({
    eso: [],
    bachillerato: [],
    universitario: []
  })
  const [levels, setLevels] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)
  const [activeTab, setActiveTab] = useState('eso')
  
  useEffect(() => {
    // Obtener usuario actual
    try {
      const user = localStorage.getItem('quiz_user')
      if(user) setCurrentUser(user)
    } catch(e) {}
    
    loadLevelsAndRankings()
  }, [])

  async function loadLevelsAndRankings() {
    setLoading(true)
    try {
      // Cargar niveles académicos
      const levelsRes = await fetch('/api/levels')
      const levelsData = await levelsRes.json()
      setLevels(levelsData.levels || [])
      
      // Cargar asignaturas para obtener level_id
      const subjectsRes = await fetch('/api/subjects')
      const subjectsData = await subjectsRes.json()
      const subjects = subjectsData.subjects || []
      
      // Cargar ranking global
      const rankingRes = await fetch('/api/ranking')
      const rankingData = await rankingRes.json()
      
      // Agrupar por nivel académico -> asignatura -> test -> usuario
      const grouped = {
        eso: {},
        bachillerato: {},
        universitario: {}
      }
      
      rankingData.forEach(entry => {
        const subject = subjects.find(s => s.id === entry.subject_id || s.slug === entry.subject_slug)
        if (!subject || !subject.level_slug) return
        
        const level = subject.level_slug
        const subjectKey = subject.slug
        const bankKey = entry.bank
        const bankName = entry.bank_name || entry.bank
        const userName = entry.name
        
        // Inicializar estructura por asignatura
        if (!grouped[level][subjectKey]) {
          grouped[level][subjectKey] = {
            name: subject.name,
            slug: subject.slug,
            tests: {}
          }
        }
        
        // Usar bank_name como clave única para agrupar el mismo test
        // (puede haber múltiples 'bank' con el mismo nombre de test)
        const testKey = `${subjectKey}_${bankName}`
        if (!grouped[level][subjectKey].tests[testKey]) {
          grouped[level][subjectKey].tests[testKey] = {
            bankName: bankName,
            bank: bankKey,
            bestAttempts: {} // Mejor intento por usuario
          }
        }
        
        // Guardar solo el mejor intento del usuario en este test específico
        const currentBest = grouped[level][subjectKey].tests[testKey].bestAttempts[userName]
        const score = entry.score || 0
        
        if (!currentBest || score > currentBest.score) {
          grouped[level][subjectKey].tests[testKey].bestAttempts[userName] = {
            name: userName,
            score: score,
            date: entry.created_at
          }
        }
      })
      
      // Convertir a formato final: asignatura -> test -> usuarios rankeados
      const finalRankings = {}
      
      Object.keys(grouped).forEach(level => {
        finalRankings[level] = []
        
        Object.keys(grouped[level]).forEach(subjectKey => {
          const subjectData = grouped[level][subjectKey]
          
          // Por cada test en esta asignatura
          Object.keys(subjectData.tests).forEach(bankKey => {
            const testData = subjectData.tests[bankKey]
            
            // Convertir a array y ordenar por puntuación
            const usersArray = Object.values(testData.bestAttempts)
              .sort((a, b) => b.score - a.score)
              .slice(0, 10) // Top 10 por test
            
            if (usersArray.length > 0) {
              finalRankings[level].push({
                subjectName: subjectData.name,
                subjectSlug: subjectData.slug,
                bankName: testData.bankName,
                bank: testData.bank,
                users: usersArray
              })
            }
          })
        })
        
        // Ordenar tests por número de participantes (más activos primero)
        finalRankings[level].sort((a, b) => b.users.length - a.users.length)
      })
      
      setRankings(finalRankings)
    } catch (e) {
      console.error('Error cargando rankings:', e)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr) => {
    if(!dateStr) return ''
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch(e) {
      return dateStr
    }
  }

  const getMedalIcon = (position) => {
    if(position === 0) return '🥇'
    if(position === 1) return '🥈'
    if(position === 2) return '🥉'
    return `${position + 1}°`
  }

  const getLevelIcon = (slug) => {
    if (slug === 'eso') return '📚'
    if (slug === 'bachillerato') return '🎓'
    if (slug === 'universitario') return '🏛️'
    return '📊'
  }

  const getLevelColor = (slug) => {
    if (slug === 'eso') return 'blue'
    if (slug === 'bachillerato') return 'purple'
    if (slug === 'universitario') return 'green'
    return 'gray'
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold mb-2">🏆 Rankings por Nivel Académico</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Top 10 estudiantes por puntuación total en cada nivel
          </p>
        </div>
        <Link href="/levels" className="btn-ghost">← Volver al inicio</Link>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando clasificaciones...</p>
        </div>
      ) : (
        <>
          {/* Tabs de niveles */}
          <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
            {levels.map(level => {
              const color = getLevelColor(level.slug)
              const isActive = activeTab === level.slug
              return (
                <button
                  key={level.slug}
                  onClick={() => setActiveTab(level.slug)}
                  className={`px-6 py-3 font-medium transition-all border-b-2 ${
                    isActive
                      ? `border-${color}-600 text-${color}-600 dark:text-${color}-400 bg-${color}-50 dark:bg-${color}-900/20`
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  {getLevelIcon(level.slug)} {level.name}
                </button>
              )
            })}
          </div>

          {/* Contenido del tab activo */}
          {levels.map(level => {
            if (activeTab !== level.slug) return null
            
            const subjectRankings = rankings[level.slug] || []
            const color = getLevelColor(level.slug)

            return (
              <motion.div
                key={level.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {subjectRankings.length === 0 ? (
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700">
                    <div className="text-6xl mb-4">{getLevelIcon(level.slug)}</div>
                    <p className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                      Aún no hay puntuaciones en {level.name}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      ¡Sé el primero en completar un cuestionario y lidera el ranking!
                    </p>
                    <Link href={`/levels/${level.slug}`}>
                      <a className="mt-6 inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Ver asignaturas de {level.name}
                      </a>
                    </Link>
                  </div>
                ) : (
                  <>
                    {/* Iterar por cada test */}
                    {subjectRankings.map((testRanking, testIndex) => (
                      <motion.div
                        key={`${testRanking.subjectSlug}-${testRanking.bank}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: testIndex * 0.05 }}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700"
                      >
                        {/* Header del test */}
                        <div className={`bg-gradient-to-r from-${color}-500 to-${color}-600 px-6 py-4`}>
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div>
                              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                📝 {testRanking.bankName}
                              </h3>
                              <p className="text-sm text-white/80 mt-1">
                                {testRanking.subjectName}
                              </p>
                            </div>
                            <Link href={`/subjects/${testRanking.subjectSlug}`}>
                              <a className="text-sm text-white/80 hover:text-white underline">
                                Ver test →
                              </a>
                            </Link>
                          </div>
                        </div>
                        
                        {/* Lista de usuarios - Top 10 en este test */}
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                          {testRanking.users.map((user, userIndex) => {
                            const isCurrentUser = currentUser && user.name === currentUser
                            
                            return (
                              <motion.div
                                key={user.name}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: userIndex * 0.03 }}
                                className={`px-6 py-4 flex items-center justify-between ${
                                  isCurrentUser 
                                    ? `bg-${color}-50 dark:bg-${color}-900/20 border-l-4 border-${color}-500` 
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                } transition-colors`}
                              >
                                <div className="flex items-center gap-4 flex-1">
                                  {/* Posición */}
                                  <div className="text-2xl font-bold w-12 text-center flex-shrink-0">
                                    {getMedalIcon(userIndex)}
                                  </div>
                                  
                                  {/* Info usuario */}
                                  <div className="flex-1 min-w-0">
                                    <p className={`font-bold text-lg ${
                                      isCurrentUser 
                                        ? `text-${color}-700 dark:text-${color}-400` 
                                        : 'text-gray-900 dark:text-white'
                                    } truncate`}>
                                      {user.name}
                                      {isCurrentUser && (
                                        <span className="ml-2 text-xs font-normal px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                                          Tú
                                        </span>
                                      )}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                      {formatDate(user.date)}
                                    </p>
                                  </div>
                                </div>

                                {/* Puntuación */}
                                <div className="text-right ml-4 flex-shrink-0">
                                  <div className={`text-3xl font-bold text-${color}-600 dark:text-${color}-400`}>
                                    {user.score}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                    puntos
                                  </div>
                                </div>
                              </motion.div>
                            )
                          })}
                        </div>
                      </motion.div>
                    ))}
                  </>
                )}
              </motion.div>
            )
          })}
        </>
      )}
    </div>
  )
}
