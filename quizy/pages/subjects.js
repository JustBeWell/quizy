import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { getUser, isAdmin as checkIsAdmin } from '../lib/auth-client'

export default function SubjectsPage() {
  const router = useRouter()
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isAdminUser, setIsAdminUser] = useState(false)

  useEffect(() => {
    // Check authentication using JWT
    const user = getUser()
    
    if (!user) {
      router.replace('/auth')
      return
    }

    // Check if user is admin from JWT
    if (checkIsAdmin()) {
      setIsAdminUser(true)
    }

    loadSubjects()
  }, [])

  async function loadSubjects(searchTerm = '') {
    try {
      const url = searchTerm 
        ? `/api/subjects?search=${encodeURIComponent(searchTerm)}`
        : '/api/subjects'
      
      const res = await fetch(url)
      const data = await res.json()
      
      if (res.ok) {
        setSubjects(data.subjects || [])
      } else {
        console.error('Error loading subjects:', data)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  function handleSearch(e) {
    e.preventDefault()
    loadSubjects(search)
  }

  function clearSearch() {
    setSearch('')
    loadSubjects('')
  }

  if (loading) {
    return (
      <div className="container py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando asignaturas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">📚 Explora Asignaturas</h1>
          <p className="text-gray-600">Selecciona una asignatura para acceder a sus cuestionarios y comenzar a practicar</p>
        </div>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre de asignatura..."
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
          <button type="submit" className="px-4 py-2 bg-brand-700 dark:bg-brand-500 text-white rounded-lg hover:bg-brand-800 dark:hover:bg-brand-600 transition-colors font-semibold">
            🔍 Buscar
          </button>
          {search && (
            <button type="button" onClick={clearSearch} className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors">
              ✕ Limpiar
            </button>
          )}
        </div>
      </form>

      {/* Subjects grid */}
      {subjects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg mb-2">No se encontraron asignaturas</p>
          <p className="text-gray-500 text-sm">Prueba con otros términos de búsqueda</p>
          {isAdminUser && (
            <Link href="/admin/subjects" legacyBehavior>
              <a className="text-brand-600 hover:text-brand-700 underline mt-4 inline-block">+ Crear nueva asignatura</a>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject, idx) => (
            <Link key={subject.id} href={`/subjects/${subject.slug}`} legacyBehavior>
              <motion.a
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ scale: 1.03, y: -4 }}
                whileTap={{ scale: 0.98 }}
                className="block p-6 bg-white rounded-xl border-2 border-gray-200 hover:border-brand-500 hover:shadow-lg transition-all cursor-pointer"
              >
                <h3 className="text-xl font-semibold mb-2">{subject.name}</h3>
                {subject.description && (
                  <p className="text-gray-600 text-sm line-clamp-3">{subject.description}</p>
                )}
                <div className="mt-4 text-brand-600 text-sm font-medium flex items-center gap-2">
                  <span>Explorar cuestionarios</span>
                  <span>→</span>
                </div>
              </motion.a>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
