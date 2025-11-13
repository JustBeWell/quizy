import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { getToken } from '../../lib/auth-client'

export default function SubjectBanksPage() {
  const router = useRouter()
  const { subjectId } = router.query
  const [subject, setSubject] = useState(null)
  const [banks, setBanks] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filteredBanks, setFilteredBanks] = useState([])
  
  // Nuevos estados para filtros
  const [sortBy, setSortBy] = useState('name') // 'name', 'date-new', 'date-old', 'questions-asc', 'questions-desc'
  const [minQuestions, setMinQuestions] = useState('')
  const [maxQuestions, setMaxQuestions] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  
  // Estados para favoritos
  const [favorites, setFavorites] = useState([])
  const [favoritesLoading, setFavoritesLoading] = useState({}) // { bankId: boolean }

  useEffect(() => {
    // Check authentication
    const user = localStorage.getItem('quiz_user')
    if (!user) {
      router.push('/auth')
      return
    }

    if (subjectId) {
      loadSubjectAndBanks()
      loadFavorites()
    }
  }, [subjectId])

  useEffect(() => {
    // Filter and sort banks
    let filtered = [...banks]
    
    // Aplicar búsqueda por texto
    if (search.trim()) {
      filtered = filtered.filter(bank =>
        bank.name.toLowerCase().includes(search.toLowerCase()) ||
        bank.id.toLowerCase().includes(search.toLowerCase())
      )
    }
    
    // Aplicar filtro por número de preguntas
    if (minQuestions !== '') {
      const min = parseInt(minQuestions)
      filtered = filtered.filter(bank => bank.count >= min)
    }
    
    if (maxQuestions !== '') {
      const max = parseInt(maxQuestions)
      filtered = filtered.filter(bank => bank.count <= max)
    }
    
    // Aplicar ordenamiento
    switch (sortBy) {
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'date-new':
        filtered.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
        break
      case 'date-old':
        filtered.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0))
        break
      case 'questions-asc':
        filtered.sort((a, b) => a.count - b.count)
        break
      case 'questions-desc':
        filtered.sort((a, b) => b.count - a.count)
        break
    }
    
    setFilteredBanks(filtered)
  }, [search, banks, sortBy, minQuestions, maxQuestions])

  async function loadSubjectAndBanks() {
    try {
      // Load subject info from database by slug
      const subjectRes = await fetch('/api/subjects')
      const subjectData = await subjectRes.json()
      
      if (subjectRes.ok && subjectData.subjects) {
        const foundSubject = subjectData.subjects.find(s => s.slug === subjectId)
        if (foundSubject) {
          setSubject(foundSubject)
        } else {
          // Fallback if subject not found in DB
          setSubject({ name: subjectId.toUpperCase().replace(/-/g, ' '), slug: subjectId })
        }
      }

      // Load banks for this subject using the slug
      const banksRes = await fetch(`/api/banks?subject=${encodeURIComponent(subjectId)}`)
      const banksData = await banksRes.json()
      
      if (banksRes.ok) {
        setBanks(banksData || [])
        setFilteredBanks(banksData || [])
      } else {
        console.error('Error loading banks:', banksData)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadFavorites() {
    try {
      const token = getToken()
      if (!token) {
        console.log('No hay token, usuario no autenticado')
        return
      }
      
      const res = await fetch('/api/favorites', {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (res.status === 401) {
        // Token inválido o expirado - limpiar y redirigir
        console.log('Token inválido, limpiando sesión')
        localStorage.removeItem('quiz_token')
        return
      }
      
      if (res.ok) {
        const data = await res.json()
        setFavorites(data.favorites || [])
      }
    } catch (error) {
      console.error('Error loading favorites:', error)
    }
  }

  async function toggleFavorite(e, bankId) {
    e.preventDefault() // Evitar que el Link navegue
    e.stopPropagation()
    
    if (favoritesLoading[bankId]) return
    
    try {
      const token = getToken()
      if (!token) {
        alert('Debes iniciar sesión para guardar favoritos')
        return
      }
      
      setFavoritesLoading(prev => ({ ...prev, [bankId]: true }))
      
      const isFavorite = favorites.some(f => f.bank_id === bankId)
      const method = isFavorite ? 'DELETE' : 'POST'
      
      const res = await fetch('/api/favorites', {
        method,
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          bank_id: bankId, 
          subject_slug: subjectId 
        })
      })
      
      if (res.status === 401) {
        // Token inválido o expirado
        alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.')
        localStorage.removeItem('quiz_token')
        router.push('/auth')
        return
      }
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Error al actualizar favorito')
      }
      
      // Actualizar lista de favoritos
      if (isFavorite) {
        setFavorites(favorites.filter(f => f.bank_id !== bankId))
      } else {
        await loadFavorites() // Recargar para obtener datos completos
      }
    } catch (err) {
      console.error('Error toggling favorite:', err)
      alert(err.message || 'Error al actualizar favorito')
    } finally {
      setFavoritesLoading(prev => ({ ...prev, [bankId]: false }))
    }
  }

  function clearSearch() {
    setSearch('')
  }
  
  function clearFilters() {
    setSearch('')
    setSortBy('name')
    setMinQuestions('')
    setMaxQuestions('')
  }
  
  const hasActiveFilters = search || minQuestions !== '' || maxQuestions !== '' || sortBy !== 'name'
  
  // Helper para verificar si un banco está en favoritos
  const isBankFavorite = (bankId) => {
    return favorites.some(f => f.bank_id === bankId)
  }
  
  // Calcular estadísticas
  const stats = {
    total: banks.length,
    totalQuestions: banks.reduce((sum, b) => sum + b.count, 0),
    avgQuestions: banks.length > 0 ? Math.round(banks.reduce((sum, b) => sum + b.count, 0) / banks.length) : 0,
    minQuestions: banks.length > 0 ? Math.min(...banks.map(b => b.count)) : 0,
    maxQuestions: banks.length > 0 ? Math.max(...banks.map(b => b.count)) : 0
  }

  if (loading) {
    return (
      <div className="container py-8">
        <p className="text-center text-gray-600">Cargando recopilatorios...</p>
      </div>
    )
  }

  return (
    <div className="container py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-600 dark:text-gray-400">
        <Link href="/levels" className="hover:text-blue-600 dark:hover:text-blue-400">Inicio</Link>
        <span className="mx-2">/</span>
        {subject?.level_slug && (
          <>
            <Link href={`/levels/${subject.level_slug}`} className="hover:text-blue-600 dark:hover:text-blue-400">
              {subject.level_name || subject.level_slug}
            </Link>
            <span className="mx-2">/</span>
          </>
        )}
        <span className="text-gray-900 dark:text-white font-medium">{subject?.name || subjectId}</span>
      </nav>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">{subject?.name || subjectId}</h1>
          <p className="text-gray-600">Selecciona un cuestionario para empezar a practicar</p>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-sm text-gray-600">📚 Total</div>
          <div className="text-2xl font-bold text-brand-600">{stats.total}</div>
          <div className="text-xs text-gray-500">cuestionarios</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-sm text-gray-600">❓ Preguntas</div>
          <div className="text-2xl font-bold text-blue-600">{stats.totalQuestions}</div>
          <div className="text-xs text-gray-500">en total</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-sm text-gray-600">📊 Promedio</div>
          <div className="text-2xl font-bold text-purple-600">{stats.avgQuestions}</div>
          <div className="text-xs text-gray-500">preguntas/quiz</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-sm text-gray-600">⬇️ Mínimo</div>
          <div className="text-2xl font-bold text-orange-600">{stats.minQuestions}</div>
          <div className="text-xs text-gray-500">preguntas</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-sm text-gray-600">⬆️ Máximo</div>
          <div className="text-2xl font-bold text-green-600">{stats.maxQuestions}</div>
          <div className="text-xs text-gray-500">preguntas</div>
        </div>
      </div>

      {/* Search bar and filters */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Buscar cuestionarios por nombre..."
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
          <button 
            type="button" 
            onClick={() => setShowFilters(!showFilters)} 
            className={`px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors ${showFilters ? 'bg-brand-50 border-brand-500 text-brand-700' : ''}`}
          >
            {showFilters ? '✕ Cerrar filtros' : '⚙️ Filtros avanzados'}
          </button>
          {hasActiveFilters && (
            <button 
              type="button" 
              onClick={clearFilters} 
              className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
            >
              🗑️ Limpiar todo
            </button>
          )}
        </div>
        
        {/* Filtros avanzados */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Ordenar por */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📋 Ordenar por
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                >
                  <option value="name">Nombre (A-Z)</option>
                  <option value="date-new">Más reciente primero</option>
                  <option value="date-old">Más antiguo primero</option>
                  <option value="questions-desc">Más preguntas primero</option>
                  <option value="questions-asc">Menos preguntas primero</option>
                </select>
              </div>
              
              {/* Mínimo de preguntas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ⬇️ Mínimo de preguntas
                </label>
                <input
                  type="number"
                  value={minQuestions}
                  onChange={(e) => setMinQuestions(e.target.value)}
                  placeholder="Ej: 10"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
              </div>
              
              {/* Máximo de preguntas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ⬆️ Máximo de preguntas
                </label>
                <input
                  type="number"
                  value={maxQuestions}
                  onChange={(e) => setMaxQuestions(e.target.value)}
                  placeholder="Ej: 50"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
              </div>
            </div>
            
            {/* Información de filtros activos */}
            <div className="text-sm text-gray-600 bg-white p-3 rounded border border-gray-200">
              <span className="font-medium">📊 Mostrando:</span> {filteredBanks.length} de {banks.length} cuestionarios
              {minQuestions && <span className="ml-2">• Min: {minQuestions} preguntas</span>}
              {maxQuestions && <span className="ml-2">• Max: {maxQuestions} preguntas</span>}
            </div>
          </motion.div>
        )}
      </div>

      {/* Banks grid */}
      {filteredBanks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">
            {search ? 'No se encontraron recopilatorios con ese criterio' : 'No hay recopilatorios disponibles para esta asignatura'}
          </p>
          {subject?.level_slug ? (
            <Link href={`/levels/${subject.level_slug}`}>
              <a className="text-blue-600 dark:text-blue-400 underline mt-2 inline-block">← Volver a {subject.level_name}</a>
            </Link>
          ) : (
            <Link href="/levels">
              <a className="text-blue-600 dark:text-blue-400 underline mt-2 inline-block">← Volver al inicio</a>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBanks.map((bank, idx) => (
            <motion.div
              key={bank.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ scale: 1.03, y: -4 }}
              className="group bg-white rounded-xl border-2 border-gray-200 hover:border-green-500 hover:shadow-lg transition-all"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <Link href={`/quiz/${bank.id}?subject=${subjectId}`} legacyBehavior>
                    <a className="flex-1">
                      <h3 className="text-xl font-semibold group-hover:text-green-600 transition-colors">
                        {bank.name}
                      </h3>
                    </a>
                  </Link>
                  
                  {/* Botón de favorito dentro de la card */}
                  <button
                    onClick={(e) => toggleFavorite(e, bank.id)}
                    disabled={favoritesLoading[bank.id]}
                    className={`ml-3 text-2xl transition-all ${
                      isBankFavorite(bank.id) 
                        ? 'text-yellow-500 hover:text-yellow-600' 
                        : 'text-gray-300 hover:text-yellow-500'
                    } disabled:opacity-50`}
                    title={isBankFavorite(bank.id) ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                  >
                    {favoritesLoading[bank.id] ? '⏳' : isBankFavorite(bank.id) ? '★' : '☆'}
                  </button>
                </div>
                
                <div className="flex justify-between items-center">
                  <Link href={`/quiz/${bank.id}?subject=${subjectId}`} legacyBehavior>
                    <a className="text-green-600 text-sm font-medium group-hover:text-green-700 transition-colors">
                      Comenzar quiz →
                    </a>
                  </Link>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                    {bank.count} preguntas
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Back button */}
      <div className="mt-8">
        {subject?.level_slug ? (
          <Link href={`/levels/${subject.level_slug}`} legacyBehavior>
            <motion.a
              whileHover={{ x: -4 }}
              className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Volver a {subject.level_name}
            </motion.a>
          </Link>
        ) : (
          <Link href="/levels" legacyBehavior>
            <motion.a
              whileHover={{ x: -4 }}
              className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Volver al inicio
            </motion.a>
          </Link>
        )}
      </div>
    </div>
  )
}
