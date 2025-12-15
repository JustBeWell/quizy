import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { getUser, isAdmin as checkIsAdmin, getToken } from '../../lib/auth-client'

export default function AdminNotifications() {
  const router = useRouter()
  const [isAdminUser, setIsAdminUser] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [message, setMessage] = useState(null)
  const [activeTab, setActiveTab] = useState('notifications') // 'notifications' | 'emails'

  // Form state for notifications
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    link: ''
  })

  // Form state for emails
  const [emailData, setEmailData] = useState({
    subject: '',
    content: '',
    sendNotification: true
  })

  useEffect(() => {
    const user = getUser()
    const adminStatus = checkIsAdmin()

    if (!adminStatus || !user) {
      router.push('/levels')
      return
    }

    setIsAdminUser(true)
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    try {
      const token = getToken()
      const response = await fetch('/api/admin/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setCreating(true)
    setMessage(null)

    try {
      const token = getToken()
      const response = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: data.message })
        setShowCreateModal(false)
        setFormData({ title: '', message: '', link: '' })
        loadNotifications()
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al crear notificación' })
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (notification) => {
    if (!confirm('¿Estás seguro de eliminar esta notificación para todos los usuarios?')) {
      return
    }

    setDeleting(notification.id)
    setMessage(null)

    try {
      const token = getToken()
      const response = await fetch('/api/admin/notifications', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: notification.title,
          message: notification.message
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: data.message })
        loadNotifications()
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al eliminar notificación' })
    } finally {
      setDeleting(null)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Send broadcast email
  const handleSendEmail = async (e) => {
    e.preventDefault()
    
    if (!confirm(`¿Estás seguro de enviar este email a TODOS los usuarios?\n\nAsunto: ${emailData.subject}\n\nEsta acción no se puede deshacer.`)) {
      return
    }
    
    setSendingEmail(true)
    setMessage(null)

    try {
      const token = getToken()
      const response = await fetch('/api/admin/broadcast-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(emailData)
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: `✅ ${data.message}${data.stats.failed > 0 ? ` (${data.stats.failed} fallidos)` : ''}` 
        })
        setShowEmailModal(false)
        setEmailData({ subject: '', content: '', sendNotification: true })
        if (emailData.sendNotification) {
          loadNotifications()
        }
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al enviar emails: ' + error.message })
    } finally {
      setSendingEmail(false)
    }
  }

  if (loading || !isAdminUser) {
    return (
      <div className="container py-8">
        <p className="text-center text-gray-600">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-gray-600 hover:text-gray-800 cursor-pointer"
            >
              ← Volver
            </motion.a>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">🔔 Centro de Comunicaciones</h1>
            <p className="text-gray-600">Envía notificaciones y emails a los usuarios</p>
          </div>
        </div>
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium flex items-center gap-2"
          >
            <span>🔔</span>
            Notificación
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowEmailModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center gap-2"
          >
            <span>📧</span>
            Email Masivo
          </motion.button>
        </div>
      </div>

      {/* Message */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notifications List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-12 text-center">
            <span className="text-6xl mb-4 block">📭</span>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">No hay notificaciones</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Aún no has creado ninguna notificación para los usuarios.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
            >
              Crear primera notificación
            </motion.button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {notifications.map((notification) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">📢</span>
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                        {notification.title}
                      </h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-3 whitespace-pre-wrap">
                      {notification.message}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        📅 {formatDate(notification.created_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        👥 {notification.recipients_count} destinatarios
                      </span>
                      {notification.link && (
                        <span className="flex items-center gap-1">
                          🔗 {notification.link}
                        </span>
                      )}
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleDelete(notification)}
                    disabled={deleting === notification.id}
                    className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                    title="Eliminar notificación"
                  >
                    {deleting === notification.id ? (
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  📢 Nueva Notificación
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Esta notificación se enviará a todos los usuarios con notificaciones habilitadas.
                </p>
              </div>

              <form onSubmit={handleCreate} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Título *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    maxLength={255}
                    placeholder="Ej: ¡Nueva funcionalidad disponible!"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 mt-1">{formData.title.length}/255</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mensaje *
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                    maxLength={5000}
                    rows={4}
                    placeholder="Describe la notificación..."
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">{formData.message.length}/5000</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Enlace (opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    placeholder="Ej: /subjects o https://..."
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Si incluyes un enlace, los usuarios podrán hacer clic para ir a esa página.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowCreateModal(false)}
                    className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancelar
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={creating || !formData.title || !formData.message}
                    className="px-6 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {creating ? (
                      <>
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Enviando...
                      </>
                    ) : (
                      <>
                        📤 Enviar Notificación
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Email Modal */}
      <AnimatePresence>
        {showEmailModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowEmailModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-600 to-indigo-600">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  📧 Enviar Email Masivo
                </h2>
                <p className="text-purple-100 mt-1">
                  Este email se enviará a todos los usuarios con notificaciones habilitadas
                </p>
              </div>

              <form onSubmit={handleSendEmail} className="p-6 space-y-5">
                {/* Warning */}
                <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div>
                      <p className="font-medium text-yellow-800 dark:text-yellow-200">Acción importante</p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        Este email se enviará a todos los usuarios registrados. Asegúrate de revisar el contenido antes de enviar.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Asunto del email *
                  </label>
                  <input
                    type="text"
                    value={emailData.subject}
                    onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                    required
                    maxLength={200}
                    placeholder="Ej: ¡Nuevas funcionalidades en Quizy!"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 mt-1">{emailData.subject.length}/200</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Contenido del email *
                  </label>
                  <textarea
                    value={emailData.content}
                    onChange={(e) => setEmailData({ ...emailData, content: e.target.value })}
                    required
                    maxLength={10000}
                    rows={8}
                    placeholder="Escribe el contenido del email...

Puedes usar saltos de línea para organizar el texto."
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">{emailData.content.length}/10000</p>
                </div>

                {/* Preview */}
                {emailData.content && (
                  <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                    <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                      👁️ Vista previa del mensaje
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 max-h-40 overflow-y-auto">
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm">
                        {emailData.content}
                      </p>
                    </div>
                  </div>
                )}

                {/* Options */}
                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <input
                    type="checkbox"
                    id="send-notification"
                    checked={emailData.sendNotification}
                    onChange={(e) => setEmailData({ ...emailData, sendNotification: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="send-notification" className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Crear también notificación in-app</span>
                    <br />
                    <span className="text-gray-500 dark:text-gray-400">
                      Además del email, los usuarios verán una notificación en la aplicación
                    </span>
                  </label>
                </div>

                {/* Info box */}
                <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 text-sm">
                  <p className="font-medium text-blue-800 dark:text-blue-300 mb-2">📬 Información del envío:</p>
                  <ul className="text-blue-700 dark:text-blue-400 space-y-1">
                    <li>• El email tendrá el diseño profesional de Quizy</li>
                    <li>• Se enviará desde {process.env.EMAIL_USER || 'tu-email@gmail.com'}</li>
                    <li>• Los usuarios podrán desuscribirse desde su perfil</li>
                    <li>• El envío puede tardar varios minutos si hay muchos usuarios</li>
                  </ul>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowEmailModal(false)}
                    className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancelar
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={sendingEmail || !emailData.subject || !emailData.content}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {sendingEmail ? (
                      <>
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Enviando emails...
                      </>
                    ) : (
                      <>
                        📤 Enviar Email a Todos
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
