# Quiz App — Cuestionarios de repaso (local en PrimerParcial)

Esta copia del proyecto `quiz-app` está situada dentro de la carpeta de la asignatura para mantener todo en el mismo sitio.

## 🆕 Nuevas Features (Noviembre 2025)

### 📝 Sistema de Creación de Cuestionarios (Admin)
Los administradores pueden ahora crear cuestionarios personalizados directamente desde la web sin necesidad de editar archivos JSON.

- **Acceso:** `/admin/questionnaires`
- **Características:**
  - Creación de cuestionarios con interfaz visual
  - Editor de preguntas con múltiples opciones
  - Soporte para respuestas múltiples
  - Asociación con asignaturas
  - Almacenamiento en PostgreSQL

### 💬 Sistema de Soporte y Ayuda
Los usuarios pueden enviar solicitudes de ayuda y los admins pueden gestionarlas.

- **Para Usuarios:** `/support` - Enviar dudas o problemas
- **Para Admins:** `/admin/support` - Gestionar tickets de soporte
- **Estados:** Abierto, En Progreso, Resuelto, Cerrado

📚 **Documentación detallada:**
- [Guía Rápida](QUICKSTART_NEW_FEATURES.md)
- [Documentación Completa](FEATURES_QUESTIONNAIRES_SUPPORT.md)

---

## Requisitos e instalación:

```bash
cd "/Users/anico/Documents/GitHub/4to/Arq Virt/Teoria/PrimerParcial/quiz-app"
npm install
npm run dev
```

Notas adicionales:


	SUPABASE_URL and SUPABASE_KEY

	Si se definen, el endpoint `/api/ranking` escribirá/leerá en la tabla `ranking` de Supabase. Si no, usa `data/ranking.json` local.

Siguientes mejoras ya implementadas parcialmente: temporizador, navegación libre entre preguntas, marcado para revisar y persistencia local de respuestas.

Siguientes mejoras que implementaré en orden: 1) diseño profesional (Tailwind+Framer Motion), 2) temporizador y navegación/revisión (añadido parcialmente), 3) ranking persistente (archivo local ya disponible; opción a Supabase si quieres).
Este repositorio contiene una aplicación de examen/repaso creada en Next.js. Está diseñada para trabajar con bancos de preguntas en JSON (ubicados en `../bancoDePreguntas`) y soporta:

- Modo examen con navegación y revisión de preguntas
- Guardado local de respuestas y marcado de preguntas
- Exportar resultados a PDF (imagen paginada o texto paginado)
- Historial de intentos y ranking global (soporta Postgres local o Supabase como backend)

Contenido y archivos importantes

- `pages/` — Páginas de la aplicación (index, quiz, results, ranking, attempts, auth, etc.)
- `pages/api/` — Endpoints: `banks`, `bank/[bank]`, `attempts`, `ranking` (soporte Postgres/Supabase/fallback a archivos)
- `bancoDePreguntas/` (fuera de esta carpeta) — Debes colocar aquí tus JSON de bancos: `rec1_qna.json`, `rec2_qna.json`, etc.
- `data/` — Archivos de fallback: `ranking.json`, `attempts.json` (usados si no hay base de datos configurada)
- `lib/db.js` — Cliente minimal con `pg` (se usa cuando `DATABASE_URL` está configurada)
- `sql/migrations/001_init.sql` — Migración para crear las tablas `attempts` y `ranking` en Postgres
- `sql/supabase_policies.sql` — SQL listo para ejecutar en Supabase (tablas + RLS policies)
- `docker-compose.yml` — Levanta Postgres y Adminer para desarrollo local
- `scripts/setup_dev.sh` — Script que automatiza el arranque (Colima/Docker, docker-compose, npm install, migraciones, npm run dev)

Requisitos

- Node.js 18+ (probado con Node 22) y npm
- Docker Desktop o Colima (para el entorno Postgres local)
- `nc` / `netcat` disponible (para el script de espera)

Variables de entorno

Crear un archivo `.env.local` en `quiz-app` (se sugiere usar `.env.local.example` si existe). Variables principales:

- POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB — credenciales locales
- DATABASE_URL — cadena de conexión Postgres (ej: `postgres://user:pass@localhost:5432/dbname`)
- NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_KEY — opcional, para uso del cliente Supabase
- SUPABASE_URL, SUPABASE_KEY — opcional, service key para uso desde el servidor

Cómo ejecutar todo (modo recomendado — automatizado)

1) Desde la carpeta del proyecto `quiz-app`, dar permiso al script y ejecutarlo:

```bash
cd "/Users/anico/Documents/GitHub/4to/Arq Virt/Teoria/PrimerParcial/quiz-app"
chmod +x scripts/setup_dev.sh
./scripts/setup_dev.sh
```

Esto hará:
- arrancar Colima (si está instalado) o intentar abrir Docker Desktop
- levantar Postgres + Adminer (puerto 5432 y 8080 respectivamente)
- esperar a que Postgres acepte conexiones
- instalar dependencias con `npm install`
- ejecutar `npm run db:init` para aplicar la migración SQL (crea `attempts` y `ranking`)
- arrancar Next.js en modo desarrollo (en background). Logs en `/tmp/quiz-next.log`.

2) Acceder a la app:

- Frontend: http://localhost:3000
- Adminer (GUI para la BD): http://localhost:8080 (usa credenciales de `.env.local`)

Si prefieres ejecutar los pasos manualmente:

```bash
# levantar contenedores
docker-compose up -d
# instalar deps
npm install
# aplicar migración
npm run db:init
# arrancar dev
npm run dev
```

APIs disponibles (resumen)

- `GET /api/banks` — lista de bancos detectados (lee `../bancoDePreguntas`)
- `GET /api/bank/[bank]` — devuelve preguntas/metadata del banco solicitado
- `GET /api/attempts?email=<email>` — devuelve intentos (Postgres → Supabase → local file fallback)
- `POST /api/attempts` — guarda un intento (acepta `{ bank, score, answers, user }`)
- `GET/POST /api/ranking` — obtiene/guarda posición en el ranking (Postgres → Supabase → local file fallback)

Integración con Postgres local

- `docker-compose.yml` arranca un contenedor Postgres (usuario `quiz_user`, base `quizdb` por defecto).
- Ejecuta `npm run db:init` para correr `sql/migrations/001_init.sql`.
- El código del backend detecta `process.env.DATABASE_URL` y prefiera usar Postgres cuando está presente.

Integración con Supabase

Si prefieres Supabase en vez de la BD local:

1. Crea un proyecto en supabase.com.
2. En SQL Editor, pega y ejecuta `sql/supabase_policies.sql` (ya incluye RLS policies y creación de tablas).
3. Añade las variables de entorno en `.env.local` o en la plataforma de hosting (Next):
	 - NEXT_PUBLIC_SUPABASE_URL
	 - NEXT_PUBLIC_SUPABASE_KEY
	 - SUPABASE_URL (server)
	 - SUPABASE_KEY (service role)

Seguridad y RLS

- Las políticas de `sql/supabase_policies.sql` permiten a usuarios autenticados insertar sus intentos y ver solo los suyos, y hacen público el `ranking`.
- Para inserciones/lecturas del servidor se recomienda usar la `service_role` key en el entorno del servidor y NO exponerla en el cliente.

Exportar resultados a PDF

- La página `pages/results.js` ofrece dos métodos de export:
	- Imagen paginada (html2canvas + jsPDF): captura la vista y la exporta en slices.
	- Texto paginado (jsPDF): construye un PDF de texto con preguntas, respuesta del usuario y respuesta correcta.

Pautas para desarrollo y test

- Añadir ESLint + Prettier: se recomienda (no incluido por defecto).
- Tests: sugerencia usar React Testing Library para componentes críticos (`QuestionCard`, navegación, cálculo de score).

Problemas comunes y soluciones

- Docker daemon no disponible: si `docker-compose up` falla, asegúrate de arrancar Docker Desktop o ejecutar `colima start` en macOS.
- `DATABASE_URL not set` al ejecutar migración: crea `.env.local` o exporta `DATABASE_URL` en tu shell antes de `npm run db:init`.
- Next.js error sobre `<Link>` con `<a>` child: actualiza el uso de `Link` (el proyecto ya tiene correcciones aplicadas).

Estructura del proyecto (resumen)

```
quiz-app/
├─ pages/
│  ├─ index.js
│  ├─ quiz/[bank].js
│  ├─ results.js
│  ├─ attempts.js
│  ├─ ranking.js
│  ├─ auth.js
	└─ api/
		 ├─ banks.js
		 ├─ bank/[bank].js
		 ├─ attempts.js
		 └─ ranking.js
├─ lib/
│  ├─ supabaseClient.js
│  └─ db.js
├─ sql/
│  ├─ migrations/001_init.sql
│  └─ supabase_policies.sql
├─ data/
│  ├─ ranking.json
│  └─ attempts.json
├─ docker-compose.yml
├─ scripts/
│  ├─ db/init_db.js
│  └─ setup_dev.sh
└─ package.json
```

Siguientes mejoras posibles (roadmap)

- Añadir tests automáticos y CI (GitHub Actions)
- Dockerfile para empaquetar la app y `docker-compose` que incluya la app en contenedor (producción/local)
- Páginas de perfil/attempt history con login completo (actualmente hay soporte básico de magic link en `auth.js`)
- Mejoras de accesibilidad (a11y) y atajos de teclado para navegación rápida

Contacto / ayuda

Si quieres que ejecute el setup por ti en este entorno, o que genere el Dockerfile para la app, dime qué prefieres y lo implemento.

---
Versión: 1.0 — Documento generado automáticamente por el asistente de desarrollo local.
