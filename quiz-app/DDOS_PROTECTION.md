# 🛡️ Protección contra Ataques DDoS

## Estado Actual: ✅ PROTEGIDO

Tu aplicación cuenta con **múltiples capas de defensa** contra ataques de denegación de servicio (DDoS).

---

## 🏗️ Arquitectura de Defensa

### Capa 1: Infraestructura Vercel
**Protección automática a nivel de red:**

- ✅ **CDN Global Distribuido**: El contenido se sirve desde múltiples ubicaciones edge
- ✅ **Anycast DNS**: Distribuye el tráfico automáticamente entre servidores
- ✅ **Escalado Serverless**: Las funciones escalan automáticamente según demanda
- ✅ **Timeouts**: Máximo 10 segundos por ejecución (evita bloqueos)
- ✅ **Protección L3/L4**: Vercel filtra ataques de red básicos automáticamente

**Resultado:** Absorbe ataques volumétricos y de red sin configuración adicional.

---

### Capa 2: Rate Limiting por IP
**Límites aplicados a nivel de aplicación:**

| Endpoint | Límite | Ventana | Propósito |
|----------|--------|---------|-----------|
| `/api/login` | 5 intentos | 15 minutos | Prevenir fuerza bruta |
| `/api/register-user` | 3 registros | 1 hora | Prevenir spam de cuentas |
| `/api/attempts` (POST) | 10 envíos | 1 hora | Limitar spam de quizzes |
| APIs generales | 100 requests | 1 minuto | Protección general |

**Implementación:**
```javascript
// Automático en cada endpoint protegido
const rateLimitResult = await applyRateLimit(loginLimiter, req, res)
if (rateLimitResult) return rateLimitResult // Devuelve 429 si excede límite
```

**Respuesta cuando se alcanza el límite:**
```json
{
  "error": "Demasiadas peticiones",
  "message": "Por favor espera un momento antes de intentar nuevamente",
  "retryAfter": 900,
  "resetAt": "2025-11-10T15:30:00.000Z"
}
```

**Headers HTTP incluidos:**
```
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 2025-11-10T15:30:00.000Z
Retry-After: 900
```

---

### Capa 3: Headers de Seguridad
**Protección contra ataques de navegador:**

```http
X-Frame-Options: DENY                    # Previene clickjacking
X-Content-Type-Options: nosniff          # Previene MIME sniffing
X-XSS-Protection: 1; mode=block          # Filtro XSS legacy
Referrer-Policy: origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Content-Security-Policy: ...             # Política de contenido restrictiva
```

**Resultado:** Bloquea ataques client-side como clickjacking, XSS reflejado, etc.

---

### Capa 4: Validación de Entrada
**Protección contra ataques maliciosos:**

- ✅ Validación de tipos (string, number, email)
- ✅ Longitudes máximas en todos los inputs
- ✅ Sanitización de búsquedas (escape de wildcards SQL)
- ✅ Validación de IDs numéricos
- ✅ Filtro de profanidad (150+ palabras)

**Resultado:** Previene SQL injection, buffer overflows, y payloads maliciosos.

---

## 🎯 Tipos de Ataques Mitigados

### ✅ Protegido Completamente:
1. **HTTP Flood** - Rate limiting bloquea requests excesivas
2. **Login Brute Force** - Máximo 5 intentos cada 15 minutos
3. **Registration Spam** - Máximo 3 cuentas por hora por IP
4. **Slowloris** - Timeout de 10s en Vercel
5. **SQL Injection** - Consultas parametrizadas + validación
6. **XSS** - Headers CSP + sanitización
7. **Clickjacking** - X-Frame-Options: DENY

### ⚠️ Parcialmente Protegido:
1. **DDoS Distribuido (Botnet)** - Vercel absorbe la mayoría, rate limiting ayuda
   - *Mejora:* Considerar Vercel Pro/Enterprise para WAF avanzado
2. **Layer 7 Application Attacks** - Protegido por rate limiting en memoria
   - *Limitación:* No compartido entre instancias serverless
   - *Mejora:* Agregar Redis (Upstash) para límites globales

### ❌ No Protegido (requiere acción manual):
1. **Ataques coordinados desde IPs residenciales** - Rate limiting por IP puede no ser suficiente
   - *Solución:* Implementar CAPTCHA en endpoints sensibles
2. **API Key Leaks** - Si alguien obtiene un JWT válido
   - *Solución:* Rotación regular de JWT_SECRET, monitoreo de actividad anómala

---

## 📊 Monitoreo de Ataques

### Logs de Vercel
**Buscar estos patrones:**

```bash
# Múltiples 429 desde la misma IP
[IP: 192.168.1.1] GET /api/login → 429 (x50 in 1min)

# Intentos de SQL Injection
[IP: 10.0.0.5] POST /api/subjects?search=' OR 1=1-- → 400

# Spam de registro
[IP: 172.16.0.10] POST /api/register-user → 429
```

### Métricas Clave
- **429 Too Many Requests**: Indica rate limiting funcionando
- **Response Time > 5s**: Posible ataque de recursos
- **Error Rate > 10%**: Podría ser ataque o problema legítimo
- **Requests/min por IP > 100**: Posible bot

### Alertas Recomendadas
1. Pico de 429s en 5 minutos → Ataque activo
2. Tráfico desde IPs no-geográficas → Botnet
3. Patrones regulares (cada X segundos) → Script automatizado

---

## 🚀 Mejoras Futuras (Opcional)

### Prioridad Alta
1. **CAPTCHA en Login/Registro** (Google reCAPTCHA v3)
   - Detecta bots sin molestar a usuarios reales
   - Implementación: 30 minutos

2. **IP Blacklist Manual**
   - Bloquear IPs específicas que atacan repetidamente
   - Implementación: 1 hora

### Prioridad Media
3. **Upstash Redis para Rate Limiting**
   - Rate limiting compartido entre instancias
   - Gratis hasta 10k requests/día
   - Implementación: Ya preparado, solo agregar env vars

4. **Monitoreo con Sentry**
   - Alertas automáticas de errores y patrones anómalos
   - Implementación: 2 horas

### Prioridad Baja
5. **Vercel Pro con WAF**
   - Firewall de aplicación web profesional
   - Costo: $20/mes
   - Protección DDoS avanzada incluida

6. **Cloudflare en frente de Vercel**
   - Capa adicional de protección DDoS
   - Plan gratuito disponible
   - Requiere configuración DNS

---

## 🧪 Testing de Protección

### Test Manual: Rate Limiting en Login

```bash
# Ejecutar desde terminal (reemplaza URL):
for i in {1..7}; do 
  echo "Intento $i:"
  curl -X POST https://tu-dominio.com/api/login \
    -H "Content-Type: application/json" \
    -d '{"name":"testuser","password":"wrongpass"}'
  echo -e "\n---"
done

# Resultado esperado:
# Intentos 1-5: 401 Unauthorized
# Intentos 6-7: 429 Too Many Requests
```

### Test Manual: Rate Limiting en Registro

```bash
for i in {1..5}; do
  echo "Registro $i:"
  curl -X POST https://tu-dominio.com/api/register-user \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"user$i\",\"email\":\"user$i@test.com\",\"password\":\"test123\"}"
  echo -e "\n---"
done

# Resultado esperado:
# Registros 1-3: 200 OK (o 409 si ya existe)
# Registros 4-5: 429 Too Many Requests
```

### Test Automático: Load Testing (opcional)

```bash
# Instalar herramienta
npm install -g artillery

# Crear archivo test.yml:
cat > load-test.yml << 'EOF'
config:
  target: 'https://tu-dominio.com'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - flow:
      - post:
          url: "/api/login"
          json:
            name: "testuser"
            password: "testpass"
EOF

# Ejecutar test
artillery run load-test.yml

# Verificar: Debe haber muchos 429s después de los primeros 5 intentos
```

---

## 📞 Respuesta a Incidentes

### Si detectas un ataque activo:

1. **Verificar en logs de Vercel:**
   - Dashboard → Logs
   - Filtrar por código 429
   - Identificar IPs atacantes

2. **Bloquear IPs (si es necesario):**
   ```javascript
   // Agregar en middleware.js
   const BLOCKED_IPS = ['1.2.3.4', '5.6.7.8']
   const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0]
   if (BLOCKED_IPS.includes(clientIP)) {
     return new Response('Forbidden', { status: 403 })
   }
   ```

3. **Ajustar límites temporalmente:**
   - Reducir límites en `lib/rate-limit.js`
   - Desplegar cambios inmediatamente

4. **Contactar Vercel Support:**
   - Si el ataque es masivo (>1000 req/s)
   - Ellos pueden aplicar protecciones adicionales

---

## ✅ Conclusión

Tu aplicación está **bien protegida** contra la mayoría de ataques DDoS comunes:

- ✅ Rate limiting funcionando en todos los endpoints críticos
- ✅ Headers de seguridad configurados
- ✅ Infraestructura Vercel con protección automática
- ✅ Validación de entrada robusta

**Próximo paso recomendado:** Agregar CAPTCHA en login/registro para detectar bots sofisticados.

**Mantenimiento:** Revisar logs mensualmente para detectar patrones anómalos.
