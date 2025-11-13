import { query } from '../../lib/db'
import { verifyToken } from '../../lib/jwt'
import fs from 'fs'
import path from 'path'

// Helper para obtener nombre de banco (de archivo o BD)
async function getBankName(bankId) {
  try {
    // Si empieza con 'db_', es de la base de datos
    if (bankId.startsWith('db_')) {
      const id = parseInt(bankId.replace('db_', ''))
      const result = await query('SELECT name FROM question_banks WHERE id = $1', [id])
      if (result.rows.length > 0) {
        return result.rows[0].name
      }
    }
    
    // Si es un banco de archivo, intentar leerlo
    // Primero intentar encontrarlo en algún directorio de data
    const dataDir = path.join(process.cwd(), 'data')
    const possiblePaths = []
    
    // Buscar en subdirectorios comunes
    const subdirs = fs.readdirSync(dataDir).filter(f => {
      const fullPath = path.join(dataDir, f)
      return fs.statSync(fullPath).isDirectory()
    })
    
    for (const subdir of subdirs) {
      possiblePaths.push(path.join(dataDir, subdir, `${bankId}.json`))
    }
    
    // También buscar en raíz de data
    possiblePaths.push(path.join(dataDir, `${bankId}.json`))
    
    for (const filePath of possiblePaths) {
      if (fs.existsSync(filePath)) {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'))
        return content.name || bankId
      }
    }
  } catch (error) {
    console.error(`Error getting bank name for ${bankId}:`, error)
  }
  
  // Si no se encuentra, devolver el ID capitalizado
  return bankId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

export default async function handler(req, res) {
  // Obtener el token JWT del header
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autenticado' })
  }

  const token = authHeader.substring(7)
  let decoded
  
  try {
    decoded = verifyToken(token)
    if (!decoded || !decoded.id) {
      return res.status(401).json({ error: 'Token inválido' })
    }
  } catch (error) {
    return res.status(401).json({ error: 'Sesión inválida o expirada' })
  }

  const userId = decoded.id

  // GET - Obtener favoritos del usuario
  if (req.method === 'GET') {
    try {
      const result = await query(
        `SELECT 
          f.id, 
          f.bank_id, 
          f.subject_slug, 
          f.created_at,
          s.name as subject_name
         FROM favorites f
         LEFT JOIN subjects s ON f.subject_slug = s.slug
         WHERE f.user_id = $1 
         ORDER BY f.created_at DESC`,
        [userId]
      )

      // Obtener nombres de bancos de forma asíncrona
      const favorites = await Promise.all(
        result.rows.map(async (row) => ({
          ...row,
          bank_name: await getBankName(row.bank_id)
        }))
      )

      return res.status(200).json({ favorites })
    } catch (error) {
      console.error('Error getting favorites:', error)
      return res.status(500).json({ error: 'Error al obtener favoritos' })
    }
  }

  // POST - Agregar a favoritos
  if (req.method === 'POST') {
    const { bank_id, subject_slug } = req.body

    if (!bank_id || !subject_slug) {
      return res.status(400).json({ error: 'bank_id y subject_slug son requeridos' })
    }

    try {
      // Verificar si ya existe
      const existing = await query(
        'SELECT id FROM favorites WHERE user_id = $1 AND bank_id = $2',
        [userId, bank_id]
      )

      if (existing.rows.length > 0) {
        return res.status(200).json({ 
          message: 'Ya está en favoritos',
          alreadyExists: true 
        })
      }

      // Insertar nuevo favorito
      const result = await query(
        `INSERT INTO favorites (user_id, bank_id, subject_slug) 
         VALUES ($1, $2, $3) 
         RETURNING id, bank_id, subject_slug, created_at`,
        [userId, bank_id, subject_slug]
      )

      return res.status(201).json({ 
        message: 'Agregado a favoritos',
        favorite: result.rows[0]
      })
    } catch (error) {
      console.error('Error adding favorite:', error)
      return res.status(500).json({ error: 'Error al agregar a favoritos' })
    }
  }

  // DELETE - Eliminar de favoritos
  if (req.method === 'DELETE') {
    const { bank_id, subject_slug } = req.body

    if (!bank_id) {
      return res.status(400).json({ error: 'bank_id es requerido' })
    }

    try {
      const result = await query(
        'DELETE FROM favorites WHERE user_id = $1 AND bank_id = $2 RETURNING id',
        [userId, bank_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Favorito no encontrado' })
      }

      return res.status(200).json({ message: 'Eliminado de favoritos' })
    } catch (error) {
      console.error('Error removing favorite:', error)
      return res.status(500).json({ error: 'Error al eliminar de favoritos' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
