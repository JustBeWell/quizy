import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { getUser, isAdmin as checkIsAdmin, getToken } from '../../lib/auth-client'

export default function AdminSupport() {
  const router = useRouter()
  const [isAdminUser, setIsAdminUser] = useState(false)
  const [loading, setLoading] = useState(true)
  const [tickets, setTickets] = useState([])
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [response, setResponse] = useState('')
  const [newStatus, setNewStatus] = useState('')
  const [expandedMonths, setExpandedMonths] = useState(new Set())

  useEffect(() => {
    const user = getUser()
    if (!user || !checkIsAdmin()) {
      router.push('/levels')
      return
    }
    setIsAdminUser(true)
    loadTickets()
  }, [router])

  async function loadTickets() {
    try {
      const token = getToken()
      const url = filterStatus === 'all' 
        ? '/api/support'
        : `/api/support?status=${filterStatus}`

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setTickets(data)
      }
    } catch (error) {
      console.error('Error loading tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAdminUser) {
      loadTickets()
    }
  }, [filterStatus, isAdminUser])

  async function handleUpdateTicket(ticketId) {
    if (!response.trim() && !newStatus) {
      alert('Debes escribir una respuesta o cambiar el estado')
      return
    }

    try {
      const token = getToken()
      const body = { id: ticketId }
      
      if (response.trim()) {
        body.admin_response = response
      }
      
      if (newStatus) {
        body.status = newStatus
      }

      const res = await fetch('/api/support', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      if (res.ok) {
        alert('Ticket actualizado')
        setSelectedTicket(null)
        setResponse('')
        setNewStatus('')
        loadTickets()
      } else {
        const error = await res.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error updating ticket:', error)
      alert('Error al actualizar el ticket')
    }
  }

  async function handleDiscardTicket(ticketId) {
    if (!confirm('¿Estás seguro de que quieres descartar este ticket? Esta acción no se puede deshacer.')) {
      return
    }

    try {
      const token = getToken()
      const res = await fetch('/api/support', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: ticketId,
          status: 'discarded'
        })
      })

      if (res.ok) {
        alert('Ticket descartado')
        setSelectedTicket(null)
        setResponse('')
        setNewStatus('')
        loadTickets()
      } else {
        const error = await res.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error discarding ticket:', error)
      alert('Error al descartar el ticket')
    }
  }

  function getStatusBadge(status) {
    const styles = {
      open: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800',
      discarded: 'bg-red-100 text-red-800'
    }

    const labels = {
      open: 'Abierto',
      in_progress: 'En Progreso',
      resolved: 'Resuelto',
      closed: 'Cerrado',
      discarded: 'Descartado'
    }

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status] || styles.open}`}>
        {labels[status] || status}
      </span>
    )
  }

  function getStatusCount(status) {
    if (status === 'all') return tickets.length
    return tickets.filter(t => t.status === status).length
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

  if (loading || !isAdminUser) {
    return (
      <div className="container py-8">
        <p className="text-center text-gray-600">Cargando...</p>
      </div>
    )
  }

  const filteredTickets = filterStatus === 'all' 
    ? tickets 
    : tickets.filter(t => t.status === filterStatus)

  return (
    <div className="container py-8 max-w-7xl mx-auto px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">🎫 Gestión de Soporte</h1>
          <p className="text-gray-600">Gestiona las solicitudes de ayuda de los usuarios</p>
        </div>
        <Link href="/admin">
          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            ← Panel Admin
          </motion.a>
        </Link>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { key: 'all', label: 'Todos', count: getStatusCount('all') },
          { key: 'open', label: 'Abiertos', count: getStatusCount('open') },
          { key: 'in_progress', label: 'En Progreso', count: getStatusCount('in_progress') },
          { key: 'resolved', label: 'Resueltos', count: getStatusCount('resolved') },
          { key: 'closed', label: 'Cerrados', count: getStatusCount('closed') },
          { key: 'discarded', label: 'Descartados', count: getStatusCount('discarded') }
        ].map(filter => (
          <button
            key={filter.key}
            onClick={() => setFilterStatus(filter.key)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === filter.key
                ? 'bg-blue-700 dark:bg-blue-600 text-white font-semibold'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {filter.label} ({filter.count})
          </button>
        ))}
      </div>

      {/* Tickets list */}
      {filteredTickets.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-500">
          <p className="text-lg">No hay tickets en esta categoría</p>
        </div>
      ) : (
        <>
          {/* Expand/Collapse buttons */}
          <div className="flex gap-3 mb-4">
            <button
              onClick={() => expandAllMonths(groupTicketsByMonth(filteredTickets))}
              className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
            >
              📂 Expandir todos los meses
            </button>
            <button
              onClick={collapseAllMonths}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              📁 Contraer todos los meses
            </button>
          </div>

          {/* Tickets grouped by month */}
          <div className="space-y-4">
            {groupTicketsByMonth(filteredTickets).map((monthGroup) => {
              const isExpanded = expandedMonths.has(monthGroup.key)
              
              return (
                <div key={monthGroup.key} className="border border-gray-200 rounded-xl overflow-hidden">
                  {/* Month header */}
                  <button
                    onClick={() => toggleMonth(monthGroup.key)}
                    className="w-full px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-colors flex items-center justify-between"
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
                          {monthGroup.tickets.length} {monthGroup.tickets.length === 1 ? 'ticket' : 'tickets'}
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
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 bg-white">
                          {monthGroup.tickets.map((ticket) => (
                            <motion.div
                              key={ticket.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-gray-50 rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                            >
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                  <h3 className="text-xl font-bold mb-1">{ticket.subject}</h3>
                                  <p className="text-sm text-gray-500">
                                    Usuario: {ticket.user_name} ({ticket.user_email})
                                  </p>
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
                                <p className="text-sm font-medium text-gray-700 mb-1">Mensaje del usuario:</p>
                                <p className="text-gray-800 whitespace-pre-wrap text-sm">{ticket.message}</p>
                              </div>

                              {ticket.admin_response && (
                                <div className="bg-blue-50 p-4 rounded-lg mb-3 border border-blue-200">
                                  <p className="text-sm font-medium text-blue-700 mb-1">
                                    Respuesta ({ticket.responded_by}):
                                  </p>
                                  <p className="text-gray-800 whitespace-pre-wrap text-sm">{ticket.admin_response}</p>
                                </div>
                              )}

                              {ticket.status === 'discarded' && ticket.discarded_by && (
                                <div className="bg-red-50 p-3 rounded-lg mb-3 border border-red-200">
                                  <p className="text-sm text-red-700">
                                    🗑️ Descartado por {ticket.discarded_by} el {new Date(ticket.discarded_at).toLocaleDateString('es-ES')}
                                  </p>
                                </div>
                              )}

                              <button
                                onClick={() => {
                                  setSelectedTicket(ticket)
                                  setResponse(ticket.admin_response || '')
                                  setNewStatus(ticket.status)
                                }}
                                className="w-full px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 font-semibold"
                              >
                                {ticket.admin_response ? 'Editar Respuesta' : 'Responder'}
                              </button>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Response modal */}
      <AnimatePresence>
        {selectedTicket && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedTicket(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold mb-4">Responder Ticket #{selectedTicket.id}</h2>

              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-1">Usuario:</p>
                <p className="text-gray-800">{selectedTicket.user_name} ({selectedTicket.user_email})</p>
                
                <p className="text-sm font-medium text-gray-700 mt-3 mb-1">Asunto:</p>
                <p className="text-gray-800">{selectedTicket.subject}</p>
                
                <p className="text-sm font-medium text-gray-700 mt-3 mb-1">Mensaje:</p>
                <p className="text-gray-800 whitespace-pre-wrap">{selectedTicket.message}</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Estado</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="open">Abierto</option>
                  <option value="in_progress">En Progreso</option>
                  <option value="resolved">Resuelto</option>
                  <option value="closed">Cerrado</option>
                  <option value="discarded">Descartado</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Respuesta al Usuario</label>
                <textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Escribe tu respuesta aquí..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="6"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleUpdateTicket(selectedTicket.id)}
                  className="flex-1 px-6 py-3 bg-blue-700 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-800 dark:hover:bg-blue-700 font-semibold"
                >
                  Guardar Respuesta
                </button>
                {selectedTicket.status !== 'discarded' && (
                  <button
                    onClick={() => handleDiscardTicket(selectedTicket.id)}
                    className="px-6 py-3 bg-red-700 dark:bg-red-600 text-white rounded-lg hover:bg-red-800 dark:hover:bg-red-700 font-semibold"
                    title="Descartar ticket como inútil o spam"
                  >
                    🗑️ Descartar
                  </button>
                )}
                <button
                  onClick={() => {
                    setSelectedTicket(null)
                    setResponse('')
                    setNewStatus('')
                  }}
                  className="px-6 py-3 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
