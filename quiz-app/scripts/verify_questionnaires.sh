#!/bin/bash

# Script de verificación del sistema de cuestionarios
# Uso: ./scripts/verify_questionnaires.sh

echo "=== Verificación del Sistema de Cuestionarios ==="
echo ""

# Verificar que DATABASE_URL esté configurado
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  DATABASE_URL no está configurado"
    echo "   Por favor, configura la variable de entorno o crea un archivo .env"
    exit 1
fi

echo "✓ DATABASE_URL configurado"

# Verificar conexión a BD
echo ""
echo "Verificando conexión a la base de datos..."
if psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✓ Conexión exitosa"
else
    echo "✗ No se pudo conectar a la base de datos"
    exit 1
fi

# Verificar tabla question_banks
echo ""
echo "Verificando tabla question_banks..."
if psql "$DATABASE_URL" -c "\d question_banks" > /dev/null 2>&1; then
    echo "✓ Tabla question_banks existe"
else
    echo "✗ Tabla question_banks no existe"
    echo "   Ejecuta: npm run db:migrate"
    exit 1
fi

# Verificar tabla support_tickets
echo ""
echo "Verificando tabla support_tickets..."
if psql "$DATABASE_URL" -c "\d support_tickets" > /dev/null 2>&1; then
    echo "✓ Tabla support_tickets existe"
else
    echo "✗ Tabla support_tickets no existe"
    echo "   Ejecuta: npm run db:migrate"
fi

# Contar asignaturas
echo ""
echo "Verificando asignaturas..."
SUBJECT_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM subjects;" 2>/dev/null | xargs)
echo "   Total de asignaturas: $SUBJECT_COUNT"

if [ "$SUBJECT_COUNT" -eq 0 ]; then
    echo "   ⚠️  No hay asignaturas creadas"
    echo "   Puedes crearlas desde /admin/subjects"
fi

# Contar cuestionarios
echo ""
echo "Verificando cuestionarios..."
QUIZ_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM question_banks;" 2>/dev/null | xargs)
echo "   Total de cuestionarios: $QUIZ_COUNT"

# Verificar usuarios admin
echo ""
echo "Verificando usuarios administradores..."
ADMIN_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM users WHERE is_admin = true;" 2>/dev/null | xargs)
echo "   Total de administradores: $ADMIN_COUNT"

if [ "$ADMIN_COUNT" -eq 0 ]; then
    echo "   ⚠️  No hay usuarios administradores"
    echo "   Necesitas al menos un usuario con permisos de admin"
else
    echo ""
    echo "   Administradores:"
    psql "$DATABASE_URL" -c "SELECT name, email FROM users WHERE is_admin = true;" 2>/dev/null
fi

# Resumen
echo ""
echo "=== Resumen ==="
echo "✓ Base de datos conectada"
echo "✓ Tablas necesarias existen"
echo "  $SUBJECT_COUNT asignaturas"
echo "  $QUIZ_COUNT cuestionarios"
echo "  $ADMIN_COUNT administradores"
echo ""
echo "Sistema listo para usar ✨"
