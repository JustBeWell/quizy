import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { getToken } from '../lib/auth-client'

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, unread, read
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)

  useEffect(() => {
    loadNotifications()
  }, [filter])

  const loadNotifications = async () => {
    setLoading(true)
    try {
      const token = getToken()
      if (!token) {
        router.push('/auth')
        return
      }

      const url = filter === 'unread' 
        ? '/api/notifications?unread_only=true&limit=100'
        : '/api/notifications?limit=100'

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        let notifs = data.notifications || []
        
        if (filter === 'read') {
          notifs = notifs.filter(n => n.is_read)
        }
        
        setNotifications(notifs)
        setNotificationsEnabled(data.notifications_enabled)
      } else if (response.status === 401) {
        router.push('/auth')
      }
    } catch (error) {
      console.error('Error cargando notificaciones:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId) => {
    try {
      const token = getToken()
      const response = await fetch('/api/notifications/read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ notification_id: notificationId })
      })

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
          )
        )
      }
    } catch (error) {
      console.error('Error marcando notificación:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const token = getToken()
      const response = await fetch('/api/notifications/read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ mark_all: true })
      })

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
        )
      }
    } catch (error) {
      console.error('Error marcando todas:', error)
    }
  }

  const getNotificationIcon = (type) => {
    const icons = {
      'streak_reminder': '🔥',
      'ranking_update': '🏆',
      'new_content': '📚',
      'achievement': '🎉',
      'friend_activity': '👥',
      'system': '💬'
    }
    return icons[type] || '📬'
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  if (!notificationsEnabled) {
    return (
      <div className="container py-8">
        <div className="max-w-2xl mx-auto text-center py-12">
          <span className="text-8xl mb-6 block">🔕</span>
          <h1 className="text-3xl font-bold mb-4">Notificaciones desactivadas</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Activa las notificaciones en tu perfil para recibir actualizaciones sobre tu progreso.
          </p>
          <Link href="/profile">
            <a className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium">
              Ir a Configuración
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">🔔 Notificaciones</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {unreadCount > 0 && `${unreadCount} sin leer`}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium"
            >
              Marcar todas como leídas
            </button>
          )}
        </div>

        {/* Filtros */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-brand-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'unread'
                ? 'bg-brand-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Sin leer {unreadCount > 0 && `(${unreadCount})`}
          </button>
          <button
            onClick={() => setFilter('read')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'read'
                ? 'bg-brand-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Leídas
          </button>
        </div>

        {/* Lista de notificaciones */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
            <span className="text-8xl mb-4 block">📭</span>
            <p className="text-xl text-gray-500 dark:text-gray-400">
              {filter === 'unread' && 'No tienes notificaciones sin leer'}
              {filter === 'read' && 'No tienes notificaciones leídas'}
              {filter === 'all' && 'No tienes notificaciones'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {notifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border ${
                    !notification.is_read
                      ? 'border-l-4 border-l-brand-500 border-gray-200 dark:border-gray-700'
                      : 'border-gray-200 dark:border-gray-700'
                  } hover:shadow-md transition-shadow`}
                >
                  <div className="flex gap-4">
                    <span className="text-4xl flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {notification.title}
                        </h3>
                        {!notification.is_read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-xs px-3 py-1 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 rounded-full hover:bg-brand-200 dark:hover:bg-brand-800/40 transition-colors font-medium flex-shrink-0"
                          >
                            Marcar como leída
                          </button>
                        )}
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatTime(notification.created_at)}
                        </p>
                        {notification.link && (
                          <Link href={notification.link}>
                            <a className="text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-medium flex items-center gap-1">
                              Ver más
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </a>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
