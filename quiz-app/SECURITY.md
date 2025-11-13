# 🔒 Seguridad de la Aplicación

## SQL Injection - Estado: ✅ PROTEGIDO

### Medidas implementadas:

#### 1. Consultas parametrizadas (Prepared Statements)
Todas las consultas SQL utilizan parámetros posicionales `$1, $2, $3...` proporcionados por el driver `pg` de PostgreSQL:

```javascript
// ✅ SEGURO
await query('SELECT * FROM users WHERE name = $1', [username])
await query('INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3)', [name, email, hash])
```

**Archivos protegidos:**
- `/pages/api/register-user.js` - Registro de usuarios
- `/pages/api/login.js` - Autenticación
- `/pages/api/subjects.js` - CRUD de materias
- `/pages/api/subjects/[id].js` - Operaciones individuales
- `/pages/api/attempts.js` - Gestión de intentos
- `/pages/api/ranking.js` - Rankings
- `/pages/api/admin/*.js` - Panel administrativo

#### 2. Validación de entrada
- **IDs numéricos:** Validación con `parseInt()` y verificación de rango
- **Emails:** Validación con regex antes de queries
- **Usernames:** Filtro de profanidad + validación de formato
- **Búsquedas ILIKE:** Escape de wildcards (`%`, `_`) para prevenir búsquedas maliciosas

```javascript
// Escape de wildcards en búsquedas
const sanitizedSearch = search.replace(/[%_]/g, '\\$&')
sql += ' WHERE name ILIKE $1'
params = [`%${sanitizedSearch}%`]
```

#### 3. Validación de tipos
```javascript
// Verificación antes de consultas
if (typeof name !== 'string' || name.trim().length < 2) {
  return res.status(400).json({ error: 'Nombre inválido' })
}
```

### ⚠️ Áreas que requieren atención manual:

1. **Queries dinámicas complejas** en `/pages/api/attempts.js` y `/pages/api/ranking.js`:
   - Usan CASE statements y CAST con datos de BD (no input de usuario)
   - Estado: ✅ Seguro porque los valores vienen de la propia base de datos
   - Monitorear si se agregan filtros con input de usuario directo

2. **Filtros por materia** (`subject` query param):
   - Validar que sea un ID numérico antes de usarlo en WHERE clauses
   - Actualmente usa parametrización, pero agregar validación adicional

## Autenticación - Estado: ✅ SEGURO

### Medidas implementadas:

#### 1. Hashing de contraseñas
- **Algoritmo:** bcrypt con saltRounds=10
- **No se almacenan contraseñas en texto plano**

```javascript
const passwordHash = await bcrypt.hash(password, 10)
```

#### 2. JSON Web Tokens (JWT)
- Tokens firmados con secreto en variable de entorno
- Incluyen información mínima (id, name, email, is_admin)
- Validación en middleware para rutas protegidas

#### 3. Validación de roles
```javascript
// Verificación de admin antes de operaciones sensibles
const user = userResult.rows[0]
if (!user.is_admin) {
  return res.status(403).json({ message: 'Admin access required' })
}
```

## Validación de Contenido

### Filtro de profanidad local
- **150+ palabras** bloqueadas (español/inglés)
- **Normalización de leetspeak:** p3nd3jo → pendejo, put0 → puto
- **Sin dependencias de APIs externas** (eliminadas por problemas de timeout)
- **Sincrónico:** No causa delays en registro

```javascript
// Detección de variaciones
normalizeText('p@nd3j0') // → 'pendejo' → BLOQUEADO
normalizeText('put  o') // → 'puto' → BLOQUEADO
```

## Configuración de Variables de Entorno

### Variables sensibles (NO commitear):
```bash
DATABASE_URL=postgresql://... # Conexión a PostgreSQL
JWT_SECRET=... # Secreto para firmar tokens
EMAIL_HOST=... # SMTP para emails
EMAIL_PASS=... # Contraseña SMTP
```

### Protección:
- Archivo `.env.local` en `.gitignore`
- Variables configuradas en Vercel (panel de configuración)

## Recomendaciones Adicionales

### 1. Rate Limiting ✅ IMPLEMENTADO
Protección contra fuerza bruta y DDoS en endpoints críticos:

**Límites configurados:**
- **Login:** 5 intentos por 15 minutos por IP
- **Registro:** 3 cuentas por hora por IP
- **Quiz submission:** 10 intentos por hora por IP
- **API general:** 100 requests por minuto por IP

**Implementación:**
```javascript
// En /lib/rate-limit.js
import { loginLimiter, applyRateLimit } from '../../lib/rate-limit'

// Proteger endpoint
const rateLimitResult = await applyRateLimit(loginLimiter, req, res)
if (rateLimitResult) return rateLimitResult
```

**Modos de operación:**
1. **Sistema en memoria** (ACTUAL):
   - Implementación simple y confiable
   - No requiere servicios externos
   - Auto-limpieza de memoria
   - ⚠️ No compartido entre múltiples instancias serverless
   - ✅ Suficiente para cargas moderadas

2. **Con Upstash Redis** (OPCIONAL - mejora futura):
   - Compartido entre todas las instancias serverless
   - Persistente y más preciso
   - Analytics incluido
   - Requiere configurar: `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`
   - 💡 Recomendado solo si experimentas tráfico muy alto

**Headers de respuesta:**
```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 3
X-RateLimit-Reset: 2025-11-10T15:30:00.000Z
Retry-After: 900 (cuando alcanza el límite)
```

**Endpoints protegidos:**
- ✅ `/api/login` - Protección contra fuerza bruta
- ✅ `/api/register-user` - Prevención de spam de cuentas
- ✅ `/api/attempts` (POST) - Limitación de envío de quizzes

### 2. Headers de Seguridad ✅ IMPLEMENTADO
Configurados via middleware en `middleware.js`:
```javascript
X-Frame-Options: DENY               // Previene clickjacking
X-Content-Type-Options: nosniff     // Previene MIME sniffing
X-XSS-Protection: 1; mode=block     // Protección XSS legacy
Referrer-Policy: origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Content-Security-Policy: ...        // Política de contenido restrictiva
```

### 3. Protección DDoS ✅ MEJORADO

**Capas de defensa:**

1. **Vercel (Infraestructura):**
   - ✅ CDN global distribuido
   - ✅ Anycast DNS
   - ✅ Escalado automático serverless
   - ✅ Límites de ejecución (10s timeout)
   - ✅ Protección L3/L4 automática

2. **Rate Limiting (Aplicación):**
   - ✅ Límites por endpoint
   - ✅ Identificación por IP
   - ✅ Sliding window algorithm
   - ✅ Respuestas 429 Too Many Requests

3. **Validación de entrada:**
   - ✅ Tipos de datos
   - ✅ Longitudes máximas
   - ✅ Formatos (email, etc.)
   - ✅ Sanitización de búsquedas

**Monitoreo recomendado:**
- Logs de Vercel para detectar patrones
- Métricas de Upstash para ver intentos bloqueados
- Alertas en picos de tráfico anormales

**Configuración en Vercel:**
1. Variables de entorno:
   ```bash
   UPSTASH_REDIS_REST_URL=https://...
   UPSTASH_REDIS_REST_TOKEN=...
   ```

2. (Opcional) Web Application Firewall:
   - Vercel Pro/Enterprise incluye protección DDoS avanzada
   - Rate limiting a nivel de edge
   - IP blocking automático

### 4. CORS ⚠️ Pendiente
Configurar encabezados CORS restrictivos:
```javascript
res.setHeader('Access-Control-Allow-Origin', 'https://quizy.es')
res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
```

### 5. Auditoría de dependencias ⚠️ Acción requerida
```bash
npm audit
npm audit fix
```

**Vulnerabilidades actuales detectadas:**
- 1 crítica
- 1 alta
- 1 moderada

**Acción:** Revisar con `npm audit` y actualizar paquetes seguros.

### 6. Logs de seguridad ⚠️ Recomendado
Registrar eventos importantes:
- Intentos de login fallidos
- Cambios de contraseña
- Accesos administrativos
- Errores de validación repetitivos

## Checklist de Seguridad

- [x] Consultas parametrizadas en todas las queries SQL
- [x] Hashing de contraseñas con bcrypt
- [x] JWT para autenticación
- [x] Validación de entrada (tipos, formatos, longitudes)
- [x] Filtro de profanidad
- [x] Escape de wildcards en búsquedas
- [x] Validación de IDs numéricos
- [x] Verificación de roles (admin)
- [x] Variables de entorno protegidas
- [x] Rate limiting en endpoints críticos
- [x] Headers de seguridad (middleware)
- [x] Protección DDoS multi-capa
- [ ] CORS restrictivo (pendiente)
- [ ] Logs de auditoría (pendiente)
- [ ] Actualización de dependencias vulnerables (3 detectadas)

## Reporte de Vulnerabilidades

Si encuentras una vulnerabilidad de seguridad, por favor NO la publiques públicamente. Contacta directamente al equipo de desarrollo.

---

**Última actualización:** 10 de noviembre de 2025
**Estado general:** ✅ PROTEGIDO (DDoS, SQL Injection, Rate Limiting implementados)

## Configuración para Producción

### Variables de entorno requeridas:

```bash
# Obligatorias
DATABASE_URL=postgresql://...
JWT_SECRET=...
EMAIL_HOST=smtp.gmail.com
EMAIL_PASS=...

# Opcionales (rate limiting avanzado)
# UPSTASH_REDIS_REST_URL=https://...
# UPSTASH_REDIS_REST_TOKEN=...
```

### Pasos de deployment:

1. **Verificar variables en Vercel:**
   - Settings → Environment Variables
   - Agregar todas las variables obligatorias de `.env.example`
   - Rate limiting funciona automáticamente en memoria

2. **(Opcional) Configurar Upstash Redis** para rate limiting compartido:
   ```bash
   # Solo necesario si tienes múltiples instancias serverless
   # y experimentas tráfico muy alto
   # Ir a https://console.upstash.com/
   # Crear nuevo database Redis (gratis hasta 10k requests/día)
   # Copiar REST URL y Token
   # Agregar a variables de entorno en Vercel
   ```

3. **Monitorear logs:**
   ```bash
   # Vercel Dashboard → Deployments → Logs
   # Buscar respuestas 429 (rate limit alcanzado)
   ```

4. **Testing de rate limits:**
   ```bash
   # Login (5 intentos por 15 min)
   for i in {1..6}; do curl -X POST https://tu-dominio.com/api/login \
     -d '{"name":"test","password":"wrong"}'; done
   
   # Debe devolver 429 en el sexto intento
   ```

### Métricas recomendadas:

- **Vercel Analytics:** Tráfico, errores 429, response times
- **Logs:** Patrones de IPs sospechosas, intentos repetidos
- **(Opcional) Upstash Dashboard:** Requests bloqueados, latencia (si Redis está configurado)

---

**Última actualización:** 10 de noviembre de 2025  
**Estado general:** ✅ PROTEGIDO (con rate limiting y headers de seguridad)
