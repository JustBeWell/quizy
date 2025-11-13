import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function LevelSubjects() {
  const [subjects, setSubjects] = useState([])
  const [levelInfo, setLevelInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { level } = router.query

  useEffect(() => {
    if (level) {
      fetchSubjects()
    }
  }, [level])

  const fetchSubjects = async () => {
    try {
      // Fetch subjects for this level
      const res = await fetch(`/api/subjects?level=${level}`)
      const data = await res.json()
      
      if (data.subjects && data.subjects.length > 0) {
        setSubjects(data.subjects)
        setLevelInfo({
          name: data.subjects[0].level_name,
          slug: data.subjects[0].level_slug
        })
      } else {
        // Try to get level info even if no subjects
        const levelRes = await fetch('/api/levels')
        const levelData = await levelRes.json()
        const currentLevel = levelData.levels.find(l => l.slug === level)
        if (currentLevel) {
          setLevelInfo({
            name: currentLevel.name,
            slug: currentLevel.slug
          })
        }
      }
    } catch (error) {
      console.error('Error fetching subjects:', error)
    } finally {
      setLoading(false)
    }
  }

  const getLevelColor = (slug) => {
    switch(slug) {
      case 'eso': return 'blue'
      case 'bachillerato': return 'purple'
      case 'universitario': return 'green'
      default: return 'gray'
    }
  }

  const color = levelInfo ? getLevelColor(levelInfo.slug) : 'gray'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <main className="container mx-auto px-4 pt-4 pb-8 max-w-7xl">
        {/* Back button */}
        <Link href="/levels" className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-6 transition-colors">
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver a niveles
        </Link>

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
            {levelInfo?.name || 'Cargando...'}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Selecciona una asignatura para comenzar a practicar
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando asignaturas...</p>
          </div>
        ) : subjects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              No hay asignaturas disponibles en este nivel
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {subjects.map((subject) => (
              <Link
                key={subject.id}
                href={`/subjects/${subject.slug}`}
                className={`group bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-transparent hover:border-${color}-500`}
              >
                <div className="p-6">
                  {/* Icon */}
                  <div className={`w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-${color}-500 to-${color}-600 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white text-center mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {subject.name}
                  </h3>

                  {/* Description */}
                  {subject.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 text-center line-clamp-2 mb-4">
                      {subject.description}
                    </p>
                  )}

                  {/* Arrow */}
                  <div className="text-center mt-4">
                    <span className={`inline-flex items-center text-${color}-600 dark:text-${color}-400 font-medium text-sm group-hover:translate-x-1 transition-transform duration-300`}>
                      Ver tests
                      <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
