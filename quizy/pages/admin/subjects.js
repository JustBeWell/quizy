import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { getUser, isAdmin, getToken } from '../../lib/auth-client'

export default function AdminSubjectsPage() {
  const router = useRouter()
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingSubject, setEditingSubject] = useState(null)
  const [formData, setFormData] = useState({ name: '', slug: '', description: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    // Check authentication using JWT
    const user = getUser()
    if (!user || !isAdmin()) {
      router.push('/levels')
      return
    }

    loadSubjects()
  }, [])

  async function loadSubjects() {
    try {
      const res = await fetch('/api/subjects')
      const data = await res.json()
      
      if (res.ok) {
        setSubjects(data.subjects || [])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  function openCreateModal() {
    setEditingSubject(null)
    setFormData({ name: '', slug: '', description: '' })
    setError('')
    setSuccess('')
    setShowModal(true)
  }

  function openEditModal(subject) {
    setEditingSubject(subject)
    setFormData({ name: subject.name, slug: subject.slug, description: subject.description || '' })
    setError('')
    setSuccess('')
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditingSubject(null)
    setFormData({ name: '', slug: '', description: '' })
    setError('')
    setSuccess('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    const token = getToken()
    if (!token) {
      router.push('/auth')
      return
    }

    const url = editingSubject ? `/api/subjects/${editingSubject.id}` : '/api/subjects'
    const method = editingSubject ? 'PUT' : 'POST'

    try {
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (res.ok) {
        setSuccess(editingSubject ? 'Asignatura actualizada' : 'Asignatura creada')
        loadSubjects()
        setTimeout(() => closeModal(), 1500)
      } else {
        setError(data.error || data.message || 'Error al guardar')
      }
    } catch (error) {
      setError('Error de conexión')
    }
  }

  async function handleDelete(id) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta asignatura?')) return

    const token = getToken()
    if (!token) {
      router.push('/auth')
      return
    }

    try {
      const res = await fetch(`/api/subjects/${id}`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (res.ok) {
        loadSubjects()
      } else {
        const data = await res.json()
        alert('Error: ' + (data.error || data.message))
      }
    } catch (error) {
      alert('Error de conexión')
    }
  }

  function generateSlug(name) {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  if (loading) {
    return (
      <div className="container py-8">
        <p className="text-center text-gray-600">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/admin" className="text-purple-600 hover:text-purple-700 text-sm">
              ← Panel Admin
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-sm text-gray-600">Asignaturas</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">⚙️ Administrar asignaturas</h1>
          <p className="text-gray-600">Crea y gestiona las asignaturas del sistema</p>
        </div>
        <Link href="/levels">
          <a className="px-4 py-2 border rounded-lg hover:bg-gray-50">← Volver</a>
        </Link>
      </div>

      {/* Create button */}
      <div className="mb-6">
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-green-700 dark:bg-green-600 text-white rounded-lg hover:bg-green-800 dark:hover:bg-green-700 font-semibold"
        >
          ➕ Crear nueva asignatura
        </button>
      </div>

      {/* Subjects table */}
      {subjects.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-4">No hay asignaturas creadas</p>
          <button
            onClick={openCreateModal}
            className="text-blue-600 underline"
          >
            Crear la primera asignatura
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Nombre</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Slug</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Descripción</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {subjects.map(subject => (
                <tr key={subject.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{subject.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{subject.slug}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                    {subject.description || '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openEditModal(subject)}
                      className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded mr-2"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => handleDelete(subject.id)}
                      className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                    >
                      🗑️ Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg p-6 w-[500px] max-w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-semibold mb-4">
                {editingSubject ? 'Editar asignatura' : 'Crear nueva asignatura'}
              </h3>

              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nombre *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value })
                        if (!editingSubject) {
                          setFormData(prev => ({ ...prev, slug: generateSlug(e.target.value) }))
                        }
                      }}
                      required
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="ej: Arquitecturas Virtuales"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Slug (URL) *</label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      required
                      pattern="[a-z0-9-]+"
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="ej: arq-virt"
                    />
                    <p className="text-xs text-gray-500 mt-1">Solo minúsculas, números y guiones</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Descripción</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Descripción opcional de la asignatura"
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                      {success}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 justify-end mt-6">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-700 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-800 dark:hover:bg-blue-700 font-semibold"
                  >
                    {editingSubject ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
