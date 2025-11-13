import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { getUser } from '../lib/auth-client'

export default function ResetPassword() {
  const router = useRouter()
  const [token, setToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [userName, setUserName] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    // Si ya está autenticado, redirigir a levels
    const user = getUser()
    if (user) {
      router.push('/levels')
      return
    }

    // Obtener el token de la URL
    const { token: urlToken } = router.query
    if (urlToken) {
      setToken(urlToken)
      setValidating(false)
    } else if (router.isReady) {
      // Si la URL ya está cargada y no hay token, mostrar error
      setError('Token no válido. Por favor solicita un nuevo enlace de recuperación.')
      setValidating(false)
    }
  }, [router])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    // Validaciones
    if (!newPassword) {
      setError('Por favor ingresa una contraseña')
      return
    }

    if (newPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    // Validar complejidad de la contraseña
    const hasNumber = /\d/.test(newPassword)
    const hasLetter = /[a-zA-Z]/.test(newPassword)
    
    if (!hasNumber || !hasLetter) {
      setError('La contraseña debe contener letras y números')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token, 
          newPassword 
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Error al restablecer la contraseña')
        setLoading(false)
        return
      }

      // Éxito
      setSuccess(true)
      setUserName(data.userName || '')
      setNewPassword('')
      setConfirmPassword('')

      // Redirigir al login después de 3 segundos
      setTimeout(() => {
        router.push('/auth')
      }, 3000)

    } catch (err) {
      setError('Error de conexión. Por favor, intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  // Estado de carga inicial
  if (validating) {
    return (
      <div className="container mx-auto px-4 flex items-center justify-center min-h-[70vh]">
        <div className="max-w-md w-full text-center">
          {/* Logo y marca */}
          <div className="mb-8">
            <div className="flex justify-center mb-4">
              <img src="/logo.png" alt="Quizy Logo" className="w-20 h-20 object-contain" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Quizy</h2>
          </div>
          
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Validando enlace...</p>
        </div>
      </div>
    )
  }

  // Error de token no válido
  if (!token) {
    return (
      <div className="container mx-auto px-4 flex items-center justify-center min-h-[70vh]">
        <div className="max-w-md w-full">
          {/* Logo y marca */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img src="/logo.png" alt="Quizy Logo" className="w-20 h-20 object-contain" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Quizy</h2>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full mb-4">
                <svg 
                  className="w-8 h-8 text-red-600 dark:text-red-300" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path 
                    fillRule="evenodd" 
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
                    clipRule="evenodd" 
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                Enlace no válido
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
                {error}
              </p>
              <button
                onClick={() => router.push('/forgot-password')}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition"
              >
                Solicitar nuevo enlace
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 flex items-center justify-center min-h-[70vh]">
      <div className="max-w-md w-full">
        {/* Logo y marca */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/logo.png" alt="Quizy Logo" className="w-20 h-20 object-contain" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Quizy</h2>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
          {/* Encabezado */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
              <svg 
                className="w-8 h-8 text-blue-600 dark:text-blue-300" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
              Restablecer contraseña
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Ingresa tu nueva contraseña
            </p>
          </div>

          {/* Mensaje de éxito */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-start">
                <svg 
                  className="w-5 h-5 text-green-600 dark:text-green-400 mr-3 mt-0.5 flex-shrink-0" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path 
                    fillRule="evenodd" 
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                    clipRule="evenodd" 
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-300 mb-1">
                    ¡Contraseña actualizada!
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-400">
                    {userName && `Hola ${userName}, tu `}contraseña ha sido restablecida correctamente.
                    Redirigiendo al inicio de sesión...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Mensaje de error */}
          {error && !success && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start">
                <svg 
                  className="w-5 h-5 text-red-600 dark:text-red-400 mr-3 mt-0.5 flex-shrink-0" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path 
                    fillRule="evenodd" 
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
                    clipRule="evenodd" 
                  />
                </svg>
                <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}

          {/* Formulario */}
          {!success && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Nueva contraseña */}
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    disabled={loading}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Debe contener al menos 8 caracteres, letras y números
                </p>
              </div>

              {/* Confirmar contraseña */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirmar contraseña
                </label>
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la contraseña"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  disabled={loading}
                />
              </div>

              {/* Indicador de fortaleza */}
              {newPassword && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-xs">
                    <div className={`flex-1 h-1 rounded ${
                      newPassword.length >= 8 ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                    }`} />
                    <div className={`flex-1 h-1 rounded ${
                      /[a-zA-Z]/.test(newPassword) && /\d/.test(newPassword) ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                    }`} />
                    <div className={`flex-1 h-1 rounded ${
                      newPassword.length >= 12 ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                    }`} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      newPassword.length >= 8 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                      ✓ Mínimo 8 caracteres
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      /[a-zA-Z]/.test(newPassword) && /\d/.test(newPassword) ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                      ✓ Letras y números
                    </span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !newPassword || !confirmPassword}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg 
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" 
                      fill="none" 
                      viewBox="0 0 24 24"
                    >
                      <circle 
                        className="opacity-25" 
                        cx="12" 
                        cy="12" 
                        r="10" 
                        stroke="currentColor" 
                        strokeWidth="4"
                      />
                      <path 
                        className="opacity-75" 
                        fill="currentColor" 
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Actualizando...
                  </span>
                ) : (
                  'Restablecer contraseña'
                )}
              </button>
            </form>
          )}

          {/* Enlaces adicionales */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center space-y-3">
              {!success && (
                <>
                  <button
                    onClick={() => router.push('/auth')}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                  >
                    ← Volver al inicio de sesión
                  </button>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    ¿Problemas con el enlace?{' '}
                    <button 
                      onClick={() => router.push('/forgot-password')}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline"
                    >
                      Solicita uno nuevo
                    </button>
                  </p>
                </>
              )}
              {success && (
                <button
                  onClick={() => router.push('/auth')}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                >
                  Ir al inicio de sesión →
                </button>
              )}
            </div>
          </div>

          {/* Información de seguridad */}
          {!success && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                🔒 <strong>Seguridad:</strong> Tu nueva contraseña debe ser diferente a la anterior
                y este enlace solo puede usarse una vez.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
