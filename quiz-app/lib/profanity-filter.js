/**
 * Sistema de filtro de palabras inapropiadas - Filtro Local Robusto
 * Sin dependencias externas, 100% confiable y rápido
 */

/**
 * Lista de palabras prohibidas (backup local si la API falla)
 * Lista completa y reforzada con variaciones comunes
 */
const BLACKLIST = [
  // Español - Palabras groseras básicas
  'puto', 'puta', 'putas', 'putos', 'putita', 'putito',
  'hijoputa', 'hijo de puta', 'hijoeputa', 'hdp', 'hp',
  'mierda', 'mierdas', 'cagada', 'cagar', 'cago', 'caga',
  'coño', 'coñazo', 'coñaso', 'cojones', 'cojone', 'cojon',
  
  // Insultos comunes español
  'gilipollas', 'gilipoyas', 'gilipuertas', 'imbecil', 'imbécil',
  'cabron', 'cabrón', 'cabrona', 'cabrones', 'cabronazo',
  'pendejo', 'pendeja', 'pendejos', 'pendejas',
  'idiota', 'estúpido', 'estupido', 'estupida', 'estúpida',
  'tarado', 'tarada', 'tonto', 'tonta', 'lerdo', 'lerda',
  
  // Términos ofensivos sexuales
  'verga', 'pene', 'pito', 'pija', 'pijo', 'chocho', 'chocha',
  'teta', 'tetas', 'polla', 'pollas', 'pollón', 'pollon',
  'huevos', 'huevo', 'boludo', 'boluda', 'boludos', 'boludas',
  'mamar', 'mamada', 'mamadas', 'chupada', 'chupalo', 'chupala',
  
  // Términos homofóbicos
  'marica', 'maricon', 'maricón', 'maricona', 'maricones',
  'puto marica', 'mariposón', 'mariposa', 'gay de mierda',
  'joto', 'jotos', 'mariposón', 'mariposon',
  
  // Términos sexistas
  'perra', 'perras', 'zorra', 'zorras', 'zorrón', 'zorron',
  'guarra', 'guarras', 'guarrón', 'guarron', 'putón', 'puton',
  'ramera', 'fulana', 'furcia',
  
  // Términos racistas y discriminatorios
  'nazi', 'nazis', 'fascista', 'facha', 'fachas',
  'subnormal', 'subnormales', 'retrasado', 'retrasada', 'retrasados',
  'mongoloide', 'mongolo', 'mogolico', 'mogólico',
  'inutil', 'inútil', 'basura', 'escoria', 'lacra',
  
  // Términos de odio
  'terrorista', 'matar', 'matare', 'mataré', 'morir', 'muere', 'muérete',
  'suicidate', 'suicídate', 'ahorcate', 'ahórcate',
  'violador', 'violar', 'violación', 'violacion',
  
  // Inglés - Palabras groseras
  'fuck', 'fucked', 'fucking', 'fucker', 'fck', 'fuk',
  'shit', 'shitty', 'bullshit', 'crap', 'crappy',
  'bitch', 'bitches', 'biotch', 'biatch',
  'asshole', 'ass', 'arse', 'arsehole',
  'bastard', 'bastards', 'dumbass', 'jackass',
  
  // Términos racistas inglés
  'nigger', 'nigga', 'niggas', 'negro', 'negra',
  'chink', 'gook', 'spic', 'wetback', 'beaner',
  
  // Términos homofóbicos inglés
  'fag', 'faggot', 'faggots', 'fagot', 'dyke',
  'queer', 'homo', 'homos',
  
  // Términos sexuales inglés
  'cunt', 'cunts', 'pussy', 'dick', 'cock', 'penis',
  'vagina', 'tits', 'boobs', 'porn', 'porno',
  'whore', 'slut', 'sluts', 'hoe', 'hoes',
  
  // Variaciones con números y símbolos (leetspeak)
  'p3nd3jo', 'put0', 'put4', 'c0ño', 'c4bron',
  'sh1t', 'fvck', 'fck', 'f*ck', 'f**k',
  'b1tch', 'a$$', '@$$', 'a$$hole',
  
  // Términos spam/comerciales
  'viagra', 'cialis', 'casino', 'poker', 'xxx',
  'sex', 'sexy', 'sexo', 'porno', 'porn',
  
  // Insultos adicionales español
  'mamón', 'mamon', 'mamona', 'mamones',
  'culero', 'culera', 'culeros', 'ojete',
  'comepicha', 'comepinga', 'chupapollas',
  'chingada', 'chingar', 'chingado', 'chinga',
  'carajo', 'carajos', 'joder', 'jodete', 'jódete',
  'hostia', 'hostias', 'me cago', 'mecago',
  
  // Términos de acoso
  'muerete', 'muérete', 'matate', 'mátate',
  'kill yourself', 'kys', 'die', 'death',
  'rape', 'raped', 'raping', 'rapist'
]

/**
 * Normaliza el texto para la comparación local
 * Convierte leetspeak y variaciones comunes
 */
function normalizeText(text) {
  let normalized = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // eliminar acentos
  
  // Convertir leetspeak y variaciones numéricas
  const replacements = {
    '0': 'o',
    '1': 'i',
    '3': 'e',
    '4': 'a',
    '5': 's',
    '7': 't',
    '8': 'b',
    '@': 'a',
    '$': 's',
    '!': 'i',
    '*': '',
    '+': 't',
    '|': 'i',
    '_': '',
    '-': '',
    '.': '',
    ',': ''
  }
  
  for (const [symbol, letter] of Object.entries(replacements)) {
    normalized = normalized.split(symbol).join(letter)
  }
  
  // Eliminar todos los caracteres no alfabéticos y espacios múltiples
  normalized = normalized
    .replace(/[^a-z]/g, '')
    .trim()
  
  return normalized
}

/**
 * Filtro local mejorado con detección de palabras parciales
 */
function checkLocalBlacklist(text) {
  const normalized = normalizeText(text)
  const foundWords = []

  for (const badWord of BLACKLIST) {
    const normalizedBadWord = normalizeText(badWord)
    if (normalized.includes(normalizedBadWord)) {
      foundWords.push(badWord)
    }
  }

  return {
    isClean: foundWords.length === 0,
    foundWords: foundWords
  }
}

/**
 * Verifica si un texto contiene palabras inapropiadas
 * Usa solo filtro local robusto (rápido y confiable)
 * @param {string} text - Texto a verificar
 * @returns {Object} - { isClean: boolean, method: string, details: string }
 */
export function checkProfanity(text) {
  if (!text || typeof text !== 'string') {
    console.log('⏭️  Texto vacío o inválido, skip validation')
    return { isClean: true, method: 'skip', details: null }
  }

  console.log('🔎 Verificando con filtro local:', text)
  
  const localResult = checkLocalBlacklist(text)
  console.log('✅ Resultado:', localResult.isClean ? 'LIMPIO ✓' : 'BLOQUEADO ✗', localResult.foundWords)
  
  return {
    isClean: localResult.isClean,
    method: 'local-blacklist',
    details: localResult.foundWords.length > 0 
      ? `Palabras detectadas: ${localResult.foundWords.join(', ')}` 
      : null
  }
}

/**
 * Valida un nombre de usuario
 * @param {string} username - Nombre de usuario a validar
 * @returns {Object} - { valid: boolean, error: string }
 */
export function validateUsername(username) {
  // Verificar longitud
  if (!username || username.length < 2) {
    return { 
      valid: false, 
      error: 'El nombre debe tener al menos 2 caracteres' 
    }
  }

  if (username.length > 50) {
    return { 
      valid: false, 
      error: 'El nombre no puede tener más de 50 caracteres' 
    }
  }

  // Verificar caracteres válidos
  const validPattern = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\-_]+$/
  if (!validPattern.test(username)) {
    return { 
      valid: false, 
      error: 'El nombre solo puede contener letras, números, espacios y guiones' 
    }
  }

  // Verificar palabras inapropiadas con filtro local
  const profanityCheck = checkProfanity(username)
  
  console.log('🔎 profanityCheck resultado:', profanityCheck)
  
  if (!profanityCheck.isClean) {
    return { 
      valid: false, 
      error: '❌ El nombre contiene lenguaje inapropiado. Por favor, elige otro nombre.',
      details: profanityCheck.details
    }
  }

  return { valid: true, error: null }
}

/**
 * Valida un texto general (para mensajes, títulos, etc.)
 * @param {string} text - Texto a validar
 * @param {number} maxLength - Longitud máxima permitida
 * @returns {Object} - { valid: boolean, error: string }
 */
export function validateText(text, maxLength = 500) {
  if (!text || text.trim().length === 0) {
    return { 
      valid: false, 
      error: 'El texto no puede estar vacío' 
    }
  }

  if (text.length > maxLength) {
    return { 
      valid: false, 
      error: `El texto no puede tener más de ${maxLength} caracteres` 
    }
  }

  // Verificar palabras inapropiadas con filtro local
  const profanityCheck = checkProfanity(text)
  if (!profanityCheck.isClean) {
    return { 
      valid: false, 
      error: '❌ El texto contiene lenguaje inapropiado. Por favor, revisa tu mensaje.',
      details: profanityCheck.details
    }
  }

  return { valid: true, error: null }
}
