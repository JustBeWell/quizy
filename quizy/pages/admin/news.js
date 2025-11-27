import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { getUser, isAdmin, getToken } from '../../lib/auth-client'

export default function AdminNews() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [news, setNews] = useState(null)
  const [editingUpdate, setEditingUpdate] = useState(null)
  const [editingHotfix, setEditingHotfix] = useState(null)
  const [showAddUpdate, setShowAddUpdate] = useState(false)
  const [showAddHotfix, setShowAddHotfix] = useState(false)

  useEffect(() => {
    const user = getUser()
    if (!user || !isAdmin()) {
      router.push('/levels')
      return
    }
    loadNews()
  }, [])

  const loadNews = async () => {
    try {
      const res = await fetch('/api/news')
      const data = await res.json()
      setNews(data)
    } catch (error) {
      console.error('Error loading news:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveUpdate = async (update, isNew) => {
    // Aquí puedes implementar la lógica para guardar en la BD o actualizar el JSON
    console.log('Guardar actualización:', update, isNew)
    setEditingUpdate(null)
    setShowAddUpdate(false)
    // Recargar noticias
    await loadNews()
  }

  const handleSaveHotfix = async (hotfix, isNew) => {
    console.log('Guardar hotfix:', hotfix, isNew)
    setEditingHotfix(null)
    setShowAddHotfix(false)
    await loadNews()
  }

  if (loading) {
    return (
      <div className="container py-8">
        <p className="text-center">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="mb-6">
        <Link href="/admin">
          <a className="text-blue-600 hover:text-blue-800 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver al panel
          </a>
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">📰 Gestión de Noticias</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Versión actual: <span className="font-semibold text-blue-600">{news?.currentVersion}</span>
            </p>
          </div>
        </div>

        {/* Actualizaciones */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">✨ Actualizaciones</h2>
            <button
              onClick={() => setShowAddUpdate(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Nueva actualización
            </button>
          </div>

          <div className="space-y-3">
            {news?.updates?.map((update, idx) => (
              <div
                key={idx}
                className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-750 rounded-lg p-4 border-l-4 border-blue-500"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{update.icon || '📦'}</span>
                      <h3 className="font-semibold">{update.title}</h3>
                      <span className="text-xs px-2 py-0.5 bg-blue-500 text-white rounded-full">
                        v{update.version}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">{update.description}</p>
                    <p className="text-xs text-gray-500">{update.date}</p>
                  </div>
                  <button
                    onClick={() => setEditingUpdate(update)}
                    className="text-blue-600 hover:text-blue-800 ml-4"
                  >
                    Editar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hotfixes */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">🔧 Hotfixes</h2>
            <button
              onClick={() => setShowAddHotfix(true)}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              + Nuevo hotfix
            </button>
          </div>

          <div className="space-y-3">
            {news?.hotfixes?.map((fix, idx) => (
              <div
                key={idx}
                className="bg-orange-50 dark:bg-gray-700 rounded-lg p-4 border-l-4 border-orange-500"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">🔧</span>
                      <h3 className="font-semibold text-sm">{fix.title}</h3>
                      <span className="text-xs px-2 py-0.5 bg-orange-500 text-white rounded-full">
                        v{fix.version}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mb-1">{fix.description}</p>
                    <p className="text-xs text-gray-500">{fix.date}</p>
                  </div>
                  <button
                    onClick={() => setEditingHotfix(fix)}
                    className="text-orange-600 hover:text-orange-800 ml-4"
                  >
                    Editar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Nota informativa */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-1">Funcionamiento del sistema</h3>
            <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
              <li>• Las noticias se muestran automáticamente <strong>una vez al día</strong> al primer login</li>
              <li>• Los usuarios pueden ver las noticias en cualquier momento desde el botón en el header</li>
              <li>• El indicador rojo aparece cuando hay actualizaciones no vistas</li>
              <li>• Para editar, modifica el archivo <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">data/news.json</code></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
