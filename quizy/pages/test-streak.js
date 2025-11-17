import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import StreakDisplay from '../components/StreakDisplay'

export default function TestStreak() {
  const [showStreak, setShowStreak] = useState(false)
  const [userName, setUserName] = useState(null)
  const [storageKeys, setStorageKeys] = useState([])

  useEffect(() => {
    // Get username from JWT
    console.log('TestStreak: Checking for token...')
    const token = localStorage.getItem('quiz_token')
    console.log('TestStreak: Token found:', !!token)
    
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        console.log('TestStreak: JWT payload:', payload)
        const username = payload.name || payload.username
        console.log('TestStreak: Username:', username)
        setUserName(username)
      } catch (e) {
        console.error('Error parsing JWT:', e)
      }
    } else {
      console.log('TestStreak: No token found in localStorage')
    }

    // Get all streak-related localStorage keys
    updateStorageKeys()
  }, [])

  const updateStorageKeys = () => {
    const keys = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('streak_shown_')) {
        keys.push(key)
      }
    }
    setStorageKeys(keys)
  }

  const clearStreakStorage = () => {
    const keys = []
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i)
      if (key?.startsWith('streak_shown_')) {
        localStorage.removeItem(key)
        keys.push(key)
      }
    }
    alert(`Limpiadas ${keys.length} entradas de localStorage`)
    updateStorageKeys()
  }

  const testStreak = () => {
    setShowStreak(true)
    setTimeout(() => setShowStreak(false), 15000)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
          🔥 Test de Racha de Días
        </h1>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Usuario actual
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {userName ? (
              <>Usuario: <strong>{userName}</strong></>
            ) : (
              'No has iniciado sesión'
            )}
          </p>
          
          <div className="mt-4 space-y-2">
            <button
              onClick={() => {
                const token = localStorage.getItem('quiz_token')
                console.log('Token completo:', token)
                if (token) {
                  try {
                    const payload = JSON.parse(atob(token.split('.')[1]))
                    console.log('JWT Payload:', payload)
                    alert(`Token encontrado!\n\nUsuario: ${payload.name || payload.username || 'N/A'}\nID: ${payload.id || 'N/A'}`)
                  } catch (e) {
                    alert('Error al decodificar el token: ' + e.message)
                  }
                } else {
                  alert('No se encontró token en localStorage')
                }
              }}
              className="w-full px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
            >
              🔍 Inspeccionar Token JWT
            </button>
            
            <button
              onClick={() => {
                const allKeys = []
                for (let i = 0; i < localStorage.length; i++) {
                  allKeys.push(localStorage.key(i))
                }
                console.log('Todas las claves en localStorage:', allKeys)
                alert(`Claves en localStorage (${allKeys.length}):\n\n${allKeys.join('\n')}`)
              }}
              className="w-full px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
            >
              📋 Ver todo el localStorage
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Acciones de prueba
          </h2>
          
          <div className="space-y-3">
            <button
              onClick={testStreak}
              disabled={!userName}
              className="w-full px-6 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
            >
              🔥 Mostrar Racha Ahora
            </button>

            <button
              onClick={clearStreakStorage}
              className="w-full px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-semibold"
            >
              🗑️ Limpiar LocalStorage (Resetear "ya mostrado")
            </button>

            <button
              onClick={() => window.location.reload()}
              className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
            >
              🔄 Recargar Página
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Estado de LocalStorage
          </h2>
          
          {storageKeys.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Entradas encontradas ({storageKeys.length}):
              </p>
              {storageKeys.map((key, idx) => (
                <div key={idx} className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded font-mono text-gray-700 dark:text-gray-300">
                  {key}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">
              No hay entradas de racha guardadas. La racha se mostrará automáticamente.
            </p>
          )}

          <button
            onClick={updateStorageKeys}
            className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            🔍 Actualizar Estado
          </button>
        </div>

        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
          <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
            💡 Cómo funciona
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-2">
            <li>• La racha se muestra automáticamente <strong>una vez al día</strong> cuando entras a la app</li>
            <li>• Se guarda en localStorage con tu usuario y la fecha actual</li>
            <li>• Si limpias el localStorage, volverá a mostrarse al recargar</li>
            <li>• El botón "Mostrar Racha Ahora" te permite verla en cualquier momento para testing</li>
          </ul>
        </div>
      </div>

      {showStreak && userName && (
        <StreakDisplay userName={userName} onClose={() => setShowStreak(false)} />
      )}
    </div>
  )
}
