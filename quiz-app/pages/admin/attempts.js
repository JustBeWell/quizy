import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { getUser, isAdmin } from '../../lib/auth-client'

export default function AdminAttempts() {
  const router = useRouter()
  const [attempts, setAttempts] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedSubject, setSelectedSubject] = useState(null) // Will store {id, name}
  const [selectedUser, setSelectedUser] = useState('')
  const [userName, setUserName] = useState('')

  useEffect(() => {
    const user = getUser()
    
    if (!user || !isAdmin()) {
      router.push('/levels')
      return
    }

    setUserName(user.name)
    loadData()
  }, [router])

  async function loadData() {
    try {
      const [attemptsRes, subjectsRes] = await Promise.all([
        fetch('/api/attempts'),
        fetch('/api/subjects')
      ])

      const attemptsData = await attemptsRes.json()
      const subjectsData = await subjectsRes.json()

      console.log('Loaded data:', {
        attempts: attemptsData.length,
        subjects: subjectsData.subjects?.length,
        sampleAttempt: attemptsData[0],
        sampleSubject: subjectsData.subjects?.[0],
        allAttemptSubjectIds: attemptsData.map(a => ({ id: a.id, subject_id: a.subject_id, type: typeof a.subject_id }))
      })

      setAttempts(attemptsData || [])
      setSubjects(subjectsData.subjects || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAttempts = attempts.filter(attempt => {
    // If no subject filter, pass
    if (!selectedSubject) return true
    
    // If no user filter, or user matches
    if (selectedUser && !attempt.user_name?.toLowerCase().includes(selectedUser.toLowerCase())) {
      return false
    }
    
    // Force both to numbers for comparison
    const attemptSubjectId = Number(attempt.subject_id)
    const selectedSubjectId = Number(selectedSubject.id)
    
    // Match by ID (forced to number) OR by name
    const matchById = attemptSubjectId === selectedSubjectId
    const matchByName = attempt.subject_name === selectedSubject.name
    
    console.log('Filter check:', {
      attemptId: attempt.id,
      bank: attempt.bank,
      attempt_subject_id: attempt.subject_id,
      attempt_subject_id_forced: attemptSubjectId,
      attempt_subject_name: attempt.subject_name,
      selected_id: selectedSubject.id,
      selected_id_forced: selectedSubjectId,
      selected_name: selectedSubject.name,
      matchById,
      matchByName,
      finalMatch: matchById || matchByName
    })
    
    return matchById || matchByName
  })

  const uniqueUsers = [...new Set(attempts.map(a => a.user_name))].filter(Boolean)

  if (loading) {
    return (
      <div className="container py-8">
        <p className="text-center text-gray-600">Cargando intentos...</p>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/admin" className="text-purple-600 hover:text-purple-700 text-sm">
              ← Panel Admin
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-sm text-gray-600">Intentos</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">📊 Gestión de Intentos</h1>
          <p className="text-gray-600">Ver todos los intentos de quiz realizados</p>
        </div>
        <Link href="/admin">
          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
          >
            ← Volver al panel
          </motion.a>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <h3 className="font-semibold mb-3">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtrar por asignatura
            </label>
            <select
              value={selectedSubject?.id || ''}
              onChange={(e) => {
                const subjectId = e.target.value
                if (subjectId === '' || !subjectId) {
                  setSelectedSubject(null)
                  console.log('Subject filter cleared')
                } else {
                  const subject = subjects.find(s => String(s.id) === String(subjectId))
                  if (subject) {
                    const filterValue = {
                      id: Number(subject.id),
                      name: subject.name
                    }
                    console.log('Subject filter set:', filterValue)
                    setSelectedSubject(filterValue)
                  }
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            >
              <option value="">Todas las asignaturas</option>
              {subjects.map(subject => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar por usuario
            </label>
            <input
              type="text"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              placeholder="Nombre de usuario..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="mt-3 text-sm text-gray-600">
          Mostrando <strong>{filteredAttempts.length}</strong> de <strong>{attempts.length}</strong> intentos
        </div>
        
        {(selectedSubject || selectedUser) && (
          <button
            onClick={() => {
              setSelectedSubject(null)
              setSelectedUser('')
            }}
            className="mt-3 text-sm text-blue-600 hover:text-blue-700"
          >
            ✕ Limpiar filtros
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600">Total Intentos</p>
          <p className="text-2xl font-bold text-blue-600">{filteredAttempts.length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600">Usuarios Únicos</p>
          <p className="text-2xl font-bold text-purple-600">{uniqueUsers.length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600">Puntuación Media</p>
          <p className="text-2xl font-bold text-green-600">
            {filteredAttempts.length > 0
              ? Math.round(filteredAttempts.reduce((acc, a) => acc + (a.score || 0), 0) / filteredAttempts.length)
              : 0}%
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600">Mejor Puntuación</p>
          <p className="text-2xl font-bold text-yellow-600">
            {filteredAttempts.length > 0
              ? Math.max(...filteredAttempts.map(a => a.score || 0))
              : 0}%
          </p>
        </div>
      </div>

      {/* Attempts Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Banco
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Asignatura
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Puntuación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAttempts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    No se encontraron intentos
                  </td>
                </tr>
              ) : (
                filteredAttempts.map((attempt, idx) => (
                  <tr key={attempt.id || idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {attempt.user_name || 'Anónimo'}
                      </div>
                      {attempt.user_email && (
                        <div className="text-sm text-gray-500">{attempt.user_email}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{attempt.bank_name || attempt.bank?.toUpperCase() || '—'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {attempt.subject_name ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {attempt.subject_name}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-brand-600">{attempt.score}%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(attempt.created_at || Date.now()).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
