import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function NewsModal({ isOpen, onClose, news }) {
  const [activeTab, setActiveTab] = useState('updates')

  useEffect(() => {
    // Cerrar con ESC
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const currentVersion = news?.currentVersion || '1.0.0'
  const updates = news?.updates || []
  const hotfixes = news?.hotfixes || []

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl max-h-[80vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 text-white p-6 z-10">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1">📰 Novedades de Quizy</h2>
                <p className="text-blue-100 text-sm">Versión actual: <span className="font-semibold">{currentVersion}</span></p>
              </div>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors p-1"
                aria-label="Cerrar"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setActiveTab('updates')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'updates'
                    ? 'bg-white/20 text-white shadow-md'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                ✨ Novedades
              </button>
              <button
                onClick={() => setActiveTab('hotfixes')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'hotfixes'
                    ? 'bg-white/20 text-white shadow-md'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                🔧 Hotfixes
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto p-6 space-y-4" style={{ maxHeight: 'calc(80vh - 180px)' }}>
            {activeTab === 'updates' && (
              <div className="space-y-4">
                {updates.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p>No hay actualizaciones recientes</p>
                  </div>
                ) : (
                  updates.map((update, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-750 rounded-xl p-4 border-l-4 border-blue-500"
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">{update.icon || '📦'}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white">{update.title}</h3>
                            {update.version && (
                              <span className="text-xs px-2 py-0.5 bg-blue-500 text-white rounded-full">
                                v{update.version}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{update.description}</p>
                          {update.date && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(update.date).toLocaleDateString('es-ES', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'hotfixes' && (
              <div className="space-y-3">
                {hotfixes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p>No hay hotfixes recientes</p>
                  </div>
                ) : (
                  hotfixes.map((fix, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="bg-orange-50 dark:bg-gray-700 rounded-lg p-3 border-l-4 border-orange-500"
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-xl">🔧</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900 dark:text-white text-sm">{fix.title}</h4>
                            {fix.version && (
                              <span className="text-xs px-2 py-0.5 bg-orange-500 text-white rounded-full">
                                v{fix.version}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-300">{fix.description}</p>
                          {fix.date && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {new Date(fix.date).toLocaleDateString('es-ES', {
                                day: 'numeric',
                                month: 'short'
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-750 border-t border-gray-200 dark:border-gray-600 p-4">
            <button
              onClick={onClose}
              className="w-full py-2 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg"
            >
              Entendido
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
