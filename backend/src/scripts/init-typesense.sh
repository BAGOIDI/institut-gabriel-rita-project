#!/bin/bash

# Script d'initialisation de Typesense avec les données de la base de données
# Ce script charge toutes les données dans Typesense via RabbitMQ

set -e

echo "🚀 Starting Typesense initialization script..."

# Attendre que Typesense soit prêt
echo "⏳ Waiting for Typesense to be ready..."
until curl -s http://typesense:8108/health > /dev/null 2>&1; do
  echo "   Typesense is unavailable - sleeping..."
  sleep 2
done
echo "✅ Typesense is ready!"

# Attendre que RabbitMQ soit prêt
echo "⏳ Waiting for RabbitMQ to be ready..."
until curl -s http://admin:admin@rabbitmq:15672/api/healthchecks/node > /dev/null 2>&1; do
  echo "   RabbitMQ is unavailable - sleeping..."
  sleep 2
done
echo "✅ RabbitMQ is ready!"

# Attendre que le backend soit prêt
echo "⏳ Waiting for Backend API to be ready..."
until curl -s http://backend:3000/api/search/health > /dev/null 2>&1; do
  echo "   Backend API is unavailable - sleeping..."
  sleep 2
done
echo "✅ Backend API is ready!"

# Vérifier la santé de Typesense
echo ""
echo "🏥 Checking Typesense health..."
curl -s http://typesense:8108/health | jq . || echo "⚠️ Could not parse health response"

# Optionnel: Réinitialiser les collections (décommenter si nécessaire)
# echo ""
# echo "🔄 Resetting Typesense collections..."
# curl -X POST http://backend:3000/api/search/reset-collections | jq .

# Lancer l'indexation complète
echo ""
echo "📊 Starting full database indexation in Typesense..."
RESPONSE=$(curl -s -X POST http://backend:3000/api/search/index/all)

echo "$RESPONSE" | jq .

# Vérifier si l'indexation a réussi
SUCCESS=$(echo "$RESPONSE" | jq -r '.success')
if [ "$SUCCESS" == "true" ]; then
  echo ""
  echo "✅ Typesense initialization completed successfully!"
  
  # Afficher les statistiques
  STUDENTS_INDEXED=$(echo "$RESPONSE" | jq -r '.results.students.indexed')
  TEACHERS_INDEXED=$(echo "$RESPONSE" | jq -r '.results.teachers.indexed')
  
  echo ""
  echo "📈 Indexation Statistics:"
  echo "   - Students indexed: $STUDENTS_INDEXED"
  echo "   - Teachers indexed: $TEACHERS_INDEXED"
  echo ""
  echo "🎯 You can now search in Typesense at: http://localhost:8108"
  echo "🔍 API Search Endpoint: http://localhost:3000/api/search/health"
else
  echo ""
  echo "❌ Typesense initialization failed!"
  echo "Check the logs above for details."
  exit 1
fi
