/**
 * Módulo de validación y sanitización de inputs
 * Previene inyecciones SQL, XSS y otros ataques
 */

/**
 * Valida que un ID sea un número entero positivo
 * @param {any} id - ID a validar
 * @returns {number|null} ID validado o null si es inválido
 */
export function validateId(id) {
  const numId = parseInt(id, 10);
  if (isNaN(numId) || numId <= 0) {
    return null;
  }
  return numId;
}

/**
 * Valida formato de email
 * @param {string} email - Email a validar
 * @returns {boolean} true si es válido
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  // RFC 5322 simplificado
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Valida longitud de string
 * @param {string} str - String a validar
 * @param {number} min - Longitud mínima
 * @param {number} max - Longitud máxima
 * @returns {boolean} true si es válido
 */
export function validateStringLength(str, min, max) {
  if (typeof str !== 'string') {
    return false;
  }
  const len = str.trim().length;
  return len >= min && len <= max;
}

/**
 * Sanitiza un string para prevenir XSS
 * @param {string} str - String a sanitizar
 * @returns {string} String sanitizado
 */
export function sanitizeString(str) {
  if (typeof str !== 'string') {
    return '';
  }
  
  // Escapar caracteres HTML peligrosos
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Valida que un valor sea booleano
 * @param {any} value - Valor a validar
 * @returns {boolean|null} Booleano o null si es inválido
 */
export function validateBoolean(value) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (value === 'true' || value === '1') {
    return true;
  }
  if (value === 'false' || value === '0') {
    return false;
  }
  return null;
}

/**
 * Valida que un array contenga solo números
 * @param {any} arr - Array a validar
 * @returns {number[]|null} Array de números o null si es inválido
 */
export function validateNumberArray(arr) {
  if (!Array.isArray(arr)) {
    return null;
  }
  
  const numbers = arr.map(item => {
    const num = parseInt(item, 10);
    return isNaN(num) ? null : num;
  });
  
  // Si alguno es null, el array es inválido
  if (numbers.includes(null)) {
    return null;
  }
  
  return numbers;
}

/**
 * Valida límite y offset para paginación
 * @param {any} limit - Límite de resultados
 * @param {any} offset - Offset de resultados
 * @param {number} maxLimit - Límite máximo permitido
 * @returns {{limit: number, offset: number}} Valores validados
 */
export function validatePagination(limit, offset, maxLimit = 100) {
  const validLimit = Math.min(
    Math.max(1, parseInt(limit, 10) || 20),
    maxLimit
  );
  
  const validOffset = Math.max(0, parseInt(offset, 10) || 0);
  
  return {
    limit: validLimit,
    offset: validOffset
  };
}

/**
 * Valida que un objeto JSON sea válido y no exceda tamaño máximo
 * @param {any} obj - Objeto a validar
 * @param {number} maxSize - Tamaño máximo en bytes
 * @returns {object|null} Objeto validado o null si es inválido
 */
export function validateJSON(obj, maxSize = 10000) {
  if (!obj || typeof obj !== 'object') {
    return null;
  }
  
  try {
    const jsonString = JSON.stringify(obj);
    if (jsonString.length > maxSize) {
      return null;
    }
    return obj;
  } catch (error) {
    return null;
  }
}

/**
 * Valida una URL
 * @param {string} url - URL a validar
 * @returns {boolean} true si es válida
 */
export function validateURL(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Previene SQL injection validando que no haya caracteres peligrosos
 * en campos que se usarán en queries dinámicas (aunque deberían usarse parámetros)
 * @param {string} str - String a validar
 * @returns {boolean} true si es seguro
 */
export function isSafeSQLString(str) {
  if (typeof str !== 'string') {
    return false;
  }
  
  // Detectar patrones comunes de inyección SQL
  const dangerousPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    /(--|\;|\/\*|\*\/)/,
    /(\bOR\b.*=.*)/i,
    /(\bAND\b.*=.*)/i,
    /(UNION.*SELECT)/i,
    /(script|javascript|onerror|onload)/i
  ];
  
  return !dangerousPatterns.some(pattern => pattern.test(str));
}

/**
 * Valida contraseña segura
 * @param {string} password - Contraseña a validar
 * @returns {{valid: boolean, errors: string[]}} Resultado de validación
 */
export function validatePassword(password) {
  const errors = [];
  
  if (!password || typeof password !== 'string') {
    return { valid: false, errors: ['Contraseña requerida'] };
  }
  
  if (password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres');
  }
  
  if (password.length > 128) {
    errors.push('La contraseña no puede tener más de 128 caracteres');
  }
  
  // Validar que tenga letras y números (requisito de seguridad)
  const hasNumber = /\d/.test(password);
  const hasLetter = /[a-zA-Z]/.test(password);
  
  if (!hasNumber || !hasLetter) {
    errors.push('La contraseña debe contener letras y números');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Trunca un string a una longitud máxima
 * @param {string} str - String a truncar
 * @param {number} maxLength - Longitud máxima
 * @returns {string} String truncado
 */
export function truncateString(str, maxLength) {
  if (typeof str !== 'string') {
    return '';
  }
  
  if (str.length <= maxLength) {
    return str;
  }
  
  return str.substring(0, maxLength);
}

/**
 * Valida tipo de notificación
 * @param {string} type - Tipo de notificación
 * @returns {boolean} true si es válido
 */
export function validateNotificationType(type) {
  const validTypes = [
    'streak_reminder',
    'ranking_update',
    'new_content',
    'achievement',
    'friend_activity',
    'system'
  ];
  
  return validTypes.includes(type);
}
