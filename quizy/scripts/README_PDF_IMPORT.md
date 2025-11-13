# 📚 Generador Automático de Cuestionarios desde PDF

Este script permite generar cuestionarios automáticamente a partir de PDFs usando IA (OpenAI GPT-4).

## ✨ Características

- ✅ **IDs únicos automáticos**: Cada pregunta recibe un ID único (`<bankId>_q<index>`) al momento de la importación
- ✅ **Sin colisiones**: No necesitas ejecutar scripts adicionales de corrección
- ✅ **Actualización inteligente**: Si un banco ya existe, mantiene su estructura de IDs
- ✅ **Organización automática**: Detecta temas y partes del nombre del archivo

## 🚀 Configuración

### 1. Instalar dependencias
```bash
npm install pdf-parse openai
```

### 2. Configurar API Key de OpenAI

Añade tu API key en el archivo `.env.local`:

```bash
OPENAI_API_KEY=tu-api-key-aqui
```

Para obtener una API key:
1. Ve a https://platform.openai.com/api-keys
2. Crea una cuenta o inicia sesión
3. Crea una nueva API key
4. Cópiala y pégala en `.env.local`

## 📖 Uso

### Comando básico
```bash
node scripts/import_pdf_to_quiz.js [directorio] [asignatura] [preguntas-por-pdf]
```

### Ejemplos

**Procesar los PDFs de Ingeniería Web (por defecto):**
```bash
node scripts/import_pdf_to_quiz.js
```

**Especificar directorio y asignatura:**
```bash
node scripts/import_pdf_to_quiz.js data/ingenieria-web "Ingeniería Web"
```

**Generar 15 preguntas por PDF:**
```bash
node scripts/import_pdf_to_quiz.js data/ingenieria-web "Ingeniería Web" 15
```

## 📁 Estructura de archivos

Los PDFs deben seguir este formato de nomenclatura:

- `Tema_1_1.pdf` → Tema 1, Parte 1
- `Tema_2_3.pdf` → Tema 2, Parte 3
- `Ing_Web_1_2.pdf` → Tema 1, Parte 2

El script detectará automáticamente el tema y la parte según los números en el nombre del archivo.

## 🔄 Funcionamiento

1. **Lee todos los PDFs** del directorio especificado
2. **Extrae el texto** de cada PDF
3. **Genera preguntas** usando GPT-4o-mini (más rápido y económico)
4. **Asigna IDs únicos** a cada pregunta automáticamente (formato: `<bankId>_q<index>`)
5. **Crea/actualiza** los bancos de preguntas en la base de datos
6. **Organiza** por temas según el nombre del archivo

## 💾 Base de datos

El script:
- Crea la asignatura si no existe
- Crea bancos de preguntas con nombre `Tema X.Y`
- **Genera IDs únicos** para cada pregunta (ej: `19_q0`, `19_q1`, etc.)
- Si un banco ya existe, lo actualiza manteniendo la estructura de IDs
- Asocia automáticamente los bancos a la asignatura

## 🆔 Sistema de IDs Únicos

**Nuevo desde Nov 2025**: Las preguntas ahora tienen IDs únicos desde el momento de la importación:

```json
{
  "id": "19_q0",
  "question": "¿Qué es la arquitectura web?",
  "options": [...],
  "answers": ["a"]
}
```

Esto previene:
- ❌ Colisiones en localStorage entre diferentes bancos
- ❌ Problemas en el scoring de resultados
- ❌ Necesidad de ejecutar scripts de corrección posteriores

## 📊 Salida del script

```
╔═══════════════════════════════════════════════════════════╗
║     📚 GENERADOR AUTOMÁTICO DE CUESTIONARIOS DESDE PDF    ║
╚═══════════════════════════════════════════════════════════╝

🚀 Iniciando procesamiento de PDFs...
📂 Directorio: data/ingenieria-web
📚 Asignatura: Ingeniería Web
❓ Preguntas por PDF: 10

📄 Encontrados 6 archivos PDF

============================================================
📖 Procesando: Ing_Web_1_2.pdf
📌 Identificado como: Tema 1.2
============================================================
📄 Extrayendo texto...
✅ Texto extraído: 4523 caracteres
🤖 Generando preguntas para Ing_Web_1_2.pdf...
✅ Generadas 10 preguntas
✅ Banco creado: Tema 1.2 (ID: 45)
✅ Completado: Ing_Web_1_2.pdf

...

============================================================
🎉 RESUMEN FINAL
============================================================
✅ Procesados exitosamente: 6
❌ Fallidos: 0
📊 Total: 6
============================================================
```

## 💰 Costos aproximados

Con GPT-4o-mini:
- **~$0.0001 por pregunta generada**
- **10 preguntas por PDF ≈ $0.001**
- **6 PDFs con 10 preguntas cada uno ≈ $0.006 (menos de 1 centavo)**

Muy económico para generar contenido de calidad.

## ⚠️ Solución de problemas

### Error: "OPENAI_API_KEY no encontrada"
→ Asegúrate de añadir la API key en `.env.local`

### Error: "No se extrajo texto del PDF"
→ El PDF puede estar escaneado (imagen). Necesitarás OCR o un PDF con texto seleccionable

### Error: "No se generaron preguntas"
→ El contenido puede ser muy corto o la API está teniendo problemas. Revisa los logs.

## 🎯 Mejores prácticas

1. **Revisa las preguntas generadas** después de importarlas
2. **Empieza con pocos PDFs** para probar
3. **Ajusta el número de preguntas** según la extensión del contenido
4. **Organiza tus PDFs** con nombres claros y consistentes

## 📝 Personalización

Puedes editar el script para:
- Cambiar el modelo de IA (gpt-4, gpt-4o, etc.)
- Ajustar el prompt para generar preguntas más específicas
- Modificar el formato de salida
- Añadir validaciones adicionales

## 🆘 Soporte

Si tienes problemas, revisa:
1. Los logs del script (son muy detallados)
2. Que tu API key sea válida
3. Que los PDFs tengan texto extraíble
4. Que la conexión a la base de datos funcione
