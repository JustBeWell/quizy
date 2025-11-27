# Sistema de Propuestas de Cuestionarios

## Descripción

Este sistema permite a los usuarios de Quizy proponer nuevos cuestionarios para la plataforma, incluyendo archivos adjuntos y enlaces de Google Drive.

## Funcionamiento

### 1. Página de Propuestas (`/propose-quiz`)

Los usuarios pueden:
- Completar un formulario con información del cuestionario
- Adjuntar hasta 5 archivos (máx. 10MB cada uno)
- Proporcionar enlaces de Google Drive
- Especificar nivel educativo, materia, número de preguntas, etc.

### 2. Procesamiento (API `/api/propose-quiz`)

**Flujo:**
1. Usuario envía el formulario con archivos
2. Los archivos se almacenan temporalmente en `/tmp/uploads` (compatible con Vercel)
3. Se envía un email al admin con:
   - Información del cuestionario
   - Archivos adjuntos
   - Enlaces de Drive
   - Datos del usuario
4. Se envía un email de confirmación al usuario
5. Los archivos temporales se eliminan después del envío

**Importante sobre archivos:**
- Los archivos NO se almacenan permanentemente en el servidor
- Solo existen como adjuntos en los emails enviados
- En Vercel, el filesystem es de solo lectura excepto `/tmp`
- Los archivos se eliminan automáticamente después de cada envío

### 3. Emails

**Email al Admin:**
- Formato HTML profesional con toda la información
- Archivos adjuntos directamente
- Enlaces de Drive clicables
- Información del usuario para contacto

**Email de Confirmación al Usuario:**
- Confirmación de recepción de la propuesta
- Timeline del proceso de revisión
- Tiempo estimado de respuesta (2-3 días hábiles)
- Enlace para continuar usando la plataforma

## Archivos Involucrados

- `pages/propose-quiz.js` - Página del formulario
- `pages/api/propose-quiz.js` - API endpoint para procesar propuestas
- `lib/email.js` - Funciones de email (añadida `sendQuizProposalConfirmation`)
- `components/Header.js` - Enlace en navegación
- `pages/index.js` - Enlace en footer de landing

## Configuración Requerida

Variables de entorno necesarias:
```
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=tu-app-password
NEXT_PUBLIC_APP_URL=https://quizy.es
```

## Tipos de Archivos Permitidos

- PDF
- Word (.doc, .docx)
- Excel (.xls, .xlsx)
- Texto plano (.txt)
- Imágenes (.jpg, .jpeg, .png)

## Limitaciones

- Máximo 5 archivos por propuesta
- Máximo 10MB por archivo
- Máximo 5 enlaces de Google Drive

## Proceso de Revisión (Manual)

1. El admin recibe el email con todos los materiales
2. Revisa el contenido y valida la calidad
3. Contacta al usuario vía email para aprobar/rechazar
4. Si se aprueba, procesa el cuestionario manualmente
5. Publica en la plataforma dando crédito al autor

## Mejoras Futuras Sugeridas

- [ ] Panel de admin para gestionar propuestas desde la web
- [ ] Base de datos para rastrear estado de propuestas
- [ ] Sistema automático de conversión de archivos a formato de cuestionario
- [ ] Notificaciones en la app cuando una propuesta es procesada
- [ ] Sistema de recompensas para usuarios que aportan contenido
