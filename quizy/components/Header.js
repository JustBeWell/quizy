import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useTheme } from '../contexts/ThemeContext'
import { isAdmin as checkIsAdmin } from '../lib/auth-client'

const UserMenu = dynamic(()=>import('./UserMenu'), { ssr: false })
const NotificationBell = dynamic(()=>import('./NotificationBell'), { ssr: false })

export default function Header(){
  const [isAdminUser, setIsAdminUser] = useState(false)
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    // Verificar si el usuario es admin usando JWT
    setIsAdminUser(checkIsAdmin())
  }, [])

  return (
    <header className="site-header sticky top-0 z-30 bg-white dark:bg-[#252526] transition-colors">
      <div className="container header-container flex items-center justify-between py-3">
        <div className="flex items-center gap-3">
          <Link href="/levels" className="logo flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src="/logo.png" alt="Quizy Logo" className="w-10 h-10 object-contain" />
            <div className="leading-tight">
              <div className="text-base font-semibold text-gray-900 dark:text-[#d4d4d4]">Quizy</div>
              <div className="text-xs text-gray-600 dark:text-[#9d9d9d]">Cuestionarios web a tan solo un click</div>
            </div>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/levels" className="nav-link text-gray-700 dark:text-[#d4d4d4] hover:text-brand-600 dark:hover:text-[#4fc3f7]">Inicio</Link>
          <Link href="/ranking" className="nav-link text-gray-700 dark:text-[#d4d4d4] hover:text-brand-600 dark:hover:text-[#4fc3f7]">Ranking</Link>
          <Link href="/profile" className="nav-link text-gray-700 dark:text-[#d4d4d4] hover:text-brand-600 dark:hover:text-[#4fc3f7]">Perfil</Link>
          <Link href="/propose-quiz" className="nav-link text-gray-700 dark:text-[#d4d4d4] hover:text-brand-600 dark:hover:text-[#4fc3f7]">Proponer</Link>
          <Link href="/support" className="nav-link text-gray-700 dark:text-[#d4d4d4] hover:text-brand-600 dark:hover:text-[#4fc3f7]">Soporte</Link>
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden md:block text-sm text-gray-600 dark:text-[#9d9d9d]">Bienvenido</div>
          
          {/* Notificaciones */}
          <NotificationBell />
          
          <UserMenu />
          
          {/* Admin Button - Solo visible para admins */}
          {isAdminUser && (
            <Link href="/admin" className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-[#c586c0] rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800/40 transition-colors font-medium text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Panel
            </Link>
          )}
          
          {/* Theme Toggle Switch */}
          <button
            onClick={toggleTheme}
            className="theme-toggle-switch relative w-14 h-7 rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 dark:focus:ring-[#4fc3f7] shadow-md hover:shadow-lg"
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
              className="absolute left-1 top-1 w-5 h-5 bg-white rounded-full shadow-lg transform transition-all duration-300 ease-in-out flex items-center justify-center"
              style={{
                transform: theme === 'dark' ? 'translateX(28px)' : 'translateX(0)',
                boxShadow: theme === 'dark' 
                  ? '0 2px 8px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.1)' 
                  : '0 2px 8px rgba(0,0,0,0.2), inset 0 1px 2px rgba(255,255,255,0.3)'
              }}
            >
              <span className="text-[10px] transition-transform duration-300 ease-in-out" style={{
                transform: theme === 'dark' ? 'rotate(180deg)' : 'rotate(0deg)'
              }}>
                {theme === 'light' ? '☀️' : '🌙'}
              </span>
            </span>
          </button>
        </div>
      </div>
    </header>
  )
}
