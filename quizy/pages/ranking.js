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
  const [activeTab, setActiveTab] = useState('streaks')
  const [streakRanking, setStreakRanking] = useState([])
  const [loadingStreaks, setLoadingStreaks] = useState(true)
  
  useEffect(() => {
    // Obtener usuario actual
    try {
      const user = localStorage.getItem('quiz_user')
      if(user) setCurrentUser(user)
    } catch(e) {}
    
    loadLevelsAndRankings()
    loadStreakRanking()
  }, [])

  async function loadStreakRanking() {
    setLoadingStreaks(true)
    try {
      const response = await fetch('/api/streak-ranking')
      if (response.ok) {
        const data = await response.json()
        setStreakRanking(data.ranking || [])
      }
    } catch (error) {
      console.error('Error loading streak ranking:', error)
    } finally {
      setLoadingStreaks(false)
    }
  }

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
          <h2 className="text-3xl font-bold mb-2">🏆 Rankings Globales</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Mejores rachas y puntuaciones por nivel académico
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
            {/* Tab de Rachas */}
            <button
              onClick={() => setActiveTab('streaks')}
              className={`px-6 py-3 font-medium transition-all border-b-2 ${
                activeTab === 'streaks'
                  ? 'border-orange-600 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              🔥 Mejores Rachas
            </button>
            
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

          {/* Contenido del tab de Rachas */}
          {activeTab === 'streaks' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {loadingStreaks ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando rachas...</p>
                </div>
              ) : streakRanking.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700">
                  <div className="text-6xl mb-4">🔥</div>
                  <p className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                    Aún no hay rachas registradas
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    ¡Accede todos los días y construye tu racha!
                  </p>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl shadow-lg overflow-hidden border-2 border-orange-200 dark:border-orange-800">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-orange-500 to-red-600 px-6 py-6">
                    <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                      🔥 Top 5 Mejores Rachas
                    </h3>
                    <p className="text-white/80 mt-1">
                      Usuarios con más días consecutivos conectados
                    </p>
                  </div>
                  
                  {/* Lista de usuarios */}
                  <div className="divide-y divide-orange-200 dark:divide-orange-800">
                    {streakRanking.map((entry, index) => {
                      const isCurrentUser = currentUser && entry.name === currentUser
                      
                      return (
                        <motion.div
                          key={entry.name}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`px-6 py-5 flex items-center justify-between ${
                            isCurrentUser 
                              ? 'bg-orange-100 dark:bg-orange-900/40 border-l-4 border-orange-500' 
                              : 'bg-white dark:bg-gray-800 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                          } transition-colors`}
                        >
                          <div className="flex items-center gap-4 flex-1">
                            {/* Medalla/Posición */}
                            <div
                              className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0 ${
                                index === 0
                                  ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg'
                                  : index === 1
                                  ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white shadow-lg'
                                  : index === 2
                                  ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-lg'
                                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {index < 3 ? getMedalIcon(index) : entry.position}
                            </div>
                            
                            {/* Info usuario */}
                            <div className="flex-1 min-w-0">
                              <p className={`font-bold text-xl mb-1 ${
                                isCurrentUser 
                                  ? 'text-orange-700 dark:text-orange-400' 
                                  : 'text-gray-900 dark:text-white'
                              } truncate flex items-center gap-2`}>
                                {entry.name}
                                {isCurrentUser && (
                                  <span className="text-xs font-normal px-2 py-1 bg-orange-600 text-white rounded-full">
                                    Tú
                                  </span>
                                )}
                              </p>
                              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                                <span className="flex items-center gap-1">
                                  🏆 Récord: <strong className="text-orange-600 dark:text-orange-400">{entry.longestStreak}</strong> días
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Racha actual */}
                          <div className="text-right ml-4 flex-shrink-0">
                            <div className="flex items-center gap-2">
                              <span className="text-4xl">🔥</span>
                              <div>
                                <div className="text-4xl font-bold text-orange-600 dark:text-orange-400">
                                  {entry.currentStreak}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                  días seguidos
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                  
                  {/* Footer motivacional */}
                  <div className="bg-orange-100 dark:bg-orange-900/30 px-6 py-4 text-center border-t border-orange-200 dark:border-orange-800">
                    <p className="text-sm text-orange-800 dark:text-orange-300 font-medium">
                      💡 ¡Accede cada día para mantener tu racha y subir en el ranking!
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Contenido del tab activo (niveles académicos) */}
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
