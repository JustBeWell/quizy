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
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-3xl max-h-[90vh] bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900 dark:to-orange-900 rounded-xl shadow-2xl overflow-hidden flex flex-col"
            style={{
              boxShadow: '0 20px 60px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3)'
            }}
          >
          {/* Header con estilo corcho */}
          <div className="relative bg-gradient-to-br from-amber-600 to-orange-700 dark:from-amber-800 dark:to-orange-800 text-white p-8 shadow-lg flex-shrink-0">
            {/* Textura de corcho */}
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }} />
            
            <div className="relative flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-4xl">📌</div>
                  <h2 className="text-3xl font-bold text-white drop-shadow-lg">Tablón de Noticias</h2>
                </div>
                <p className="text-amber-100 text-sm font-medium">
                  Versión actual: <span className="px-2 py-1 bg-white/20 rounded-md font-bold">{currentVersion}</span>
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-white/90 hover:text-white hover:bg-white/10 transition-all p-2 rounded-full"
                aria-label="Cerrar"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tabs con chinchetas */}
            <div className="relative flex gap-3 mt-6">
              <button
                onClick={() => setActiveTab('updates')}
                className={`relative px-5 py-3 rounded-t-lg font-semibold transition-all shadow-md ${
                  activeTab === 'updates'
                    ? 'bg-white dark:bg-gray-800 text-amber-700 dark:text-amber-300 transform -translate-y-1'
                    : 'bg-amber-700/50 text-white/80 hover:bg-amber-700/70'
                }`}
              >
                {/* Chincheta */}
                <span className="absolute -top-2 left-1/2 transform -translate-x-1/2 text-2xl">📌</span>
                <span className="mt-1 block">✨ Novedades</span>
              </button>
              <button
                onClick={() => setActiveTab('hotfixes')}
                className={`relative px-5 py-3 rounded-t-lg font-semibold transition-all shadow-md ${
                  activeTab === 'hotfixes'
                    ? 'bg-white dark:bg-gray-800 text-orange-700 dark:text-orange-300 transform -translate-y-1'
                    : 'bg-orange-700/50 text-white/80 hover:bg-orange-700/70'
                }`}
              >
                {/* Chincheta */}
                <span className="absolute -top-2 left-1/2 transform -translate-x-1/2 text-2xl">📌</span>
                <span className="mt-1 block">🔧 Arreglos</span>
              </button>
            </div>
          </div>

          {/* Content - Estilo panel de corcho */}
          <div className="overflow-y-auto flex-1 p-8 space-y-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-850">
            {activeTab === 'updates' && (
              <div className="space-y-5 py-4">
                {updates.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <p className="text-lg">📭 No hay actualizaciones recientes</p>
                  </div>
                ) : (
                  updates.map((update, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, rotate: -2, scale: 0.95 }}
                      animate={{ opacity: 1, rotate: idx % 2 === 0 ? 1 : -1, scale: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      className="relative bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-800 dark:to-yellow-900 rounded-lg p-5 shadow-lg transform hover:scale-105 hover:rotate-0 transition-all"
                      style={{
                        boxShadow: '3px 3px 10px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.5)',
                      }}
                    >
                      {/* Chincheta decorativa */}
                      <div className="absolute -top-3 left-6 text-3xl transform -rotate-12">
                        📌
                      </div>
                      
                      {/* Sombra de chincheta */}
                      <div className="absolute -top-1 left-8 w-4 h-4 bg-black/10 rounded-full blur-sm" />
                      
                      <div className="flex items-start gap-4 mt-2">
                        <div className="text-4xl">{update.icon || '📦'}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">{update.title}</h3>
                            {update.version && (
                              <span className="text-xs px-2 py-1 bg-blue-600 text-white rounded-full font-bold shadow-sm">
                                v{update.version}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed mb-2">{update.description}</p>
                          {update.date && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                              📅 {new Date(update.date).toLocaleDateString('es-ES', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Efecto de papel rasgado en el borde inferior */}
                      <div className="absolute bottom-0 left-0 right-0 h-2 opacity-20" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 60'%3E%3Cpath d='M0,30 Q30,0 60,30 T120,30 T180,30 T240,30 T300,30 T360,30 T420,30 T480,30 T540,30 T600,30 T660,30 T720,30 T780,30 T840,30 T900,30 T960,30 T1020,30 T1080,30 T1140,30 T1200,30 L1200,60 L0,60 Z' fill='%23000000'/%3E%3C/svg%3E")`
                      }} />
                    </motion.div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'hotfixes' && (
              <div className="space-y-4 py-4">
                {hotfixes.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <p className="text-lg">✅ No hay arreglos recientes</p>
                  </div>
                ) : (
                  hotfixes.map((fix, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, rotate: 2, scale: 0.95 }}
                      animate={{ opacity: 1, rotate: idx % 2 === 0 ? -0.5 : 0.5, scale: 1 }}
                      transition={{ delay: idx * 0.08 }}
                      className="relative bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900 dark:to-red-900 rounded-lg p-4 shadow-md transform hover:scale-105 hover:rotate-0 transition-all"
                      style={{
                        boxShadow: '2px 2px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.4)',
                      }}
                    >
                      {/* Chincheta decorativa */}
                      <div className="absolute -top-2 left-5 text-2xl transform rotate-12">
                        📌
                      </div>
                      
                      {/* Sombra de chincheta */}
                      <div className="absolute top-0 left-7 w-3 h-3 bg-black/10 rounded-full blur-sm" />
                      
                      <div className="flex items-start gap-3 mt-1">
                        <div className="text-3xl">🔧</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-gray-900 dark:text-white">{fix.title}</h4>
                            {fix.version && (
                              <span className="text-xs px-2 py-0.5 bg-orange-600 text-white rounded-full font-bold shadow-sm">
                                v{fix.version}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">{fix.description}</p>
                          {fix.date && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mt-1">
                              📅 {new Date(fix.date).toLocaleDateString('es-ES', {
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
          <div className="bg-gradient-to-br from-amber-100 to-orange-200 dark:from-amber-900 dark:to-orange-900 border-t-4 border-amber-600 dark:border-amber-700 p-5 shadow-inner flex-shrink-0">
            <button
              onClick={onClose}
              className="w-full py-3 px-6 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-lg font-bold text-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              ✓ Entendido
            </button>
          </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  )
}
