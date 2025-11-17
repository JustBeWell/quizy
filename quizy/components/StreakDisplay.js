import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'

export default function StreakDisplay({ userName, onClose }) {
  const [streakData, setStreakData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('StreakDisplay mounted, userName:', userName)
    if (userName) {
      fetchStreakData()
    }
  }, [userName])

  const fetchStreakData = async () => {
    try {
      console.log('Fetching streak data...')
      const token = localStorage.getItem('quiz_token')
      const response = await fetch('/api/streak', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      console.log('Streak API response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Streak data received:', data)
        setStreakData(data)
      } else {
        console.error('Streak API error:', await response.text())
      }
    } catch (error) {
      console.error('Error fetching streak:', error)
    } finally {
      setLoading(false)
    }
  }

  console.log('StreakDisplay render:', { loading, streakData })

  if (loading) {
    return (
      <div className="fixed top-20 right-4 z-50 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-sm border-2 border-brand-200 dark:border-brand-700">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-2">⏳</div>
          <p className="text-gray-600 dark:text-gray-400">Cargando racha...</p>
        </div>
      </div>
    )
  }

  if (!streakData) {
    console.log('No streak data, not rendering')
    return null
  }

  const weekDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
  const { currentStreak, longestStreak, last7Days } = streakData

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -20 }}
        transition={{ duration: 0.3, type: 'spring', stiffness: 300 }}
        className="fixed top-20 right-4 z-50 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-sm border-2 border-brand-200 dark:border-brand-700"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header with fire emoji */}
        <div className="text-center mb-4">
          <motion.div
            animate={{ 
              rotate: [0, -10, 10, -10, 0],
              scale: [1, 1.1, 1, 1.1, 1]
            }}
            transition={{ 
              duration: 0.5,
              repeat: Infinity,
              repeatDelay: 2
            }}
            className="text-5xl mb-2"
          >
            🔥
          </motion.div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            ¡Racha de {currentStreak} día{currentStreak !== 1 ? 's' : ''}!
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Récord: {longestStreak} día{longestStreak !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Week grid */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 mb-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-3 font-medium">
            Últimos 7 días
          </p>
          <div className="grid grid-cols-7 gap-2">
            {last7Days.map((day, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.05, type: 'spring', stiffness: 300 }}
                className="flex flex-col items-center"
              >
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">
                  {weekDays[day.dayOfWeek]}
                </div>
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center font-semibold text-sm transition-all ${
                    day.completed
                      ? 'bg-gradient-to-br from-green-400 to-green-600 text-white shadow-lg'
                      : day.isToday
                      ? 'bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 border-2 border-brand-400 dark:border-brand-600'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                  }`}
                >
                  {day.completed ? (
                    <motion.svg
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.05 + 0.2, type: 'spring', stiffness: 500 }}
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </motion.svg>
                  ) : (
                    day.dayNumber
                  )}
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Motivational message */}
        <div className="text-center">
          <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
            {currentStreak === 0 && "¡Empieza tu racha hoy!"}
            {currentStreak === 1 && "¡Buen comienzo! Vuelve mañana"}
            {currentStreak >= 2 && currentStreak < 7 && "¡Sigue así! 💪"}
            {currentStreak >= 7 && currentStreak < 30 && "¡Increíble constancia! 🌟"}
            {currentStreak >= 30 && "¡Eres una máquina! 🚀"}
          </p>
        </div>

        {/* Progress bar to next milestone */}
        {currentStreak < 30 && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
              <span>Siguiente hito</span>
              <span>
                {currentStreak}/{currentStreak < 7 ? 7 : currentStreak < 30 ? 30 : 100} días
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ 
                  width: `${(currentStreak / (currentStreak < 7 ? 7 : currentStreak < 30 ? 30 : 100)) * 100}%` 
                }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="bg-gradient-to-r from-brand-500 to-blue-500 h-2 rounded-full"
              />
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
