import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { getUser } from '../lib/auth-client'
import { useRouter } from 'next/router'

export default function ProposeQuiz() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [files, setFiles] = useState([])
  const [driveLinks, setDriveLinks] = useState([''])
  
  const [formData, setFormData] = useState({
    subject: '',
    level: 'eso',
    category: '',
    description: '',
    questionsCount: '',
    format: 'multiple_choice'
  })

  useEffect(() => {
    const currentUser = getUser()
    if (!currentUser) {
      router.push('/auth')
      return
    }
    setUser(currentUser)
  }, [router])

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files)
    // Limitar a 5 archivos máximo
    if (selectedFiles.length + files.length > 5) {
      setError('Máximo 5 archivos permitidos')
      return
    }
    
    // Limitar tamaño de archivo a 10MB
    const maxSize = 10 * 1024 * 1024 // 10MB
    const validFiles = selectedFiles.filter(file => {
      if (file.size > maxSize) {
        setError(`El archivo ${file.name} es muy grande. Máximo 10MB por archivo.`)
        return false
      }
      return true
    })
    
    setFiles([...files, ...validFiles])
    setError('')
  }

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const addDriveLink = () => {
    if (driveLinks.length < 5) {
      setDriveLinks([...driveLinks, ''])
    }
  }

  const updateDriveLink = (index, value) => {
    const newLinks = [...driveLinks]
    newLinks[index] = value
    setDriveLinks(newLinks)
  }

  const removeDriveLink = (index) => {
    setDriveLinks(driveLinks.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    // Validaciones
    if (!formData.subject.trim()) {
      setError('Por favor ingresa un asunto')
      setLoading(false)
      return
    }

    if (!formData.description.trim()) {
      setError('Por favor describe el cuestionario que propones')
      setLoading(false)
      return
    }

    try {
      const formDataToSend = new FormData()
      
      // Añadir datos del formulario
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key])
      })
      
      // Añadir archivos
      files.forEach(file => {
        formDataToSend.append('files', file)
      })
      
      // Añadir enlaces de Drive (filtrar vacíos)
      const validDriveLinks = driveLinks.filter(link => link.trim() !== '')
      formDataToSend.append('driveLinks', JSON.stringify(validDriveLinks))

      const response = await fetch('/api/propose-quiz', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('quiz_token')}`
        },
        body: formDataToSend
      })

      if (response.ok) {
        setSuccess(true)
        // Resetear formulario
        setFormData({
          subject: '',
          level: 'eso',
          category: '',
          description: '',
          questionsCount: '',
          format: 'multiple_choice'
        })
        setFiles([])
        setDriveLinks([''])
        
        // Scroll al mensaje de éxito
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        const data = await response.json()
        
        // Si el error es por falta de email, mostrar mensaje específico
        if (data.requiresEmail) {
          setError(
            <span>
              {data.error}{' '}
              <a href="/profile" className="underline font-semibold text-brand-700 hover:text-brand-800">
                Ir a mi perfil →
              </a>
            </span>
          )
        } else {
          setError(data.error || 'Error al enviar la propuesta')
        }
      }
    } catch (err) {
      console.error('Error:', err)
      setError('Error al enviar la propuesta. Por favor intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="container py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-semibold">📝 Proponer Cuestionario</h2>
            <p className="text-gray-600 text-sm mt-1">
              Ayúdanos a crecer compartiendo tus cuestionarios con la comunidad
            </p>
          </div>
          <Link href="/levels" className="btn-ghost">← Volver al Inicio</Link>
        </div>

        {/* Mensaje de éxito */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6"
          >
            <div className="flex items-start gap-3">
              <span className="text-3xl">✅</span>
              <div>
                <h3 className="text-lg font-semibold text-green-900 mb-2">
                  ¡Propuesta enviada con éxito!
                </h3>
                <p className="text-green-700 mb-3">
                  Gracias por contribuir a Quizy. Revisaremos tu propuesta y te contactaremos pronto.
                  {user && (
                    <span className="block mt-2">
                      📧 Te hemos enviado un email de confirmación con más detalles.
                    </span>
                  )}
                </p>
                <button
                  onClick={() => setSuccess(false)}
                  className="text-sm text-green-600 hover:text-green-800 font-medium"
                >
                  Enviar otra propuesta →
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Mensaje de error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <p className="text-red-700">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Alerta sobre requisito de email */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">📧</span>
            <div className="flex-1">
              <p className="text-yellow-800 text-sm">
                <strong>Importante:</strong> Para enviar propuestas necesitas tener un correo electrónico configurado en tu perfil. 
                Esto nos permite responderte sobre el estado de tu propuesta.
                {user && !user.email && (
                  <span className="block mt-2">
                    <a href="/profile" className="text-yellow-900 underline font-semibold hover:text-yellow-950">
                      → Añadir email en mi perfil
                    </a>
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Información */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-3xl">💡</span>
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                ¿Cómo funciona?
              </h3>
              <ul className="text-blue-700 space-y-2 text-sm">
                <li>• Completa el formulario con los detalles de tu cuestionario</li>
                <li>• Adjunta archivos (PDF, Word, Excel, imágenes) o enlaces de Google Drive</li>
                <li>• Los archivos se enviarán por email a nuestro equipo de revisión</li>
                <li>• Recibirás un email de confirmación inmediato</li>
                <li>• Nuestro equipo revisará tu propuesta en 2-3 días hábiles</li>
                <li>• Si es aprobado, lo publicaremos dándote crédito como autor</li>
              </ul>
              <p className="text-xs text-blue-600 mt-3 italic">
                ℹ️ Los archivos no se almacenan en nuestros servidores, solo se envían como adjuntos al email de revisión.
              </p>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          {/* Asunto */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Asunto / Título del Cuestionario <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Ej: Test de Matemáticas - Ecuaciones de 2º grado"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              maxLength={200}
            />
          </div>

          {/* Nivel y Categoría */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nivel Educativo <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              >
                <option value="eso">ESO</option>
                <option value="bachillerato">Bachillerato</option>
                <option value="universidad">Universidad</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Asignatura / Materia
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Ej: Matemáticas, Física, Historia..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Número de preguntas y formato */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número aproximado de preguntas
              </label>
              <input
                type="number"
                value={formData.questionsCount}
                onChange={(e) => setFormData({ ...formData, questionsCount: e.target.value })}
                placeholder="Ej: 20"
                min="1"
                max="200"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Formato de preguntas
              </label>
              <select
                value={formData.format}
                onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              >
                <option value="multiple_choice">Opción múltiple</option>
                <option value="true_false">Verdadero/Falso</option>
                <option value="mixed">Mixto</option>
                <option value="open">Preguntas abiertas</option>
              </select>
            </div>
          </div>

          {/* Descripción */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción / Contenido <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe el contenido del cuestionario, temas que cubre, fuente original, etc. Cuanta más información, mejor podremos evaluarlo."
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
              maxLength={2000}
            />
            <div className="text-right text-xs text-gray-500 mt-1">
              {formData.description.length}/2000 caracteres
            </div>
          </div>

          {/* Archivos adjuntos */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📎 Archivos adjuntos
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                onChange={handleFileChange}
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png"
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer inline-flex flex-col items-center"
              >
                <span className="text-4xl mb-2">📁</span>
                <span className="text-sm text-gray-600 mb-1">
                  Haz clic para seleccionar archivos
                </span>
                <span className="text-xs text-gray-500">
                  PDF, Word, Excel, Imágenes (Máx. 10MB por archivo, 5 archivos máx.)
                </span>
              </label>
            </div>

            {/* Lista de archivos seleccionados */}
            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📄</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{file.name}</p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Enlaces de Google Drive */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🔗 Enlaces de Google Drive (opcional)
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Si tus archivos están en Drive, comparte los enlaces aquí. Asegúrate de que tengan permisos de visualización.
            </p>
            
            {driveLinks.map((link, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="url"
                  value={link}
                  onChange={(e) => updateDriveLink(index, e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
                {driveLinks.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeDriveLink(index)}
                    className="px-3 py-2 text-red-500 hover:text-red-700"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            
            {driveLinks.length < 5 && (
              <button
                type="button"
                onClick={addDriveLink}
                className="text-sm text-brand-600 hover:text-brand-700 mt-2"
              >
                + Añadir otro enlace
              </button>
            )}
          </div>

          {/* Botón de envío */}
          <div className="flex items-center justify-between pt-4 border-t">
            <p className="text-xs text-gray-500">
              <span className="text-red-500">*</span> Campos obligatorios
            </p>
            <button
              type="submit"
              disabled={loading}
              className={`px-8 py-3 rounded-lg font-semibold text-white transition-all ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-brand-600 hover:bg-brand-700 shadow-lg hover:shadow-xl'
              }`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Enviando...
                </span>
              ) : (
                '📤 Enviar Propuesta'
              )}
            </button>
          </div>
        </form>

        {/* Footer informativo */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            Al enviar tu propuesta aceptas que podamos revisar y modificar el contenido.
            Te daremos crédito como autor si es publicado.
          </p>
        </div>
      </div>
    </div>
  )
}
