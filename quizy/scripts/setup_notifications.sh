#!/bin/bash

echo "🔔 Aplicando migración de notificaciones..."

# Aplicar migración SQL
psql $DATABASE_URL -f sql/migrations/007_notifications.sql

if [ $? -eq 0 ]; then
  echo "✅ Migración aplicada correctamente"
  echo ""
  echo "📊 Verificando estructura..."
  
  psql $DATABASE_URL -c "\d notifications"
  psql $DATABASE_URL -c "\d users" | grep notification
  
  echo ""
  echo "✅ Sistema de notificaciones instalado"
  echo ""
  echo "Para crear notificaciones de prueba, ejecuta:"
  echo "  node scripts/create_test_notifications.js"
else
  echo "❌ Error aplicando migración"
  exit 1
fi
