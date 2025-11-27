import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { getUser, getToken } from '../lib/auth-client'
import { useRouter } from 'next/router'

export default function Support() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [tickets, setTickets] = useState([])
  const [showForm, setShowForm] = useState(true)
  const [expandedMonths, setExpandedMonths] = useState(new Set())
  const [formData, setFormData] = useState({
    subject: '',
    message: ''
  })

  useEffect(() => {
    const currentUser = getUser()
    if (!currentUser) {
      router.push('/auth')
      return
    }
    setUser(currentUser)
    loadTickets()
  }, [router])

  async function loadTickets() {
    try {
      const token = getToken()
      const response = await fetch('/api/support', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        // Manejar respuesta con paginación o sin ella (compatibilidad)
        setTickets(data.tickets || data)
      } else {
        const error = await response.json()
        
        // Handle outdated token
        if (error.error === 'token_outdated') {
          alert('⚠️ ' + error.message)
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          router.push('/auth')
        }
      }
    } catch (error) {
      console.error('Error loading tickets:', error)
    }
  }

  async function sendVerificationEmail() {
    try {
      const token = getToken()
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (response.ok) {
        alert('✓ ' + data.message + '\n\nRevisa tu bandeja de entrada.')
        
        // En desarrollo, mostrar el link
        if (data.verificationUrl) {
          console.log('Verification URL:', data.verificationUrl)
          if (confirm('En desarrollo: ¿Abrir link de verificación ahora?')) {
            window.open(data.verificationUrl, '_blank')
          }
        }
      } else {
        alert('Error: ' + data.error)
      }
    } catch (error) {
      console.error('Error sending verification email:', error)
      alert('Error al enviar email de verificación')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (!formData.subject.trim() || !formData.message.trim()) {
      alert('Por favor completa todos los campos')
      return
    }

    setLoading(true)

    try {
      const token = getToken()
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        alert('✓ Tu solicitud de ayuda ha sido enviada. Recibirás una respuesta pronto.')
        setFormData({ subject: '', message: '' })
        setShowForm(false)
        loadTickets()
      } else {
        const error = await response.json()
        
        // Handle outdated token
        if (error.error === 'token_outdated') {
          alert('⚠️ ' + error.message)
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          router.push('/auth')
          return
        }

        // Handle email not verified
        if (error.error === 'email_not_verified') {
          if (confirm(error.message + '\n\n¿Deseas ir a tu perfil para gestionar tu email?')) {
            router.push('/profile')
          }
          return
        }
        
        alert(`Error: ${error.message || error.error}`)
      }
    } catch (error) {
      console.error('Error submitting ticket:', error)
      alert('Error al enviar la solicitud')
    } finally {
      setLoading(false)
    }
  }

  function getStatusBadge(status) {
    const styles = {
      open: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800'
    }

    const labels = {
      open: 'Abierto',
      in_progress: 'En Progreso',
      resolved: 'Resuelto',
      closed: 'Cerrado'
    }

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status] || styles.open}`}>
        {labels[status] || status}
      </span>
    )
  }

  // Agrupar tickets por mes
  function groupTicketsByMonth(ticketsList) {
    const groups = {}
    
    ticketsList.forEach(ticket => {
      const date = new Date(ticket.created_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthLabel = date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })
      
      if (!groups[monthKey]) {
        groups[monthKey] = {
          key: monthKey,
          label: monthLabel,
          tickets: []
        }
      }
      
      groups[monthKey].tickets.push(ticket)
    })
    
    // Ordenar por mes (más reciente primero)
    return Object.values(groups).sort((a, b) => b.key.localeCompare(a.key))
  }

  function toggleMonth(monthKey) {
    setExpandedMonths(prev => {
      const newSet = new Set(prev)
      if (newSet.has(monthKey)) {
        newSet.delete(monthKey)
      } else {
        newSet.add(monthKey)
      }
      return newSet
    })
  }

  function expandAllMonths(monthGroups) {
    setExpandedMonths(new Set(monthGroups.map(g => g.key)))
  }

  function collapseAllMonths() {
    setExpandedMonths(new Set())
  }

  if (!user) {
    return (
      <div className="container py-8">
        <p className="text-center text-gray-600">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="container py-8 max-w-4xl mx-auto px-4">
      <div className="mb-8">
        <Link href="/levels">
          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-block px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors mb-4"
          >
            ← Volver al Inicio
          </motion.a>
        </Link>

        <h1 className="text-3xl font-bold mb-2">💬 Centro de Ayuda</h1>
        <p className="text-gray-600">¿Tienes alguna duda o problema? Estamos aquí para ayudarte. Envíanos un mensaje y te responderemos lo antes posible.</p>
      </div>

      {/* Navegación móvil - Breadcrumb tabs */}
      <div className="md:hidden mb-6 overflow-x-auto">
        <div className="flex gap-2 pb-2">
          <Link href="/profile">
            <a className="px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 transition-colors">
              👤 Mi Perfil
            </a>
          </Link>
          <Link href="/ranking">
            <a className="px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 transition-colors">
              🏆 Ranking Global
            </a>
          </Link>
          <Link href="/support">
            <a className="px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap bg-brand-700 dark:bg-brand-500 text-white shadow-sm hover:bg-brand-800 dark:hover:bg-brand-600 transition-colors">
              💬 Ayuda
            </a>
          </Link>
        </div>
      </div>

      {showForm ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-lg mb-8 border border-gray-200"
        >
          <h2 className="text-2xl font-bold mb-4">📝 Nueva Solicitud de Soporte</h2>
          <p className="text-sm text-gray-600 mb-6">Rellena el formulario y nos pondremos en contacto contigo pronto</p>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Asunto de la consulta *</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Ej: Error al cargar cuestionario, Pregunta sobre puntuación..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Resume brevemente tu consulta</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Describe tu consulta *</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Describe tu duda o problema con el máximo detalle posible. Cuanta más información proporciones, mejor podremos ayudarte..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                rows="6"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Incluye capturas de pantalla si es posible (puedes enviarlas por email)</p>
            </div>

            <div className="flex gap-3">
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-brand-700 dark:bg-brand-600 text-white rounded-lg hover:bg-brand-800 dark:hover:bg-brand-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Enviando...' : '📤 Enviar Solicitud'}
              </motion.button>
              
              {tickets.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Ver mis solicitudes
                </button>
              )}
            </div>
          </form>
        </motion.div>
      ) : (
        <div className="mb-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowForm(true)}
            className="px-6 py-3 bg-brand-700 dark:bg-brand-600 text-white rounded-lg hover:bg-brand-800 dark:hover:bg-brand-700 transition-colors font-semibold"
          >
            + Nueva Solicitud de Soporte
          </motion.button>
        </div>
      )}

      {/* User's tickets */}
      <div>
        <h2 className="text-2xl font-bold mb-4">📋 Mis Solicitudes ({tickets.length})</h2>
        
        {tickets.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-500 border border-gray-200">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-lg mb-2">No tienes solicitudes de soporte</p>
            <p className="text-sm text-gray-400">Cuando envíes una consulta, aparecerá aquí y podrás ver su estado</p>
          </div>
        ) : (
          <>
            {/* Expand/Collapse buttons */}
            <div className="flex gap-3 mb-4">
              <button
                onClick={() => expandAllMonths(groupTicketsByMonth(tickets))}
                className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
              >
                📂 Expandir todos
              </button>
              <button
                onClick={collapseAllMonths}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                📁 Contraer todos
              </button>
            </div>

            {/* Tickets grouped by month */}
            <div className="space-y-4">
              {groupTicketsByMonth(tickets).map((monthGroup) => {
                const isExpanded = expandedMonths.has(monthGroup.key)
                
                return (
                  <div key={monthGroup.key} className="border border-gray-200 rounded-xl overflow-hidden">
                    {/* Month header */}
                    <button
                      onClick={() => toggleMonth(monthGroup.key)}
                      className="w-full px-6 py-4 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {isExpanded ? '📂' : '📁'}
                        </span>
                        <div className="text-left">
                          <h3 className="text-lg font-bold text-gray-900 capitalize">
                            {monthGroup.label}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {monthGroup.tickets.length} {monthGroup.tickets.length === 1 ? 'solicitud' : 'solicitudes'}
                          </p>
                        </div>
                      </div>
                      <svg
                        className={`w-6 h-6 text-gray-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Tickets in this month */}
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="bg-white p-4 space-y-4"
                      >
                        {monthGroup.tickets.map((ticket) => (
                          <motion.div
                            key={ticket.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gray-50 rounded-lg p-6 shadow-sm border border-gray-200"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <h3 className="text-xl font-bold mb-1">{ticket.subject}</h3>
                                <p className="text-sm text-gray-500">
                                  {new Date(ticket.created_at).toLocaleDateString('es-ES', {
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                              {getStatusBadge(ticket.status)}
                            </div>

                            <div className="bg-white p-4 rounded-lg mb-3 border border-gray-200">
                              <p className="text-sm font-medium text-gray-700 mb-1">Tu mensaje:</p>
                              <p className="text-gray-800 whitespace-pre-wrap text-sm">{ticket.message}</p>
                            </div>

                            {ticket.admin_response && (
                              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-3">
                                <p className="text-sm font-medium text-blue-700 mb-1">
                                  Respuesta del equipo {ticket.responded_by && `(${ticket.responded_by})`}:
                                </p>
                                <p className="text-gray-800 whitespace-pre-wrap text-sm">{ticket.admin_response}</p>
                                <p className="text-xs text-gray-500 mt-2">
                                  {new Date(ticket.updated_at).toLocaleDateString('es-ES', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                            )}

                            {!ticket.admin_response && ticket.status === 'open' && (
                              <p className="text-sm text-gray-500 italic">
                                ⏳ Tu solicitud está pendiente de respuesta
                              </p>
                            )}
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
