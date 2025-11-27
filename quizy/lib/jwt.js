import jwt from 'jsonwebtoken';
import { query } from './db';

// Secret key para firmar los JWT - OBLIGATORIO en producción
if (!process.env.JWT_SECRET) {
  console.error('⚠️  ADVERTENCIA DE SEGURIDAD: JWT_SECRET no está configurado!');
  console.error('⚠️  Esto es inseguro en producción. Configura JWT_SECRET en .env.local');
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET es obligatorio en producción');
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-DO-NOT-USE-IN-PRODUCTION';
const JWT_EXPIRES_IN = '7d'; // Token válido por 7 días

/**
 * Genera un JWT token para un usuario
 * @param {Object} user - Objeto con datos del usuario
 * @returns {string} JWT token
 */
export function generateToken(user) {
  // Incluir información necesaria en el token
  // Email es necesario para sistema de soporte
  const payload = {
    id: user.id,
    name: user.name,
    email: user.email,
    is_admin: user.is_admin || false,
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verifica y decodifica un JWT token
 * @param {string} token - JWT token a verificar
 * @returns {Object|null} Datos del usuario o null si el token es inválido
 */
export function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Compatibilidad con tokens antiguos que usaban userId en lugar de id
    if (decoded.userId && !decoded.id) {
      decoded.id = decoded.userId;
    }
    
    // Validar que el token tenga los campos requeridos
    if (!decoded.id || !decoded.name) {
      console.error('Token inválido: faltan campos requeridos');
      return null;
    }
    
    return decoded;
  } catch (error) {
    // No loguear el error completo para evitar exponer información
    if (error.name === 'TokenExpiredError') {
      console.warn('Token expirado');
    } else if (error.name === 'JsonWebTokenError') {
      console.warn('Token JWT malformado');
    }
    return null;
  }
}

/**
 * Verifica que el usuario del token existe en la base de datos
 * @param {Object} decoded - Token decodificado
 * @returns {Promise<boolean>} true si el usuario existe y está activo
 */
export async function verifyUserExists(decoded) {
  if (!decoded || !decoded.id) {
    return false;
  }

  try {
    const result = await query('SELECT id, is_admin FROM users WHERE id = $1', [decoded.id]);
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error verificando existencia de usuario:', error);
    return false;
  }
}

/**
 * Verifica token y existencia del usuario en la BD
 * @param {string} token - JWT token a verificar
 * @returns {Promise<Object|null>} Datos del usuario o null si es inválido/no existe
 */
export async function verifyTokenAndUser(token) {
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return null;
  }

  const userExists = await verifyUserExists(decoded);
  
  if (!userExists) {
    console.warn(`⚠️  Token válido pero usuario ${decoded.id} (${decoded.name}) no existe en BD`);
    return null;
  }

  return decoded;
}

/**
 * Middleware para verificar JWT en API routes
 * @param {Function} handler - Handler de la API route
 * @param {boolean} requireAdmin - Si requiere rol de admin
 * @returns {Function} Handler con verificación JWT
 */
export function withAuth(handler, requireAdmin = false) {
  return async (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No autorizado - Token requerido' });
    }
    
    const user = verifyToken(token);
    
    if (!user) {
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }
    
    if (requireAdmin && !user.is_admin) {
      return res.status(403).json({ error: 'Acceso denegado - Requiere rol de administrador' });
    }
    
    // Añadir usuario al request para usarlo en el handler
    req.user = user;
    
    return handler(req, res);
  };
}
