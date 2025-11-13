import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function VerifyEmail() {
  const router = useRouter()
  const { token, success, error } = router.query
  const [status, setStatus] = useState('verifying') // verifying, success, error
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (success === 'true') {
      setStatus('success')
      setMessage('Email verificado correctamente')
      
      // Redirigir automáticamente al perfil después de 2 segundos
      setTimeout(() => {
        router.push('/profile')
      }, 2000)
    } else if (error) {
      setStatus('error')
      switch (error) {
        case 'invalid_token':
          setMessage('El link de verificación es inválido o ya fue usado')
          break
        case 'expired_token':
          setMessage('El link de verificación ha expirado. Solicita uno nuevo.')
          break
        case 'server_error':
          setMessage('Error del servidor. Por favor, intenta de nuevo más tarde.')
          break
        default:
          setMessage('Error desconocido al verificar el email')
      }
    } else if (token) {
      // Si hay token pero no hay success/error, hacer la verificación por API
      verifyEmail(token)
    }
  }, [token, success, error, router])

  async function verifyEmail(verificationToken) {
    try {
      const response = await fetch(`/api/auth/verify-email?token=${verificationToken}`)
      const data = await response.json()

      if (response.ok) {
        setStatus('success')
        setMessage(data.message)
      } else {
        setStatus('error')
        setMessage(data.error)
      }
    } catch (error) {
      setStatus('error')
      setMessage('Error al verificar el email. Por favor, intenta de nuevo.')
    }
  }

  return (
    <div className="container flex items-center justify-center min-h-[70vh]">
      <div className="max-w-md w-full text-center">
        {status === 'verifying' && (
          <div>
            <div className="text-6xl mb-4">⏳</div>
            <h1 className="text-3xl font-bold mb-3">Verificando email...</h1>
            <p className="text-gray-600">Por favor espera un momento</p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div className="text-6xl mb-4">✓</div>
            <h1 className="text-3xl font-bold mb-3 text-green-600">
              ¡Email Verificado!
            </h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <p className="text-gray-600 mb-6">
              Redirigiendo a tu perfil...
            </p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-3xl font-bold mb-3 text-red-600">
              Error de Verificación
            </h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="space-y-3">
              <Link href="/support" className="block px-6 py-3 bg-blue-700 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-800 dark:hover:bg-blue-700 transition-colors font-semibold">
                Solicitar nuevo email
              </Link>
                            <Link href="/levels" className="block px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors">
                Ir al inicio
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
