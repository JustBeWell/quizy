import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { getUser, isAdmin } from '../../lib/auth-client'

export default function AdminUsers() {
  const router = useRouter()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [userAttempts, setUserAttempts] = useState([])
  const [loadingAttempts, setLoadingAttempts] = useState(false)
  const [showAttemptsModal, setShowAttemptsModal] = useState(false)

  useEffect(() => {
    const user = getUser()
    
    if (!user || !isAdmin()) {
      router.push('/levels')
      return
    }

    setUserName(user.name)
    loadUsers(user.name)
  }, [router])

  async function loadUsers(adminUsername) {
    try {
      const res = await fetch(`/api/admin/users?username=${encodeURIComponent(adminUsername)}`)
      const data = await res.json()
      
      if (res.ok) {
        setUsers(data)
      } else {
        console.error('Error loading users:', data)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteUser(userId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este usuario? Esta acción no se puede deshacer.')) {
      return
    }

    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: userName, userId })
      })

      const data = await res.json()

      if (res.ok) {
        alert('Usuario eliminado correctamente')
        loadUsers(userName)
      } else {
        alert(data.error || 'Error al eliminar usuario')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al eliminar usuario')
    }
  }

  async function loadUserAttempts(user) {
    setSelectedUser(user)
    setShowAttemptsModal(true)
    setLoadingAttempts(true)
    setUserAttempts([])

    try {
      const res = await fetch('/api/attempts')
      const allAttempts = await res.json()
      
      // Filtrar intentos del usuario seleccionado
      const filtered = allAttempts.filter(attempt => attempt.user_name === user.name)
      setUserAttempts(filtered)
    } catch (error) {
      console.error('Error loading attempts:', error)
      alert('Error al cargar los intentos')
    } finally {
      setLoadingAttempts(false)
    }
  }

  async function handleDeleteAttempt(attemptId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este intento?')) {
      return
    }

    try {
      const res = await fetch(`/api/admin/attempts/${attemptId}?username=${encodeURIComponent(userName)}`, {
        method: 'DELETE'
      })

      const data = await res.json()

      if (res.ok) {
        alert('Intento eliminado correctamente')
        // Recargar intentos del usuario
        loadUserAttempts(selectedUser)
      } else {
        alert(data.error || 'Error al eliminar intento')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al eliminar intento')
    }
  }

  function closeAttemptsModal() {
    setShowAttemptsModal(false)
    setSelectedUser(null)
    setUserAttempts([])
  }

  if (loading) {
    return (
      <div className="container py-8">
        <p className="text-center text-gray-600">Cargando usuarios...</p>
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
            <span className="text-sm text-gray-600">Usuarios</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">👥 Gestión de Usuarios</h1>
          <p className="text-gray-600">Administra todos los usuarios del sistema</p>
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600">Total Usuarios</p>
          <p className="text-2xl font-bold text-blue-600">{users.length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600">Administradores</p>
          <p className="text-2xl font-bold text-purple-600">
            {users.filter(u => u.is_admin).length}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600">Usuarios Regulares</p>
          <p className="text-2xl font-bold text-green-600">
            {users.filter(u => !u.is_admin).length}
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha de Registro
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                    No hay usuarios registrados
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">ID: {user.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.is_admin ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                          Administrador
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Usuario
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => loadUserAttempts(user)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Ver intentos
                        </button>
                        {!user.is_admin && (
                          <>
                            <span className="text-gray-300">|</span>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Eliminar
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de intentos */}
      <AnimatePresence>
        {showAttemptsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-2xl font-bold">Intentos de {selectedUser?.name}</h3>
                    <p className="text-gray-600 text-sm mt-1">
                      Total: {userAttempts.length} intentos
                    </p>
                  </div>
                  <button
                    onClick={closeAttemptsModal}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
                {loadingAttempts ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando intentos...</p>
                  </div>
                ) : userAttempts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Este usuario no ha realizado ningún intento
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userAttempts.map((attempt) => (
                      <div
                        key={attempt.id}
                        className="bg-gray-50 rounded-lg p-4 flex justify-between items-center hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-lg">
                              {attempt.bank_name || attempt.bank?.toUpperCase() || 'N/A'}
                            </span>
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-bold ${
                                attempt.score >= 90
                                  ? 'bg-green-100 text-green-800'
                                  : attempt.score >= 70
                                  ? 'bg-blue-100 text-blue-800'
                                  : attempt.score >= 50
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {attempt.score}%
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {new Date(attempt.created_at).toLocaleString('es-ES', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteAttempt(attempt.id)}
                          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
