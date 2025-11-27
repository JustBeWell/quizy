import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useTheme } from '../contexts/ThemeContext'
import { isAdmin as checkIsAdmin } from '../lib/auth-client'

const UserMenu = dynamic(()=>import('./UserMenu'), { ssr: false })
const NotificationBell = dynamic(()=>import('./NotificationBell'), { ssr: false })
const NewsModal = dynamic(()=>import('./NewsModal'), { ssr: false })

export default function Header(){
  const [isAdminUser, setIsAdminUser] = useState(false)
  const [showNewsModal, setShowNewsModal] = useState(false)
  const [news, setNews] = useState(null)
  const [hasNewUpdates, setHasNewUpdates] = useState(false)
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    // Verificar si el usuario es admin usando JWT
    setIsAdminUser(checkIsAdmin())
    
    // Cargar noticias y verificar si hay que mostrar automáticamente
    loadNewsAndCheckFirstTime()
  }, [])

  const loadNewsAndCheckFirstTime = async () => {
    try {
      const res = await fetch('/api/news')
      const newsData = await res.json()
      setNews(newsData)
      
      // Verificar si es la primera vez del día
      const lastNewsCheck = localStorage.getItem('last_news_check')
      const today = new Date().toDateString()
      
      if (lastNewsCheck !== today) {
        // Primera vez del día - mostrar modal automáticamente
        setShowNewsModal(true)
        localStorage.setItem('last_news_check', today)
      }
      
      // Verificar si hay actualizaciones nuevas no vistas
      const lastSeenVersion = localStorage.getItem('last_seen_version')
      if (lastSeenVersion !== newsData.currentVersion) {
        setHasNewUpdates(true)
      }
    } catch (error) {
      console.error('Error loading news:', error)
    }
  }

  const handleOpenNews = () => {
    setShowNewsModal(true)
    setHasNewUpdates(false)
    if (news?.currentVersion) {
      localStorage.setItem('last_seen_version', news.currentVersion)
    }
  }

  const handleCloseNews = () => {
    setShowNewsModal(false)
    if (news?.currentVersion) {
      localStorage.setItem('last_seen_version', news.currentVersion)
    }
  }

  return (
    <header className="site-header sticky top-0 z-30 bg-white dark:bg-[#252526] shadow-sm transition-colors border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-3 min-w-fit">
          <Link href="/levels" className="logo flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src="/logo.png" alt="Quizy Logo" className="w-12 h-12 object-contain" />
            <div className="leading-tight hidden lg:block">
              <div className="text-lg font-bold text-gray-900 dark:text-[#d4d4d4]">Quizy</div>
              <div className="text-xs text-gray-600 dark:text-[#9d9d9d]">Tu plataforma de estudio</div>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-2 flex-1 justify-center">
          <Link href="/levels">
            <a className="nav-link px-4 py-2 rounded-lg text-gray-700 dark:text-[#d4d4d4] hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-brand-600 dark:hover:text-[#4fc3f7] transition-all font-medium">
              🏠 Inicio
            </a>
          </Link>
          <Link href="/ranking">
            <a className="nav-link px-4 py-2 rounded-lg text-gray-700 dark:text-[#d4d4d4] hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-brand-600 dark:hover:text-[#4fc3f7] transition-all font-medium">
              🏆 Ranking
            </a>
          </Link>
          <Link href="/profile">
            <a className="nav-link px-4 py-2 rounded-lg text-gray-700 dark:text-[#d4d4d4] hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-brand-600 dark:hover:text-[#4fc3f7] transition-all font-medium">
              👤 Perfil
            </a>
          </Link>
          <Link href="/propose-quiz">
            <a className="nav-link px-4 py-2 rounded-lg text-gray-700 dark:text-[#d4d4d4] hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 dark:hover:from-green-900/20 dark:hover:to-emerald-900/20 hover:text-green-600 dark:hover:text-green-400 transition-all font-medium">
              ✨ Contribuir
            </a>
          </Link>
          <Link href="/support">
            <a className="nav-link px-4 py-2 rounded-lg text-gray-700 dark:text-[#d4d4d4] hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-brand-600 dark:hover:text-[#4fc3f7] transition-all font-medium">
              💬 Soporte
            </a>
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3 min-w-fit">
          {/* Botón de Noticias */}
          <button
            onClick={handleOpenNews}
            className="relative flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 text-amber-700 dark:text-amber-300 rounded-lg hover:from-amber-200 hover:to-orange-200 dark:hover:from-amber-800/40 dark:hover:to-orange-800/40 transition-all font-semibold text-sm shadow-sm hover:shadow-md"
            title="Ver novedades y actualizaciones"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <span className="hidden lg:inline">Noticias</span>
            {hasNewUpdates && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse ring-2 ring-white dark:ring-gray-800" />
            )}
          </button>
          
          {/* Notificaciones */}
          <NotificationBell />
          
          <UserMenu />
          
          {/* Admin Button - Solo visible para admins */}
          {isAdminUser && (
            <Link href="/admin">
              <a className="flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-[#c586c0] rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800/40 transition-all font-semibold text-sm shadow-sm hover:shadow-md">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="hidden lg:inline">Admin</span>
              </a>
            </Link>
          )}
          
          {/* Theme Toggle Switch */}
          <button
            onClick={toggleTheme}
            className="theme-toggle-switch relative w-16 h-8 rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 dark:focus:ring-[#4fc3f7] shadow-md hover:shadow-lg"
            style={{
              background: theme === 'light' 
                ? 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)' 
                : 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
            }}
            title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
            aria-label={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
          >
            {/* Background decorative elements */}
            <span className="absolute inset-0 rounded-full overflow-hidden">
              <span 
                className="absolute inset-0 transition-opacity duration-300"
                style={{
                  opacity: theme === 'light' ? 0.3 : 0,
                  background: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.8), transparent 50%)'
                }}
              />
            </span>
            
            {/* Toggle circle with icon */}
            <span
              className="absolute left-1 top-1 w-6 h-6 bg-white rounded-full shadow-lg transform transition-all duration-300 ease-in-out flex items-center justify-center"
              style={{
                transform: theme === 'dark' ? 'translateX(32px)' : 'translateX(0)',
                boxShadow: theme === 'dark' 
                  ? '0 2px 8px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.1)' 
                  : '0 2px 8px rgba(0,0,0,0.2), inset 0 1px 2px rgba(255,255,255,0.3)'
              }}
            >
              <span className="text-xs transition-transform duration-300 ease-in-out" style={{
                transform: theme === 'dark' ? 'rotate(180deg)' : 'rotate(0deg)'
              }}>
                {theme === 'light' ? '☀️' : '🌙'}
              </span>
            </span>
          </button>
        </div>
      </div>
      
      {/* Modal de Noticias */}
      <NewsModal 
        isOpen={showNewsModal} 
        onClose={handleCloseNews}
        news={news}
      />
    </header>
  )
}
