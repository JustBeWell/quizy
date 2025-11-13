import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { getUser, isAdmin as checkIsAdmin, getToken } from '../../lib/auth-client'

export default function AdminQuestionnaires() {
  const router = useRouter()
  const [isAdminUser, setIsAdminUser] = useState(false)
  const [loading, setLoading] = useState(true)
  const [questionnaires, setQuestionnaires] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loadingSubjects, setLoadingSubjects] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    subject_id: '',
    questions: []
  })
  const [currentQuestion, setCurrentQuestion] = useState({
    id: 1,
    question: '',
    options: [
      { key: 'a', text: '' },
      { key: 'b', text: '' },
      { key: 'c', text: '' },
      { key: 'd', text: '' }
    ],
    answers: []
  })

  useEffect(() => {
    const user = getUser()
    if (!user || !checkIsAdmin()) {
      router.push('/levels')
      return
    }
    setIsAdminUser(true)
    loadData()
  }, [router])

  async function loadData() {
    setLoadingSubjects(true)
    try {
      const token = getToken()
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      const [questionnairesRes, subjectsRes] = await Promise.all([
        fetch('/api/admin/questionnaires', { headers }),
        fetch('/api/subjects')
      ])

      if (questionnairesRes.ok) {
        const data = await questionnairesRes.json()
        console.log('Cuestionarios cargados:', data.length)
        setQuestionnaires(data)
      } else {
        console.error('Error al cargar cuestionarios:', questionnairesRes.status)
      }

      if (subjectsRes.ok) {
        const data = await subjectsRes.json()
        console.log('Asignaturas cargadas:', data.subjects?.length || 0, data.subjects)
        setSubjects(data.subjects || [])
      } else {
        console.error('Error al cargar asignaturas:', subjectsRes.status)
        const errorData = await subjectsRes.json().catch(() => ({}))
        console.error('Detalles del error:', errorData)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      alert('Error al cargar datos: ' + error.message)
    } finally {
      setLoading(false)
      setLoadingSubjects(false)
    }
  }

  function handleAddOption() {
    const nextKey = String.fromCharCode(97 + currentQuestion.options.length)
    setCurrentQuestion({
      ...currentQuestion,
      options: [...currentQuestion.options, { key: nextKey, text: '' }]
    })
  }

  function handleRemoveOption(index) {
    const newOptions = currentQuestion.options.filter((_, i) => i !== index)
    setCurrentQuestion({
      ...currentQuestion,
      options: newOptions
    })
  }

  function handleOptionChange(index, text) {
    const newOptions = [...currentQuestion.options]
    newOptions[index].text = text
    setCurrentQuestion({
      ...currentQuestion,
      options: newOptions
    })
  }

  function handleAnswerToggle(key) {
    const answers = currentQuestion.answers.includes(key)
      ? currentQuestion.answers.filter(a => a !== key)
      : [...currentQuestion.answers, key]
    setCurrentQuestion({
      ...currentQuestion,
      answers
    })
  }

  function handleAddQuestion() {
    if (!currentQuestion.question.trim()) {
      alert('La pregunta no puede estar vacía')
      return
    }
    if (currentQuestion.options.some(opt => !opt.text.trim())) {
      alert('Todas las opciones deben tener texto')
      return
    }
    if (currentQuestion.answers.length === 0) {
      alert('Debe seleccionar al menos una respuesta correcta')
      return
    }

    setFormData({
      ...formData,
      questions: [...formData.questions, { ...currentQuestion }]
    })

    // Reset current question
    setCurrentQuestion({
      id: formData.questions.length + 2,
      question: '',
      options: [
        { key: 'a', text: '' },
        { key: 'b', text: '' },
        { key: 'c', text: '' },
        { key: 'd', text: '' }
      ],
      answers: []
    })
  }

  function handleRemoveQuestion(index) {
    setFormData({
      ...formData,
      questions: formData.questions.filter((_, i) => i !== index)
    })
  }

  function handleEditQuestion(index) {
    const question = formData.questions[index]
    setCurrentQuestion(question)
    handleRemoveQuestion(index)
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (!formData.name.trim()) {
      alert('El nombre del cuestionario es obligatorio')
      return
    }

    if (formData.questions.length === 0) {
      alert('Debe agregar al menos una pregunta')
      return
    }

    try {
      const token = getToken()
      const method = editingId ? 'PUT' : 'POST'
      
      // Convert empty subject_id to null
      const processedData = {
        ...formData,
        subject_id: formData.subject_id === '' ? null : parseInt(formData.subject_id, 10)
      }
      
      const body = editingId 
        ? { ...processedData, id: editingId }
        : processedData

      const response = await fetch('/api/admin/questionnaires', {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        alert(editingId ? 'Cuestionario actualizado' : 'Cuestionario creado')
        setShowForm(false)
        setEditingId(null)
        resetForm()
        loadData()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error saving questionnaire:', error)
      alert('Error al guardar el cuestionario')
    }
  }

  function resetForm() {
    setFormData({
      name: '',
      description: '',
      subject_id: '',
      questions: []
    })
    setCurrentQuestion({
      id: 1,
      question: '',
      options: [
        { key: 'a', text: '' },
        { key: 'b', text: '' },
        { key: 'c', text: '' },
        { key: 'd', text: '' }
      ],
      answers: []
    })
  }

  async function handleDelete(id) {
    const questionnaire = questionnaires.find(q => q.id === id)
    const isPublished = questionnaire?.is_published
    
    const confirmMessage = isPublished
      ? '¿Despublicar este cuestionario? Se ocultará para todos los usuarios pero seguirá disponible para ti.'
      : '¿Eliminar definitivamente este cuestionario? Esta acción no se puede deshacer.'
    
    if (!confirm(confirmMessage)) return

    try {
      const token = getToken()
      const response = await fetch(`/api/admin/questionnaires?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        if (result.action === 'unpublished') {
          alert('Cuestionario despublicado correctamente')
        } else {
          alert('Cuestionario eliminado definitivamente')
        }
        loadData()
      } else {
        alert('Error al eliminar')
      }
    } catch (error) {
      console.error('Error deleting questionnaire:', error)
    }
  }

  function handleEdit(questionnaire) {
    // Normalizar preguntas: convertir opciones de string[] a {text, key}[]
    const normalizedQuestions = questionnaire.questions.map(q => ({
      ...q,
      options: Array.isArray(q.options) 
        ? q.options.map((opt, idx) => 
            typeof opt === 'string' 
              ? { text: opt, key: idx } 
              : opt
          )
        : q.options
    }))
    
    setFormData({
      name: questionnaire.name,
      description: questionnaire.description || '',
      subject_id: questionnaire.subject_id || '',
      questions: normalizedQuestions
    })
    setEditingId(questionnaire.id)
    setShowForm(true)
  }

  async function handleTogglePublish(id, currentPublishedState) {
    const action = currentPublishedState ? 'unpublish' : 'publish'
    const confirmMessage = currentPublishedState
      ? '¿Despublicar este cuestionario? Se ocultará para todos los usuarios.'
      : '¿Publicar este cuestionario? Será visible para todos los usuarios.'
    
    if (!confirm(confirmMessage)) return

    try {
      const token = getToken()
      const response = await fetch('/api/admin/questionnaires', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id, action })
      })

      if (response.ok) {
        const result = await response.json()
        alert(result.message)
        loadData()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error toggling publish status:', error)
      alert('Error al cambiar el estado de publicación')
    }
  }

  if (loading || !isAdminUser) {
    return (
      <div className="container py-8">
        <p className="text-center text-gray-600">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="container py-8 max-w-7xl mx-auto px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">📝 Gestión de Cuestionarios</h1>
          <p className="text-gray-600">Crea y administra cuestionarios personalizados</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin">
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              ← Panel Admin
            </motion.a>
          </Link>
        </div>
      </div>

      {!showForm && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            resetForm()
            setShowForm(true)
          }}
          className="mb-6 px-6 py-3 bg-blue-700 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-800 dark:hover:bg-blue-700 transition-colors font-semibold"
        >
          + Nuevo Cuestionario
        </motion.button>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-xl p-6 shadow-lg mb-8 border border-gray-200"
          >
            <h2 className="text-2xl font-bold mb-4">
              {editingId ? 'Editar Cuestionario' : 'Nuevo Cuestionario'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Nombre *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Asignatura</label>
                  <select
                    value={formData.subject_id}
                    onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    disabled={loadingSubjects}
                  >
                    <option value="">Sin asignatura</option>
                    {loadingSubjects ? (
                      <option disabled>Cargando asignaturas...</option>
                    ) : subjects.length === 0 ? (
                      <option disabled>No hay asignaturas disponibles</option>
                    ) : (
                      subjects.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))
                    )}
                  </select>
                  {!loadingSubjects && subjects.length === 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      No hay asignaturas disponibles. Puedes crear una en{' '}
                      <Link href="/admin/subjects">
                        <a className="text-blue-600 hover:underline">el panel de asignaturas</a>
                      </Link>
                    </p>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="3"
                />
              </div>

              {/* Questions added */}
              {formData.questions.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold mb-3">Preguntas agregadas ({formData.questions.length})</h3>
                  <div className="space-y-3">
                    {formData.questions.map((q, idx) => (
                      <div key={idx} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium mb-2">{idx + 1}. {q.question}</p>
                            <div className="text-sm text-gray-600 space-y-1">
                              {q.options.map(opt => (
                                <div key={opt.key} className={q.answers.includes(opt.key) ? 'text-green-600 font-medium' : ''}>
                                  {opt.key}) {opt.text} {q.answers.includes(opt.key) && '✓'}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleEditQuestion(idx)}
                              className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveQuestion(idx)}
                              className="px-3 py-1 bg-red-700 dark:bg-red-600 text-white rounded hover:bg-red-800 dark:hover:bg-red-700 text-sm font-semibold"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Current question form */}
              <div className="bg-blue-50 p-6 rounded-lg mb-6 border border-blue-200">
                <h3 className="text-lg font-bold mb-4">Agregar Pregunta</h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Pregunta *</label>
                  <textarea
                    value={currentQuestion.question}
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, question: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows="2"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Opciones *</label>
                  {currentQuestion.options.map((opt, idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                        placeholder={`Opción ${opt.key}`}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <label className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer">
                        <input
                          type="checkbox"
                          checked={currentQuestion.answers.includes(opt.key)}
                          onChange={() => handleAnswerToggle(opt.key)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">Correcta</span>
                      </label>
                      {currentQuestion.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(idx)}
                          className="px-3 py-2 bg-red-700 dark:bg-red-600 text-white rounded-lg hover:bg-red-800 dark:hover:bg-red-700 font-semibold"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="mt-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                  >
                    + Agregar opción
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="w-full px-4 py-2 bg-blue-700 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-800 dark:hover:bg-blue-700 font-semibold"
                >
                  ✓ Agregar esta pregunta
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-6 py-3 bg-green-700 dark:bg-green-600 text-white rounded-lg hover:bg-green-800 dark:hover:bg-green-700 font-semibold"
                >
                  {editingId ? 'Actualizar Cuestionario' : 'Guardar Cuestionario'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingId(null)
                    resetForm()
                  }}
                  className="px-6 py-3 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List of questionnaires */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {questionnaires.map(q => (
          <motion.div
            key={q.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <h3 className="text-xl font-bold mb-2">{q.name}</h3>
            {q.is_published && (
              <div className="inline-block mb-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                🌐 Publicado
              </div>
            )}
            {!q.is_published && (
              <div className="inline-block mb-2 px-2 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded">
                🔒 Privado
              </div>
            )}
            {q.description && (
              <p className="text-gray-600 text-sm mb-3">{q.description}</p>
            )}
            <div className="text-sm text-gray-500 mb-4">
              <p>📊 {Array.isArray(q.questions) ? q.questions.length : 0} preguntas</p>
              {q.subject_name && <p>📚 {q.subject_name}</p>}
              <p>👤 Creado por: {q.created_by}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleTogglePublish(q.id, q.is_published)}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  q.is_published
                    ? 'bg-orange-700 dark:bg-orange-600 text-white hover:bg-orange-800 dark:hover:bg-orange-700 font-semibold'
                    : 'bg-green-700 dark:bg-green-600 text-white hover:bg-green-800 dark:hover:bg-green-700 font-semibold'
                }`}
              >
                {q.is_published ? '📤 Despublicar' : '📢 Publicar'}
              </button>
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => handleEdit(q)}
                className="flex-1 px-4 py-2 bg-blue-700 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-800 dark:hover:bg-blue-700 text-sm font-semibold"
              >
                ✏️ Editar
              </button>
              <button
                onClick={() => handleDelete(q.id)}
                className="flex-1 px-4 py-2 bg-red-700 dark:bg-red-600 text-white rounded-lg hover:bg-red-800 dark:hover:bg-red-700 text-sm font-semibold"
              >
                {q.is_published ? '🔻 Ocultar' : '🗑️ Eliminar'}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {questionnaires.length === 0 && !showForm && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-xl mb-2">No hay cuestionarios creados</p>
          <p>Crea tu primer cuestionario personalizado</p>
        </div>
      )}
    </div>
  )
}
