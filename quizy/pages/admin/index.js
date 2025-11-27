import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { getUser, isAdmin as checkIsAdmin, getToken } from '../../lib/auth-client'

export default function AdminDashboard() {
  const router = useRouter()
  const [isAdminUser, setIsAdminUser] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAttempts: 0,
    totalSubjects: 0,
    recentAttempts: []
  })

  useEffect(() => {
    // Only allow admins
    const user = getUser()
    const adminStatus = checkIsAdmin()
    
    if (!adminStatus || !user) {
      router.push('/levels')
      return
    }
    
    setIsAdminUser(true)

    async function loadStats() {
      try {
        const token = getToken()
        if (!token) {
          router.push('/auth')
          return
        }

        // Load statistics
        const [usersRes, attemptsRes, subjectsRes] = await Promise.all([
          fetch('/api/admin/users', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('/api/attempts'),
          fetch('/api/subjects')
        ])

        const usersData = await usersRes.json()
        const attempts = await attemptsRes.json()
        const subjects = await subjectsRes.json()

        // Manejar respuesta con paginación
        const users = usersData.users || usersData

        console.log('Admin dashboard stats loaded:', { 
          users: users.length, 
          attempts: attempts.length, 
          subjects: subjects.subjects?.length 
        })

        setStats({
          totalUsers: Array.isArray(users) ? users.length : 0,
          totalAttempts: Array.isArray(attempts) ? attempts.length : 0,
          totalSubjects: subjects.subjects ? subjects.subjects.length : 0,
          recentAttempts: Array.isArray(attempts) ? attempts.slice(0, 5) : []
        })
      } catch (error) {
        console.error('Error loading stats:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadStats()
  }, [])

  if (loading || !isAdminUser) {
    return (
      <div className="container py-8">
        <p className="text-center text-gray-600">Cargando panel de administración...</p>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <img src="/logo.png" alt="Quizy Logo" className="w-16 h-16 object-contain" />
          <div>
            <h1 className="text-3xl font-bold mb-2">🔧 Panel de Administración</h1>
            <p className="text-gray-600">Gestiona usuarios, asignaturas y estadísticas</p>
          </div>
        </div>
        <Link href="/levels">
          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            👤 Modo Usuario
          </motion.a>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Usuarios</p>
              <p className="text-3xl font-bold text-blue-600">{stats.totalUsers}</p>
            </div>
            <div className="text-4xl">👥</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Intentos</p>
              <p className="text-3xl font-bold text-green-600">{stats.totalAttempts}</p>
            </div>
            <div className="text-4xl">📝</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Asignaturas</p>
              <p className="text-3xl font-bold text-purple-600">{stats.totalSubjects}</p>
            </div>
            <div className="text-4xl">📚</div>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Acciones rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/admin/users">
            <motion.a
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="block p-6 bg-white rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer"
            >
              <div className="text-3xl mb-2">👥</div>
              <h3 className="font-semibold text-lg mb-1">Gestionar Usuarios</h3>
              <p className="text-sm text-gray-600">Ver y administrar todos los usuarios</p>
            </motion.a>
          </Link>

          <Link href="/admin/subjects">
            <motion.a
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="block p-6 bg-white rounded-xl border-2 border-gray-200 hover:border-purple-500 hover:shadow-lg transition-all cursor-pointer"
            >
              <div className="text-3xl mb-2">📚</div>
              <h3 className="font-semibold text-lg mb-1">Gestionar Asignaturas</h3>
              <p className="text-sm text-gray-600">Crear y editar asignaturas</p>
            </motion.a>
          </Link>

          <Link href="/admin/questionnaires">
            <motion.a
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="block p-6 bg-white rounded-xl border-2 border-gray-200 hover:border-yellow-500 hover:shadow-lg transition-all cursor-pointer"
            >
              <div className="text-3xl mb-2">📝</div>
              <h3 className="font-semibold text-lg mb-1">Crear Cuestionarios</h3>
              <p className="text-sm text-gray-600">Crear cuestionarios personalizados</p>
            </motion.a>
          </Link>

          <Link href="/admin/news">
            <motion.a
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="block p-6 bg-white rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer"
            >
              <div className="text-3xl mb-2">📰</div>
              <h3 className="font-semibold text-lg mb-1">Noticias</h3>
              <p className="text-sm text-gray-600">Gestionar changelog y actualizaciones</p>
            </motion.a>
          </Link>

          <Link href="/admin/support">
            <motion.a
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="block p-6 bg-white rounded-xl border-2 border-gray-200 hover:border-red-500 hover:shadow-lg transition-all cursor-pointer"
            >
              <div className="text-3xl mb-2">🎫</div>
              <h3 className="font-semibold text-lg mb-1">Soporte</h3>
              <p className="text-sm text-gray-600">Gestionar solicitudes de ayuda</p>
            </motion.a>
          </Link>

          <Link href="/admin/attempts">
            <motion.a
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="block p-6 bg-white rounded-xl border-2 border-gray-200 hover:border-green-500 hover:shadow-lg transition-all cursor-pointer"
            >
              <div className="text-3xl mb-2">📊</div>
              <h3 className="font-semibold text-lg mb-1">Ver Intentos</h3>
              <p className="text-sm text-gray-600">Historial completo de intentos</p>
            </motion.a>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Actividad reciente</h2>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {stats.recentAttempts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No hay actividad reciente
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {stats.recentAttempts.map((attempt, idx) => (
                <div key={attempt.id || idx} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-900">{attempt.user_name || 'Anónimo'}</p>
                      <p className="text-sm text-gray-600">
                        {attempt.bank_name || attempt.bank?.toUpperCase() || 'N/A'} 
                        {attempt.subject_name && ` • ${attempt.subject_name}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-brand-600">{attempt.score}%</p>
                      <p className="text-xs text-gray-500">
                        {new Date(attempt.created_at || Date.now()).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
