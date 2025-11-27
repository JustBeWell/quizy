/**
 * Rate Limiting para protección contra DDoS
 * 
 * Sistema simple en memoria compatible con serverless de Vercel
 */

// Almacenamiento global persistente entre invocaciones
if (!global.rateLimitStore) {
  global.rateLimitStore = new Map()
}

/**
 * Configuración de límites por endpoint
 */
const RATE_LIMITS = {
  login: {
    limit: 5,
    window: 15 * 60 * 1000 // 15 minutos
  },
  register: {
    limit: 3,
    window: 60 * 60 * 1000 // 1 hora
  },
  'change-password': {
    limit: 5,
    window: 15 * 60 * 1000 // 15 minutos
  },
  'reset-password': {
    limit: 5,
    window: 15 * 60 * 1000 // 15 minutos
  },
  'forgot-password': {
    limit: 3,
    window: 60 * 60 * 1000 // 1 hora
  },
  quiz: {
    limit: 10,
    window: 60 * 60 * 1000 // 1 hora
  },
  api: {
    limit: 100,
    window: 60 * 1000 // 1 minuto
  }
}

/**
 * Verificar rate limit para un identificador
 */
function checkRateLimit(identifier, config) {
  const now = Date.now()
  const key = identifier
  
  // Obtener requests previos
  let userRequests = global.rateLimitStore.get(key) || []
  
  // Limpiar requests fuera de la ventana
  userRequests = userRequests.filter(time => now - time < config.window)
  
  // Verificar límite
  if (userRequests.length >= config.limit) {
    const oldestRequest = Math.min(...userRequests)
    const resetTime = oldestRequest + config.window
    
    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      reset: new Date(resetTime)
    }
  }
  
  // Agregar request actual
  userRequests.push(now)
  global.rateLimitStore.set(key, userRequests)
  
  // Limpiar memoria periódicamente (evitar memory leaks)
  if (global.rateLimitStore.size > 10000) {
    const cutoff = now - config.window * 2
    for (const [k, times] of global.rateLimitStore.entries()) {
      if (times.every(t => t < cutoff)) {
        global.rateLimitStore.delete(k)
      }
    }
  }
  
  return {
    success: true,
    limit: config.limit,
    remaining: config.limit - userRequests.length,
    reset: new Date(now + config.window)
  }
}

/**
 * Obtener identificador del cliente (IP o fallback)
 */
export function getClientIdentifier(req) {
  // Vercel proporciona la IP real del cliente
  const forwarded = req.headers['x-forwarded-for']
  const ip = forwarded ? forwarded.split(',')[0].trim() : 
             req.headers['x-real-ip'] || 
             req.socket?.remoteAddress || 
             'unknown'
  
  return ip
}

/**
 * Aplicar rate limiting a un endpoint
 */
export async function applyRateLimit(type, req, res) {
  const config = RATE_LIMITS[type]
  
  if (!config) {
    console.error(`Rate limit type "${type}" no configurado`)
    return null // Continuar sin rate limit
  }
  
  const identifier = getClientIdentifier(req)
  const result = checkRateLimit(`${type}:${identifier}`, config)
  
  // Agregar headers de rate limit
  res.setHeader('X-RateLimit-Limit', result.limit)
  res.setHeader('X-RateLimit-Remaining', result.remaining)
  res.setHeader('X-RateLimit-Reset', result.reset.toISOString())
  
  if (!result.success) {
    const retryAfter = Math.ceil((result.reset.getTime() - Date.now()) / 1000)
    res.setHeader('Retry-After', retryAfter)
    
    return res.status(429).json({
      error: 'Demasiadas peticiones',
      message: 'Por favor espera un momento antes de intentar nuevamente',
      retryAfter,
      resetAt: result.reset.toISOString()
    })
  }
  
  return null // No hay error, continuar
}

// Exportar constantes para compatibilidad
export const loginLimiter = 'login'
export const registerLimiter = 'register'
export const quizLimiter = 'quiz'
export const apiLimiter = 'api'

