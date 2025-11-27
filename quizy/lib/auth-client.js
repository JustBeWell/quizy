/**
 * Helper para manejar JWT del lado del cliente
 * IMPORTANTE: Este archivo NO valida el JWT, solo lo decodifica.
 * La validación real debe hacerse en el servidor.
 */

/**
 * Decodifica un JWT sin validar (solo para leer el payload)
 * @param {string} token - JWT token
 * @returns {Object|null} Payload decodificado o null si es inválido
 */
export function decodeToken(token) {
  if (!token || typeof token !== 'string') {
    return null;
  }

  try {
    // JWT tiene 3 partes separadas por puntos: header.payload.signature
    const parts = token.split('.');
    
    if (parts.length !== 3) {
      return null;
    }

    // Decodificar el payload (segunda parte)
    const payload = parts[1];
    const decoded = JSON.parse(atob(payload));
    
    return decoded;
  } catch (error) {
    console.error('Error decodificando token:', error);
    return null;
  }
}

/**
 * Verifica si el token ha expirado (sin validar la firma)
 * @param {string} token - JWT token
 * @returns {boolean} true si expiró o es inválido
 */
export function isTokenExpired(token) {
  const decoded = decodeToken(token);
  
  if (!decoded || !decoded.exp) {
    return true;
  }

  // exp viene en segundos, Date.now() en milisegundos
  const now = Date.now() / 1000;
  return decoded.exp < now;
}

/**
 * Obtiene el usuario del localStorage usando el JWT
 * @returns {Object|null} Datos del usuario o null
 */
export function getUser() {
  if (typeof window === 'undefined') {
    return null;
  }

  const token = localStorage.getItem('quiz_token');
  
  if (!token) {
    return null;
  }

  // Verificar si el token está expirado
  if (isTokenExpired(token)) {
    // Token expirado, limpiar todos los datos de autenticación
    console.log('[Auth] Token expirado, limpiando sesión');
    localStorage.removeItem('quiz_token');
    localStorage.removeItem('quiz_user');
    localStorage.removeItem('quiz_user_data');
    return null;
  }

  const decoded = decodeToken(token);
  
  // Si no se puede decodificar, el token es inválido
  if (!decoded) {
    console.log('[Auth] Token inválido, limpiando sesión');
    localStorage.removeItem('quiz_token');
    localStorage.removeItem('quiz_user');
    localStorage.removeItem('quiz_user_data');
    return null;
  }
  
  // Verificar que tenga los campos necesarios (id y name)
  // Si tiene userId pero no id, es un token muy antiguo - forzar re-login
  if (!decoded.id && decoded.userId) {
    console.log('[Auth] Token con formato antiguo detectado, forzando re-login');
    localStorage.removeItem('quiz_token');
    localStorage.removeItem('quiz_user');
    localStorage.removeItem('quiz_user_data');
    return null;
  }
  
  if (!decoded.id || !decoded.name) {
    console.log('[Auth] Token sin campos requeridos, limpiando sesión');
    localStorage.removeItem('quiz_token');
    localStorage.removeItem('quiz_user');
    localStorage.removeItem('quiz_user_data');
    return null;
  }
  
  return decoded;
}

/**
 * Obtiene el token JWT del localStorage
 * @returns {string|null} Token o null si no existe
 */
export function getToken() {
  if (typeof window === 'undefined') {
    return null;
  }

  const token = localStorage.getItem('quiz_token');
  
  if (!token) {
    return null;
  }

  // Verificar si el token está expirado
  if (isTokenExpired(token)) {
    // Token expirado, limpiar todos los datos de autenticación
    console.log('[Auth] Token expirado, limpiando sesión');
    localStorage.removeItem('quiz_token');
    localStorage.removeItem('quiz_user');
    localStorage.removeItem('quiz_user_data');
    return null;
  }
  
  // Validar que el token tenga formato correcto
  const decoded = decodeToken(token);
  if (!decoded) {
    console.log('[Auth] Token inválido, limpiando sesión');
    localStorage.removeItem('quiz_token');
    localStorage.removeItem('quiz_user');
    localStorage.removeItem('quiz_user_data');
    return null;
  }
  
  // Si tiene userId pero no id, es formato antiguo - forzar re-login
  if (!decoded.id && decoded.userId) {
    console.log('[Auth] Token con formato antiguo detectado, forzando re-login');
    localStorage.removeItem('quiz_token');
    localStorage.removeItem('quiz_user');
    localStorage.removeItem('quiz_user_data');
    return null;
  }
  
  // Validar campos requeridos
  if (!decoded.id || !decoded.name) {
    console.log('[Auth] Token sin campos requeridos, limpiando sesión');
    localStorage.removeItem('quiz_token');
    localStorage.removeItem('quiz_user');
    localStorage.removeItem('quiz_user_data');
    return null;
  }
  
  return token;
}

/**
 * Verifica si el usuario actual es admin
 * @returns {boolean} true si es admin
 */
export function isAdmin() {
  const user = getUser();
  return user?.is_admin === true;
}

/**
 * Cierra la sesión del usuario
 * Limpia todos los datos de autenticación del localStorage
 */
export function logout() {
  if (typeof window === 'undefined') {
    return;
  }

  // Limpiar tokens y datos de usuario
  localStorage.removeItem('quiz_token');
  localStorage.removeItem('quiz_user');
  localStorage.removeItem('quiz_user_data'); // Datos antiguos
  
  // Mantener: quiz_theme (preferencia de tema del usuario)
  // Mantener: quiz_*_answers (intentos de quiz activos - el usuario decide si los borra)
  
  // Redirigir a la página de autenticación
  window.location.href = '/auth';
}
