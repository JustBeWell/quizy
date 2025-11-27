import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

export default function Levels() {
  const [levels, setLevels] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchLevels()
  }, [])

  const fetchLevels = async () => {
    try {
      const res = await fetch('/api/levels')
      
      if (!res.ok) {
        throw new Error('Error al cargar niveles')
      }
      
      const data = await res.json()
      setLevels(data.levels || [])
    } catch (error) {
      console.error('Error fetching levels:', error)
      setLevels([])
    } finally {
      setLoading(false)
    }
  }

  const handleLevelClick = (slug) => {
    router.push(`/levels/${slug}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <main className="container mx-auto px-4 pt-4 pb-8 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Selecciona tu Nivel Académico
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Elige tu nivel educativo para acceder a las asignaturas y tests disponibles
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando niveles...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {levels.map((level) => (
              <div
                key={level.id}
                onClick={() => handleLevelClick(level.slug)}
                className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden border-2 border-transparent hover:border-blue-500"
              >
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 group-hover:from-blue-500/10 group-hover:to-purple-500/10 transition-all duration-300"></div>
                
                <div className="relative p-8">
                  {/* Icon */}
                  <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    {level.slug === 'eso' && (
                      <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    )}
                    {level.slug === 'bachillerato' && (
                      <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    )}
                    {level.slug === 'universitario' && (
                      <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    )}
                  </div>

                  {/* Title */}
                  <h2 className="text-2xl font-bold mb-3 text-gray-800 dark:text-white text-center">
                    {level.name}
                  </h2>

                  {/* Description */}
                  <p className="text-gray-600 dark:text-gray-300 text-center mb-6 text-sm">
                    {level.description}
                  </p>

                  {/* Stats */}
                  <div className="flex justify-center gap-6 text-sm">
                    <div className="text-center">
                      <div className="font-bold text-blue-600 dark:text-blue-400 text-xl">
                        {level.subjectCount}
                      </div>
                      <div className="text-gray-500 dark:text-gray-400">
                        {level.subjectCount === 1 ? 'Asignatura' : 'Asignaturas'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-purple-600 dark:text-purple-400 text-xl">
                        {level.testCount}
                      </div>
                      <div className="text-gray-500 dark:text-gray-400">
                        {level.testCount === 1 ? 'Test' : 'Tests'}
                      </div>
                    </div>
                  </div>

                  {/* Arrow indicator */}
                  <div className="mt-6 text-center">
                    <span className="inline-flex items-center text-blue-600 dark:text-blue-400 font-medium group-hover:translate-x-2 transition-transform duration-300">
                      Explorar
                      <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && levels.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              No hay niveles académicos disponibles
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
