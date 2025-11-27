import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { getUser } from '../lib/auth-client'

export default function Auth(){
  const router = useRouter()
  const [mode, setMode] = useState('login') // 'login', 'register', o 'migrate'
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [enableNotifications, setEnableNotifications] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [migrationData, setMigrationData] = useState(null) // { userId, userName }

  useEffect(() => {
    // Limpiar localStorage de datos de sesión antiguos si existen
    const oldUserData = localStorage.getItem('quiz_user_data')
    if (oldUserData) {
      localStorage.removeItem('quiz_user_data')
    }

    // Si ya hay un JWT válido, redirigir a levels
    const user = getUser()
    if (user) {
      window.location.href = '/levels'
    }
  }, [])

  async function handleLogin(e){
    e.preventDefault()
    const trimmed = username.trim()
    
    if(!trimmed || trimmed.length < 2){
      setError('El nombre debe tener al menos 2 caracteres')
      return
    }

    if(!password || password.length < 6){
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed, password })
      })
      
      const data = await response.json()

      // Si es un usuario legacy (sin contraseña), mostrar migración
      if (response.status === 403 && data.error === 'legacy_user') {
        setMigrationData({ userId: data.userId, userName: data.userName })
        setMode('migrate')
        setError('')
        setPassword('')
        setLoading(false)
        return
      }

      if (!response.ok) {
        setError(data.error || 'Error al iniciar sesión')
        setLoading(false)
        return
      }

      // Verificar que tenemos los datos del usuario y el token
      if (!data.user || !data.user.name || !data.token) {
        setError('Error: datos de usuario inválidos')
        setLoading(false)
        return
      }

      // Guardar JWT token y nombre de usuario en localStorage
      localStorage.setItem('quiz_token', data.token)
      localStorage.setItem('quiz_user', trimmed)
      
      // Verificar que se guardó correctamente
      const savedToken = localStorage.getItem('quiz_token')
      
      if (!savedToken) {
        setError('Error al guardar sesión. Por favor, habilita las cookies.')
        setLoading(false)
        return
      }
      
      // Redirigir según el rol del usuario (obtenido del JWT)
      if (data.user.is_admin) {
        window.location.href = '/admin'
      } else {
        window.location.href = '/levels'
      }
    } catch(e) {
      setError('Error al iniciar sesión. Intenta de nuevo.')
      setLoading(false)
    }
  }

  async function handleMigrate(e){
    e.preventDefault()

    if(!password || password.length < 6){
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    if(password !== confirmPassword){
      setError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/migrate-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: migrationData.userId,
          userName: migrationData.userName,
          password
        })
      })
      
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Error al establecer contraseña')
        setLoading(false)
        return
      }

      // Verificar que tenemos el token y datos del usuario
      if (!data.token || !data.user) {
        setError('Error: datos de sesión inválidos')
        setLoading(false)
        return
      }

      // Guardar JWT token y nombre de usuario en localStorage
      localStorage.setItem('quiz_token', data.token)
      localStorage.setItem('quiz_user', migrationData.userName)
      
      // Redirigir según el rol del usuario
      if (data.user.is_admin) {
        window.location.href = '/admin'
      } else {
        window.location.href = '/levels'
      }
    } catch(e) {
      setError('Error al establecer contraseña. Intenta de nuevo.')
      setLoading(false)
    }
  }

  async function handleRegister(e){
    e.preventDefault()
    const trimmed = username.trim()
    const trimmedEmail = email.trim()
    
    if(!trimmed || trimmed.length < 2){
      setError('El nombre debe tener al menos 2 caracteres')
      return
    }

    if(trimmed.length > 30){
      setError('El nombre no puede tener más de 30 caracteres')
      return
    }

    // Validar email
    if(!trimmedEmail){
      setError('El email es requerido')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if(!emailRegex.test(trimmedEmail)){
      setError('Por favor ingresa un email válido')
      return
    }

    if(!password || password.length < 6){
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    if(password !== confirmPassword){
      setError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/register-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: trimmed, 
          email: trimmedEmail, 
          password,
          enableNotifications 
        })
      })
      
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Error al registrarse')
        setLoading(false)
        return
      }

      // Verificar que tenemos el token y datos del usuario
      if (!data.token || !data.user) {
        setError('Error: datos de sesión inválidos')
        setLoading(false)
        return
      }

      // Guardar JWT token y nombre de usuario en localStorage
      localStorage.setItem('quiz_token', data.token)
      localStorage.setItem('quiz_user', trimmed)
      
      // Mostrar mensaje de verificación
      alert('✓ Cuenta creada exitosamente. Por favor verifica tu email para activar tu cuenta.')
      
      // Redirigir según el rol del usuario
      if (data.user.is_admin) {
        window.location.href = '/admin'
      } else {
        window.location.href = '/levels'
      }
    } catch(e) {
      setError('Error al registrarse. Intenta de nuevo.')
      setLoading(false)
    }
  }

  const isLogin = mode === 'login'
  const isMigrate = mode === 'migrate'

  // Vista de migración para usuarios antiguos
  if (isMigrate) {
    return (
      <div className="container flex items-center justify-center min-h-[70vh]">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img src="/logo.png" alt="Quizy Logo" className="w-20 h-20 object-contain" />
            </div>
            <div className="text-6xl mb-4">🔐</div>
            <h1 className="text-4xl font-semibold mb-3">
              Bienvenido de nuevo, {migrationData?.userName}
            </h1>
            <p className="text-lg text-gray-600">
              Tu cuenta fue creada antes del sistema de contraseñas. 
              Por favor, establece una contraseña segura para proteger tu cuenta.
            </p>
          </div>

          <form onSubmit={handleMigrate} className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Nueva contraseña
              </label>
              <input
                id="password"
                type="password"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder="Al menos 6 caracteres"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={loading}
                autoFocus
              />
            </div>

            <div className="mb-4">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar contraseña
              </label>
              <input
                id="confirmPassword"
                type="password"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder="Repite tu contraseña"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full btn-primary py-3 text-lg"
              disabled={loading}
            >
              {loading ? 'Estableciendo...' : 'Establecer Contraseña'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            🔒 Tu contraseña se guardará de forma segura con encriptación
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container flex items-center justify-center min-h-[70vh]">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/logo.png" alt="Quizy Logo" className="w-20 h-20 object-contain" />
          </div>
          <h1 className="text-4xl font-semibold mb-3">
            {isLogin ? 'Bienvenido a Quizy' : 'Únete a Quizy'}
          </h1>
          <p className="text-lg text-gray-600">
            {isLogin 
              ? 'Accede a tu cuenta y continúa practicando'
              : 'Regístrate gratis y empieza a mejorar tu aprendizaje'
            }
          </p>
        </div>

        <form onSubmit={isLogin ? handleLogin : handleRegister} className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
          <div className="mb-4">
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de usuario
            </label>
            <input
              id="username"
              type="text"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              placeholder="Ej: juanperez"
              value={username}
              onChange={e => setUsername(e.target.value)}
              disabled={loading}
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1">
              Mínimo 2 caracteres, será visible públicamente
            </p>
          </div>

          {!isLogin && (
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder="tu@correo.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={loading}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                📧 Necesario para recuperar tu cuenta y usar el soporte técnico
              </p>
            </div>
          )}

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              {isLogin && (
                <button
                  type="button"
                  onClick={() => router.push('/forgot-password')}
                  className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              )}
            </div>
            <input
              id="password"
              type="password"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              placeholder={isLogin ? 'Tu contraseña' : 'Al menos 6 caracteres'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          {!isLogin && (
            <div className="mb-4">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar contraseña
              </label>
              <input
                id="confirmPassword"
                type="password"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder="Repite tu contraseña"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          )}

          {!isLogin && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableNotifications}
                  onChange={(e) => setEnableNotifications(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    🔔 Activar notificaciones
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Recibe alertas sobre tu racha de estudio, actualizaciones de ranking, nuevos contenidos y más. Puedes cambiar esto después desde tu perfil.
                  </p>
                </div>
              </label>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full btn-primary py-3 text-lg"
            disabled={loading}
          >
            {loading 
              ? (isLogin ? 'Verificando credenciales...' : 'Creando tu cuenta...') 
              : (isLogin ? 'Acceder a Quizy' : 'Crear mi cuenta gratis')
            }
          </button>
        </form>

        <div className="text-center mt-6">
          <button
            onClick={() => {
              setMode(isLogin ? 'register' : 'login')
              setError('')
              setPassword('')
              setConfirmPassword('')
            }}
            className="text-brand-600 hover:text-brand-700 font-medium text-sm"
          >
            {isLogin 
              ? '¿Primera vez en Quizy? Crear cuenta nueva →' 
              : '¿Ya tienes una cuenta? Iniciar sesión →'
            }
          </button>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          🔒 Tus datos están protegidos con encriptación de nivel bancario
        </p>
      </div>
    </div>
  )
}
