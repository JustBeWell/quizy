import '../styles/globals.css'
import Head from 'next/head'
import Header from '../components/Header'
import dynamic from 'next/dynamic'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { ThemeProvider } from '../contexts/ThemeContext'

const UserMenu = dynamic(()=>import('../components/UserMenu'), { ssr:false })
const StreakDisplay = dynamic(()=>import('../components/StreakDisplay'), { ssr:false })

export default function MyApp({ Component, pageProps }) {
  const router = useRouter()
  const [isAuthPage, setIsAuthPage] = useState(false)
  const [isLandingPage, setIsLandingPage] = useState(false)
  const [showStreak, setShowStreak] = useState(false)
  const [userName, setUserName] = useState(null)

  useEffect(() => {
    // Páginas de autenticación donde NO debe mostrarse el Header
    const authPages = ['/auth', '/forgot-password', '/reset-password', '/verify-email']
    setIsAuthPage(authPages.includes(router.pathname))
    setIsLandingPage(router.pathname === '/')
    
    // Migración única: limpiar datos antiguos de localStorage
    if (typeof window !== 'undefined') {
      const migrated = localStorage.getItem('quiz_migrated_to_jwt')
      
      if (!migrated) {
        // Solo limpiar quiz_user_data si existe (sistema antiguo)
        const oldData = localStorage.getItem('quiz_user_data')
        if (oldData) {
          localStorage.removeItem('quiz_user_data')
        }
        
        // Marcar como migrado para no volver a ejecutar
        localStorage.setItem('quiz_migrated_to_jwt', 'true')
      }
    }
  }, [router.pathname])

  // Check if user is logged in and show streak
  useEffect(() => {
    if (typeof window !== 'undefined' && !isAuthPage && !isLandingPage) {
      const token = localStorage.getItem('quiz_token')
      
      // Solo mostrar en la página principal (levels) o subjects
      const shouldShowStreak = router.pathname === '/levels' || router.pathname === '/subjects'
      
      if (token && shouldShowStreak) {
        try {
          // Decode JWT to get username (basic decode, not verification)
          const payload = JSON.parse(atob(token.split('.')[1]))
          const username = payload.name || payload.username
          setUserName(username)
          
          // Check if we should show streak (once per day per user)
          const today = new Date().toISOString().split('T')[0]
          const storageKey = `streak_shown_${username}_${today}`
          const alreadyShown = localStorage.getItem(storageKey)
          
          console.log('Streak check:', { username, today, alreadyShown, pathname: router.pathname })
          
          if (!alreadyShown) {
            // Show streak after a short delay for better UX
            setTimeout(() => {
              console.log('Showing streak display')
              setShowStreak(true)
              localStorage.setItem(storageKey, 'true')
              
              // Auto-hide after 10 seconds
              setTimeout(() => {
                setShowStreak(false)
              }, 10000)
            }, 1500)
          }
        } catch (error) {
          console.error('Error parsing JWT:', error)
        }
      }
    }
  }, [router.pathname, isAuthPage, isLandingPage])

  return (
    <ThemeProvider>
      <Head>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>Quizy — Tu app de cuestionarios web</title>
        <meta name="description" content="Plataforma de cuestionarios interactivos para mejorar tu aprendizaje. Practica con tests educativos organizados por asignaturas." />
        <meta property="og:title" content="Quizy — Tu app de cuestionarios web" />
        <meta property="og:description" content="Plataforma de cuestionarios interactivos para mejorar tu aprendizaje. Practica con tests educativos organizados por asignaturas." />
        <meta property="og:image" content="/logo.png" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Quizy — Tu app de cuestionarios web" />
        <meta name="twitter:description" content="Plataforma de cuestionarios interactivos para mejorar tu aprendizaje." />
        <meta name="twitter:image" content="/logo.png" />
      </Head>
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-[#1e1e1e] transition-colors duration-200" style={isLandingPage ? { margin: 0, padding: 0 } : {}}>
        {/* Ocultar Header en la landing page y páginas de autenticación */}
        {!isLandingPage && !isAuthPage && <Header />}

        {/* Streak Display */}
        {showStreak && userName && (
          <StreakDisplay 
            userName={userName} 
            onClose={() => setShowStreak(false)} 
          />
        )}

        <main className={isLandingPage ? "flex-1" : "flex-1 app-main"} style={isLandingPage ? { margin: 0, padding: 0 } : {}}>
          <AnimatePresence mode="wait" initial={false} exitBeforeEnter={false}>
            <motion.div
              key={router.asPath}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28 }}
              className="flex-1"
              style={isLandingPage ? { margin: 0, padding: 0 } : {}}
            >
              <Component {...pageProps} />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </ThemeProvider>
  )
}
