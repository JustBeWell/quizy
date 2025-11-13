import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { getToken } from '../lib/auth-client'

export default function Profile() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [attempts, setAttempts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeAttempts, setActiveAttempts] = useState([])
  const [subjects, setSubjects] = useState([])
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [userEmail, setUserEmail] = useState(null)
  const [emailVerified, setEmailVerified] = useState(false)
  
  // Estados para cambio de contraseña
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [showPasswords, setShowPasswords] = useState(false)
  
  // Estados para favoritos
  const [favorites, setFavorites] = useState([])
  const [favoritesLoading, setFavoritesLoading] = useState(true)

  useEffect(() => {
    // Cargar usuario actual
    const loadProfile = async () => {
      try {
        const userName = localStorage.getItem('quiz_user')
        const userData = JSON.parse(localStorage.getItem('quiz_user_data') || '{}')
        
        if (!userName) {
          router.replace('/auth')
          return
        }
        
        // Obtener información completa del usuario desde la API
        const token = getToken()
        if (token) {
          try {
            // Obtener información completa desde la API
            const userInfoRes = await fetch('/api/user-info', {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            })
            if (userInfoRes.ok) {
              const userInfo = await userInfoRes.json()
              // Actualizar el usuario con toda la información de la BD
              setUser({
                name: userInfo.name || userName,
                email: userInfo.email,
                createdAt: userInfo.created_at,
                isAdmin: userInfo.is_admin,
                ...userData
              })
              setUserEmail(userInfo.email || null)
              setEmailVerified(userInfo.email_verified || false)
            } else {
              // Si falla la API, usar datos de localStorage
              setUser({ name: userName, ...userData })
            }
          } catch (e) {
            console.error('Error getting user info:', e)
            // Fallback a localStorage si hay error
            setUser({ name: userName, ...userData })
          }
        } else {
          // Si no hay token, usar datos de localStorage
          setUser({ name: userName, ...userData })
        }
        
        // Cargar intentos del usuario desde la BD
        const response = await fetch(`/api/attempts?user_name=${encodeURIComponent(userName)}`)
        const data = await response.json()
        setAttempts(data)
        
        // Cargar asignaturas
        const subjectsRes = await fetch('/api/subjects')
        const subjectsData = await subjectsRes.json()
        if (subjectsRes.ok && subjectsData.subjects) {
          setSubjects(subjectsData.subjects)
        }
        
        // Detectar intentos activos desde localStorage (esperar a que termine)
        await detectActiveAttempts(subjectsData.subjects || [])
        
        setLoading(false)
      } catch(e) {
        console.error('Error:', e)
        setLoading(false)
      }
    }
    
    loadProfile()
  }, [])

  // Cargar favoritos
  useEffect(() => {
    const loadFavorites = async () => {
      setFavoritesLoading(true)
      try {
        const token = getToken()
        if (!token) {
          console.log('No hay token para cargar favoritos')
          setFavoritesLoading(false)
          return
        }
        const res = await fetch('/api/favorites', {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        if (res.status === 401) {
          console.log('Token inválido al cargar favoritos en profile')
          setFavoritesLoading(false)
          return
        }
        
        if (res.ok) {
          const data = await res.json()
          setFavorites(data.favorites || [])
        }
      } catch (err) {
        console.error('Error loading favorites:', err)
      } finally {
        setFavoritesLoading(false)
      }
    }
    loadFavorites()
  }, [])

  // Detectar intentos activos sin completar
  const detectActiveAttempts = async (subjectsList) => {
    console.log('🔍 Detectando intentos activos...')
    console.log('📋 Total claves en localStorage:', localStorage.length)
    
    // Listar todas las claves de localStorage para debug
    const allKeys = []
    for (let i = 0; i < localStorage.length; i++) {
      allKeys.push(localStorage.key(i))
    }
    console.log('🔑 Todas las claves en localStorage:', allKeys)
    
    const active = []
    
    // Primero, cargar todos los bancos de todas las asignaturas
    const allBanks = []
    for (const subject of subjectsList) {
      try {
        const banksRes = await fetch(`/api/banks?subject=${encodeURIComponent(subject.slug)}`)
        if (banksRes.ok) {
          const banksData = await banksRes.json()
          banksData.forEach(bank => {
            allBanks.push({ ...bank, subject })
          })
        }
      } catch (e) {
        console.error('Error loading banks for subject:', subject.name, e)
      }
    }
    
    console.log('📦 Total bancos cargados:', allBanks.length)
    
    // Recorrer todas las claves de localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      
      // Buscar claves que empiecen con quiz_ y terminen con _answers
      if (key && key.startsWith('quiz_') && key.endsWith('_answers')) {
        const bankId = key.replace('quiz_', '').replace('_answers', '')
        const isCompleted = localStorage.getItem(`quiz_${bankId}_completed`) === 'true'
        
        console.log(`📝 Encontrado localStorage key: ${key}, bankId: ${bankId}, completado: ${isCompleted}`)
        
        // Si no está completado, es un intento activo
        if (!isCompleted) {
          const answersStr = localStorage.getItem(key)
          console.log(`   → Contenido de answers:`, answersStr)
          const answers = JSON.parse(answersStr || '{}')
          const answeredCount = Object.keys(answers).length
          
          console.log(`   → Respuestas guardadas: ${answeredCount}`)
          console.log(`   → Keys de respuestas:`, Object.keys(answers))
          
          // Solo considerar si tiene al menos una respuesta
          if (answeredCount > 0) {
            // Buscar el banco en la lista precargada
            const bankInfo = allBanks.find(b => b.id === bankId)
            
            if (bankInfo) {
              // Tenemos la info del banco precargada, cargar detalles con subject
              try {
                const bankUrl = bankInfo.subject 
                  ? `/api/bank/${bankId}?subject=${encodeURIComponent(bankInfo.subject.slug)}`
                  : `/api/bank/${bankId}`
                
                console.log(`   → Cargando banco desde: ${bankUrl}`)
                const bankRes = await fetch(bankUrl)
                
                if (bankRes.ok) {
                  const bankData = await bankRes.json()
                  const totalQuestions = bankData.questions?.length || 0
                  
                  const attemptInfo = {
                    bankId,
                    bankName: bankData.name || bankInfo.name || bankId,
                    answeredCount,
                    totalQuestions,
                    subject: bankInfo.subject
                  }
                  
                  active.push(attemptInfo)
                  console.log('   ✅ Intento activo agregado:', attemptInfo)
                } else {
                  console.log('   ❌ Error al cargar banco desde API:', bankRes.status)
                }
              } catch (e) {
                console.error('   ❌ Error loading bank info:', e)
              }
            } else {
              console.log(`   ⚠️ Banco ${bankId} no encontrado en la lista de bancos`)
            }
          }
        }
      }
    }
    
    console.log('✅ Total intentos activos encontrados:', active.length)
    console.log('📋 Array de intentos activos:', active)
    setActiveAttempts(active)
    console.log('🔄 setActiveAttempts llamado con', active.length, 'intentos')
  }

  // Borrar un intento activo
  const deleteActiveAttempt = (bankId) => {
    if (confirm('¿Estás seguro de que quieres borrar este intento? Se perderá todo el progreso guardado.')) {
      // Eliminar todas las claves relacionadas con este banco
      localStorage.removeItem(`quiz_${bankId}_answers`)
      localStorage.removeItem(`quiz_${bankId}_flags`)
      localStorage.removeItem(`quiz_${bankId}_checked`)
      localStorage.removeItem(`quiz_${bankId}_time`)
      localStorage.removeItem(`quiz_${bankId}_completed`)
      
      // Actualizar la lista de intentos activos
      setActiveAttempts(activeAttempts.filter(a => a.bankId !== bankId))
    }
  }

  // Borrar un favorito
  const removeFavorite = async (bankId, subjectSlug) => {
    if (!confirm('¿Estás seguro de que quieres quitar este cuestionario de favoritos?')) return
    try {
      const token = getToken()
      if (!token) {
        alert('Debes iniciar sesión')
        return
      }
      
      const res = await fetch('/api/favorites', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bank_id: bankId, subject_slug: subjectSlug })
      })
      
      if (res.status === 401) {
        alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.')
        localStorage.removeItem('quiz_token')
        router.push('/auth')
        return
      }
      
      if (res.ok) {
        setFavorites(favorites.filter(f => f.bank_id !== bankId))
      } else {
        const err = await res.json().catch(() => ({}))
        alert(err.error || 'Error al eliminar favorito')
      }
    } catch (err) {
      console.error('Error removing favorite:', err)
      alert('Error al eliminar favorito')
    }
  }

  // Actualizar email
  const handleUpdateEmail = async (e) => {
    e.preventDefault()
    
    if (!newEmail.trim()) {
      setEmailError('Por favor ingresa un email')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail.trim())) {
      setEmailError('Por favor ingresa un email válido')
      return
    }

    setEmailLoading(true)
    setEmailError('')

    try {
      const token = getToken()
      const response = await fetch('/api/update-email', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: newEmail.trim() })
      })

      const data = await response.json()

      if (response.ok) {
        // Actualizar el token en localStorage
        localStorage.setItem('quiz_token', data.token)
        
        // Actualizar el estado
        setUserEmail(data.user.email)
        setEmailVerified(false)
        setShowEmailForm(false)
        setNewEmail('')
        
        alert('✓ Email actualizado correctamente. Por favor verifica tu email.')
        
        // Ofrecer enviar verificación
        if (confirm('¿Deseas enviar un email de verificación ahora?')) {
          await handleSendVerification()
        }
      } else {
        setEmailError(data.error || 'Error al actualizar email')
      }
    } catch (error) {
      console.error('Error:', error)
      setEmailError('Error al actualizar email. Intenta de nuevo.')
    } finally {
      setEmailLoading(false)
    }
  }

  // Enviar email de verificación
  const handleSendVerification = async () => {
    try {
      const token = getToken()
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (response.ok) {
        alert('✓ ' + data.message + '\n\nRevisa tu bandeja de entrada.')
        
        // En desarrollo, mostrar el link
        if (data.verificationUrl) {
          console.log('Verification URL:', data.verificationUrl)
          if (confirm('En desarrollo: ¿Abrir link de verificación ahora?')) {
            window.open(data.verificationUrl, '_blank')
          }
        }
      } else {
        alert('Error: ' + data.error)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al enviar email de verificación')
    }
  }

  // Cambiar contraseña
  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess(false)

    // Validaciones
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Todos los campos son requeridos')
      return
    }

    if (newPassword.length < 8) {
      setPasswordError('La nueva contraseña debe tener al menos 8 caracteres')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas nuevas no coinciden')
      return
    }

    // Validar complejidad
    const hasNumber = /\d/.test(newPassword)
    const hasLetter = /[a-zA-Z]/.test(newPassword)
    
    if (!hasNumber || !hasLetter) {
      setPasswordError('La contraseña debe contener letras y números')
      return
    }

    setPasswordLoading(true)

    try {
      const token = getToken()
      const response = await fetch('/api/change-password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          currentPassword, 
          newPassword 
        })
      })

      const data = await response.json()

      if (response.ok) {
        setPasswordSuccess(true)
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        
        // Cerrar el formulario después de 2 segundos
        setTimeout(() => {
          setShowPasswordForm(false)
          setPasswordSuccess(false)
        }, 2000)
      } else {
        setPasswordError(data.error || 'Error al cambiar la contraseña')
      }
    } catch (error) {
      console.error('Error:', error)
      setPasswordError('Error al cambiar la contraseña. Intenta de nuevo.')
    } finally {
      setPasswordLoading(false)
    }
  }

  // Agrupar intentos activos por asignatura
  const groupedActiveAttempts = activeAttempts.reduce((acc, attempt) => {
    const subjectName = attempt.subject?.name || 'Sin asignatura'
    if (!acc[subjectName]) {
      acc[subjectName] = []
    }
    acc[subjectName].push(attempt)
    return acc
  }, {})

  // Agrupar intentos completados por asignatura
  const groupedCompletedAttempts = attempts.reduce((acc, attempt) => {
    const subjectName = attempt.subject_name || 'Sin asignatura'
    if (!acc[subjectName]) {
      acc[subjectName] = []
    }
    acc[subjectName].push(attempt)
    return acc
  }, {})

  // Agrupar favoritos por asignatura
  const groupedFavorites = favorites.reduce((acc, fav) => {
    const subjectName = fav.subject_name || 'Sin asignatura'
    if (!acc[subjectName]) {
      acc[subjectName] = []
    }
    acc[subjectName].push(fav)
    return acc
  }, {})

  const formatDate = (dateStr) => {
    if(!dateStr) return 'Fecha no disponible'
    try {
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return 'Fecha no disponible'
      return date.toLocaleDateString('es-ES', { 
        day: 'numeric', 
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch(e) {
      return 'Fecha no disponible'
    }
  }

  const formatDateOnly = (dateStr) => {
    if(!dateStr) return 'Fecha no disponible'
    try {
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return 'Fecha no disponible'
      return date.toLocaleDateString('es-ES', { 
        day: 'numeric', 
        month: 'long',
        year: 'numeric'
      })
    } catch(e) {
      return 'Fecha no disponible'
    }
  }

  const getScoreColor = (score) => {
    if(score >= 80) return 'text-green-600'
    if(score >= 60) return 'text-blue-600'
    if(score >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  const stats = {
    totalAttempts: attempts.length,
    avgScore: attempts.length > 0 
      ? Math.round(attempts.reduce((sum, a) => sum + (a.score || 0), 0) / attempts.length)
      : 0,
    bestScore: attempts.length > 0
      ? Math.max(...attempts.map(a => a.score || 0))
      : 0
  }

  if (loading || !user) {
    return (
      <div className="container py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  console.log('🎨 Renderizando Profile con activeAttempts:', activeAttempts.length, activeAttempts)

  return (
    <div className="container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-semibold">👤 Mi Perfil</h2>
          <p className="text-gray-600 text-sm mt-1">Consulta tus estadísticas y gestiona tu cuenta</p>
        </div>
        <Link href="/subjects" className="btn-ghost">← Volver a Asignaturas</Link>
      </div>

      {/* Navegación móvil - Breadcrumb tabs */}
      <div className="md:hidden mb-6 overflow-x-auto">
        <div className="flex gap-2 pb-2">
          <Link href="/profile">
                        <a className="px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap bg-brand-700 dark:bg-brand-500 text-white shadow-sm hover:bg-brand-800 dark:hover:bg-brand-600 transition-colors">
              Perfil
            </a>
          </Link>
          <Link href="/ranking">
            <a className="px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 transition-colors">
              🏆 Ranking Global
            </a>
          </Link>
          <Link href="/support">
            <a className="px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 transition-colors">
              💬 Ayuda
            </a>
          </Link>
        </div>
      </div>

      {/* Información del usuario */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 rounded-full bg-brand-700 dark:bg-brand-500 text-white flex items-center justify-center text-3xl font-semibold shadow-lg">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-semibold text-gray-900">{user.name}</h3>
            <p className="text-sm text-gray-500 mt-1">
              🎓 Miembro activo desde {formatDateOnly(user.createdAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Gestión de Email */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h4 className="text-lg font-semibold mb-4">📧 Correo Electrónico</h4>
        
        {userEmail ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-700">{userEmail}</p>
                <div className="flex items-center gap-2 mt-1">
                  {emailVerified ? (
                    <span className="text-sm text-green-600 flex items-center gap-1">
                      ✓ Correo verificado
                    </span>
                  ) : (
                    <span className="text-sm text-orange-600 flex items-center gap-1">
                      ⚠️ Pendiente de verificación
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowEmailForm(!showEmailForm)}
                className="text-sm text-brand-600 hover:text-brand-700 font-medium"
              >
                Cambiar correo
              </button>
            </div>
            
            {!emailVerified && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-3">
                <p className="text-sm text-orange-800 mb-2">
                  Verifica tu correo para poder usar el sistema de soporte y recibir notificaciones.
                </p>
                <button
                  onClick={handleSendVerification}
                  className="text-sm px-4 py-2 bg-brand-700 dark:bg-brand-600 text-white rounded-lg hover:bg-brand-800 dark:hover:bg-brand-700 transition-colors font-semibold"
                >
                  Enviar correo de verificación
                </button>
              </div>
            )}
          </div>
        ) : (
          <div>
            <p className="text-gray-600 mb-3">
              Añade un correo electrónico para poder usar el sistema de ayuda y soporte.
            </p>
            <button
              onClick={() => setShowEmailForm(true)}
              className="px-4 py-2 bg-brand-700 dark:bg-brand-600 text-white rounded-lg hover:bg-brand-800 dark:hover:bg-brand-700 transition-colors font-semibold"
            >
              + Añadir correo electrónico
            </button>
          </div>
        )}

        {showEmailForm && (
          <form onSubmit={handleUpdateEmail} className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {userEmail ? 'Nuevo correo electrónico' : 'Correo electrónico'}
            </label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="tu@correo.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 mb-3"
              disabled={emailLoading}
            />
            <p className="text-xs text-gray-500 mb-3">
              Recibirás un correo de verificación para confirmar tu dirección
            </p>
            
            {emailError && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {emailError}
              </div>
            )}
            
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={emailLoading}
                className="px-4 py-2 bg-brand-700 dark:bg-brand-600 text-white rounded-lg hover:bg-brand-800 dark:hover:bg-brand-700 disabled:opacity-50 transition-colors font-semibold"
              >
                {emailLoading ? 'Guardando...' : 'Guardar cambios'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowEmailForm(false)
                  setNewEmail('')
                  setEmailError('')
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Cambio de Contraseña */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-lg font-semibold">🔒 Contraseña</h4>
            <p className="text-sm text-gray-500 mt-1">Mantén tu cuenta segura con una contraseña fuerte</p>
          </div>
          <button
            onClick={() => {
              setShowPasswordForm(!showPasswordForm)
              setPasswordError('')
              setPasswordSuccess(false)
            }}
            className="text-sm text-brand-600 hover:text-brand-700 font-medium"
          >
            {showPasswordForm ? 'Cancelar' : 'Cambiar contraseña'}
          </button>
        </div>

        {!showPasswordForm && (
          <p className="text-gray-600 text-sm">
            Última actualización: Hace algún tiempo
          </p>
        )}

        {showPasswordForm && (
          <form onSubmit={handleChangePassword} className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            {/* Mensaje de éxito */}
            {passwordSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                ¡Contraseña actualizada correctamente!
              </div>
            )}

            {/* Mensaje de error */}
            {passwordError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {passwordError}
              </div>
            )}

            {/* Contraseña actual */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña actual
              </label>
              <div className="relative">
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Tu contraseña actual"
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                  disabled={passwordLoading || passwordSuccess}
                />
              </div>
            </div>

            {/* Nueva contraseña */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nueva contraseña
              </label>
              <div className="relative">
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                  disabled={passwordLoading || passwordSuccess}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Debe contener al menos 8 caracteres, letras y números
              </p>
            </div>

            {/* Confirmar nueva contraseña */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar nueva contraseña
              </label>
              <div className="relative">
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la nueva contraseña"
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                  disabled={passwordLoading || passwordSuccess}
                />
              </div>
            </div>

            {/* Checkbox para mostrar/ocultar contraseñas */}
            <div className="mb-4">
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPasswords}
                  onChange={(e) => setShowPasswords(e.target.checked)}
                  className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                Mostrar contraseñas
              </label>
            </div>

            {/* Indicador de fortaleza */}
            {newPassword && (
              <div className="mb-4 space-y-2">
                <div className="flex items-center space-x-2 text-xs">
                  <div className={`flex-1 h-1 rounded ${
                    newPassword.length >= 8 ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                  <div className={`flex-1 h-1 rounded ${
                    /[a-zA-Z]/.test(newPassword) && /\d/.test(newPassword) ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                  <div className={`flex-1 h-1 rounded ${
                    newPassword.length >= 12 ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`text-xs px-2 py-1 rounded ${
                    newPassword.length >= 8 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    ✓ Mínimo 8 caracteres
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    /[a-zA-Z]/.test(newPassword) && /\d/.test(newPassword) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    ✓ Letras y números
                  </span>
                </div>
              </div>
            )}

            {/* Botones */}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={passwordLoading || passwordSuccess}
                className="px-4 py-2 bg-brand-700 text-white rounded-lg hover:bg-brand-800 disabled:opacity-50 transition-colors font-semibold"
              >
                {passwordLoading ? 'Actualizando...' : 'Cambiar contraseña'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordForm(false)
                  setCurrentPassword('')
                  setNewPassword('')
                  setConfirmPassword('')
                  setPasswordError('')
                  setPasswordSuccess(false)
                }}
                disabled={passwordLoading}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">
                💡 <strong>Consejo:</strong> Usa una contraseña única que no uses en otros sitios.
                Si olvidaste tu contraseña actual, puedes usar el enlace de{' '}
                <button 
                  type="button"
                  onClick={() => router.push('/forgot-password')}
                  className="text-blue-600 hover:text-blue-700 underline font-medium"
                >
                  recuperación de contraseña
                </button>
                .
              </p>
            </div>
          </form>
        )}
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="text-sm text-gray-600 mb-1">📝 Cuestionarios realizados</div>
          <div className="text-3xl font-bold text-brand-600">{stats.totalAttempts}</div>
          <div className="text-xs text-gray-500 mt-1">Total de intentos completados</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="text-sm text-gray-600 mb-1">📊 Puntuación promedio</div>
          <div className="text-3xl font-bold text-blue-600">{stats.avgScore}%</div>
          <div className="text-xs text-gray-500 mt-1">Media de todas tus pruebas</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="text-sm text-gray-600 mb-1">🏆 Mejor resultado</div>
          <div className="text-3xl font-bold text-green-600">{stats.bestScore}%</div>
          <div className="text-xs text-gray-500 mt-1">Tu máxima puntuación</div>
        </div>
      </div>

      {/* Favoritos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold">⭐ Mis Favoritos</h3>
          <p className="text-sm text-gray-600 mt-1">
            {favoritesLoading 
              ? 'Cargando favoritos...'
              : favorites.length > 0 
                ? `Tienes ${favorites.length} ${favorites.length === 1 ? 'cuestionario marcado' : 'cuestionarios marcados'} como favorito`
                : 'Aún no tienes cuestionarios marcados como favoritos'
            }
          </p>
        </div>
        
        {favoritesLoading ? (
          <div className="px-6 py-8 text-center text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto mb-2"></div>
            <p className="text-sm">Cargando favoritos...</p>
          </div>
        ) : favorites.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            <p className="mb-2">⭐ No tienes favoritos guardados</p>
            <p className="text-sm">Marca cuestionarios con la estrella para acceder a ellos rápidamente desde aquí.</p>
          </div>
        ) : (
          <div className="p-6">
            {Object.entries(groupedFavorites).map(([subjectName, favs]) => (
              <div key={subjectName} className="mb-6 last:mb-0">
                <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                  {subjectName}
                </h4>
                <div className="space-y-3">
                  {favs.map((fav) => (
                    <div 
                      key={fav.bank_id} 
                      className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{fav.bank_name}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          Añadido el {formatDate(fav.created_at)}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href={`/quiz/${fav.bank_id}?subject=${encodeURIComponent(fav.subject_slug)}`}
                          className="px-4 py-2 bg-brand-700 dark:bg-brand-500 text-white rounded-lg hover:bg-brand-800 dark:hover:bg-brand-600 transition-colors text-sm font-semibold"
                        >
                          ▶️ Realizar
                        </Link>
                        <button
                          onClick={() => removeFavorite(fav.bank_id, fav.subject_slug)}
                          className="px-4 py-2 bg-red-700 dark:bg-red-600 text-white rounded-lg hover:bg-red-800 dark:hover:bg-red-700 transition-colors text-sm font-semibold"
                          title="Quitar de favoritos"
                        >
                          🗑️ Quitar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Intentos activos sin completar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold">⏳ Cuestionarios en Progreso</h3>
          <p className="text-sm text-gray-600 mt-1">
            {activeAttempts.length > 0 
              ? `Tienes ${activeAttempts.length} ${activeAttempts.length === 1 ? 'cuestionario pendiente' : 'cuestionarios pendientes'} de finalizar`
              : 'No tienes cuestionarios pendientes de completar'
            }
          </p>
        </div>
        
        {activeAttempts.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            <p className="mb-2">✓ No tienes cuestionarios pendientes</p>
            <p className="text-sm">Cuando inicies un cuestionario y lo dejes sin terminar, aparecerá aquí para que puedas continuarlo.</p>
          </div>
        ) : (
          <div className="p-6">
            {Object.entries(groupedActiveAttempts).map(([subjectName, attempts]) => (
              <div key={subjectName} className="mb-6 last:mb-0">
                <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  {subjectName}
                </h4>
                <div className="space-y-3">
                  {attempts.map((attempt) => (
                    <div 
                      key={attempt.bankId} 
                      className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{attempt.bankName}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          Progreso: {attempt.answeredCount} de {attempt.totalQuestions} preguntas respondidas
                          {attempt.totalQuestions > 0 && (
                            <span className="ml-2 text-orange-600 font-medium">
                              ({Math.round((attempt.answeredCount / attempt.totalQuestions) * 100)}%)
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteActiveAttempt(attempt.bankId)}
                        className="px-4 py-2 bg-red-700 dark:bg-red-600 text-white rounded-lg hover:bg-red-800 dark:hover:bg-red-700 transition-colors text-sm font-semibold"
                        title="Borrar intento incompleto"
                      >
                        🗑️ Borrar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Historial de intentos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold">📚 Historial de Cuestionarios Completados</h3>
          <p className="text-sm text-gray-600 mt-1">Consulta todos los cuestionarios que has finalizado y sus resultados</p>
        </div>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando tu historial...</p>
          </div>
        ) : attempts.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <div className="text-4xl mb-3">📝</div>
            <p className="text-lg mb-2">Aún no has completado ningún cuestionario</p>
            <p className="text-sm text-gray-400 mb-4">Empieza a practicar para ver tu progreso aquí</p>
            <Link href="/subjects" className="btn-primary mt-4 inline-block">
              Explorar cuestionarios →
            </Link>
          </div>
        ) : (
          <div className="p-6">
            {Object.entries(groupedCompletedAttempts).map(([subjectName, subjectAttempts]) => (
              <div key={subjectName} className="mb-8 last:mb-0">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-200 pb-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  {subjectName}
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    ({subjectAttempts.length} {subjectAttempts.length === 1 ? 'intento' : 'intentos'})
                  </span>
                </h4>
                <div className="space-y-3">
                  {subjectAttempts.map((attempt, i) => (
                    <div 
                      key={i} 
                      className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {attempt.bank_name || (attempt.bank || 'N/A').toUpperCase()}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {formatDate(attempt.created_at)}
                        </div>
                      </div>
                      <div className="ml-4">
                        <span className={`text-2xl font-bold ${getScoreColor(attempt.score || 0)}`}>
                          {attempt.score || 0}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 text-center text-sm text-gray-500">
        <p>Todos tus datos se guardan de forma segura </p>
      </div>
    </div>
  )
}
