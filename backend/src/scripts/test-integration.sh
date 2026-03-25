#!/bin/bash

# Script de test complet pour Typesense + RabbitMQ
# Ce script vérifie que tous les services communiquent correctement

set -e

echo "🧪 Starting complete integration test..."
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Compteur de tests
TESTS_PASSED=0
TESTS_FAILED=0

# Fonction pour tester un endpoint
test_endpoint() {
  local name=$1
  local url=$2
  local method=${3:-GET}
  
  echo -n "Testing $name... "
  
  if [ "$method" == "POST" ]; then
    response=$(curl -s -w "\n%{http_code}" -X POST "$url" 2>/dev/null)
  else
    response=$(curl -s -w "\n%{http_code}" "$url" 2>/dev/null)
  fi
  
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | head -n-1)
  
  if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
    echo -e "${GREEN}✅ PASSED${NC} (HTTP $http_code)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
    return 0
  else
    echo -e "${RED}❌ FAILED${NC} (HTTP $http_code)"
    echo "Response: $body"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    return 1
  fi
}

echo "====================================="
echo "1️⃣  Testing Infrastructure Services"
echo "====================================="
echo ""

# Test 1: Typesense Health
test_endpoint "Typesense Health" "http://typesense:8108/health"

# Test 2: RabbitMQ Management API
test_endpoint "RabbitMQ Management" "http://admin:admin@rabbitmq:15672/api/healthchecks/node"

# Test 3: Backend API
test_endpoint "Backend API" "http://backend:3000/api"

echo ""
echo "====================================="
echo "2️⃣  Testing Database Endpoints"
echo "====================================="
echo ""

# Test 4: Database Check
test_endpoint "Database Check" "http://backend:3000/api/database/check"

# Test 5: Database Stats
test_endpoint "Database Stats" "http://backend:3000/api/database/stats"

echo ""
echo "====================================="
echo "3️⃣  Testing Typesense Integration"
echo "====================================="
echo ""

# Test 6: Typesense Health via Backend
test_endpoint "Typesense Health (Backend)" "http://backend:3000/api/search/health"

# Test 7: Initialize Collections (reset if needed)
echo -n "Testing Initialize Collections... "
response=$(curl -s -X POST "http://backend:3000/api/search/reset-collections" 2>/dev/null)
if echo "$response" | grep -q '"success":true'; then
  echo -e "${GREEN}✅ PASSED${NC}"
  TESTS_PASSED=$((TESTS_PASSED + 1))
else
  echo -e "${RED}❌ FAILED${NC}"
  echo "Response: $response"
  TESTS_FAILED=$((TESTS_FAILED + 1))
fi

echo ""
echo "====================================="
echo "4️⃣  Testing RabbitMQ Integration"
echo "====================================="
echo ""

# Test 8: RabbitMQ Health via Backend
test_endpoint "RabbitMQ Health (Backend)" "http://backend:3000/api/rabbitmq/health"

# Test 9: Send Test Student Event
echo -n "Testing Send Student Event... "
response=$(curl -s -X POST "http://backend:3000/api/rabbitmq/test/student-created" 2>/dev/null)
if echo "$response" | grep -q '"success":true'; then
  echo -e "${GREEN}✅ PASSED${NC}"
  TESTS_PASSED=$((TESTS_PASSED + 1))
else
  echo -e "${RED}❌ FAILED${NC}"
  echo "Response: $response"
  TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# Wait a bit for event processing
sleep 2

# Test 10: Send Test Teacher Event
echo -n "Testing Send Teacher Event... "
response=$(curl -s -X POST "http://backend:3000/api/rabbitmq/test/teacher-created" 2>/dev/null)
if echo "$response" | grep -q '"success":true'; then
  echo -e "${GREEN}✅ PASSED${NC}"
  TESTS_PASSED=$((TESTS_PASSED + 1))
else
  echo -e "${RED}❌ FAILED${NC}"
  echo "Response: $response"
  TESTS_FAILED=$((TESTS_FAILED + 1))
fi

echo ""
echo "====================================="
echo "5️⃣  Testing Bulk Indexation"
echo "====================================="
echo ""

# Test 11: Index All Students
echo -n "Testing Index All Students... "
response=$(curl -s -X POST "http://backend:3000/api/search/index/students" 2>/dev/null)
if echo "$response" | grep -q '"success":true'; then
  indexed=$(echo "$response" | grep -o '"indexed":[0-9]*' | cut -d':' -f2)
  echo -e "${GREEN}✅ PASSED${NC} (Indexed: $indexed students)"
  TESTS_PASSED=$((TESTS_PASSED + 1))
else
  echo -e "${RED}❌ FAILED${NC}"
  echo "Response: $response"
  TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# Test 12: Index All Teachers
echo -n "Testing Index All Teachers... "
response=$(curl -s -X POST "http://backend:3000/api/search/index/teachers" 2>/dev/null)
if echo "$response" | grep -q '"success":true'; then
  indexed=$(echo "$response" | grep -o '"indexed":[0-9]*' | cut -d':' -f2)
  echo -e "${GREEN}✅ PASSED${NC} (Indexed: $indexed teachers)"
  TESTS_PASSED=$((TESTS_PASSED + 1))
else
  echo -e "${RED}❌ FAILED${NC}"
  echo "Response: $response"
  TESTS_FAILED=$((TESTS_FAILED + 1))
fi

echo ""
echo "====================================="
echo "6️⃣  Verifying Typesense Data"
echo "====================================="
echo ""

# Test 13: Check Students Collection
echo -n "Checking Students Collection... "
students_response=$(curl -s "http://typesense:8108/collections/students" 2>/dev/null)
if echo "$students_response" | grep -q '"num_documents"'; then
  num_students=$(echo "$students_response" | grep -o '"num_documents":[0-9]*' | cut -d':' -f2)
  echo -e "${GREEN}✅ PASSED${NC} ($num_students documents)"
  TESTS_PASSED=$((TESTS_PASSED + 1))
else
  echo -e "${RED}❌ FAILED${NC}"
  echo "Response: $students_response"
  TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# Test 14: Check Teachers Collection
echo -n "Checking Teachers Collection... "
teachers_response=$(curl -s "http://typesense:8108/collections/teachers" 2>/dev/null)
if echo "$teachers_response" | grep -q '"num_documents"'; then
  num_teachers=$(echo "$teachers_response" | grep -o '"num_documents":[0-9]*' | cut -d':' -f2)
  echo -e "${GREEN}✅ PASSED${NC} ($num_teachers documents)"
  TESTS_PASSED=$((TESTS_PASSED + 1))
else
  echo -e "${RED}❌ FAILED${NC}"
  echo "Response: $teachers_response"
  TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# Test 15: Search in Students Collection
echo -n "Testing Student Search... "
search_response=$(curl -s "http://typesense:8108/collections/students/documents/search?q=*&per_page=1" 2>/dev/null)
if echo "$search_response" | grep -q '"hits"'; then
  echo -e "${GREEN}✅ PASSED${NC}"
  TESTS_PASSED=$((TESTS_PASSED + 1))
else
  echo -e "${RED}❌ FAILED${NC}"
  echo "Response: $search_response"
  TESTS_FAILED=$((TESTS_FAILED + 1))
fi

echo ""
echo "====================================="
echo "📊 Test Summary"
echo "====================================="
echo ""
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 All tests passed! Typesense and RabbitMQ are properly configured.${NC}"
  echo ""
  echo "📚 Next steps:"
  echo "   - Access Typesense UI: http://localhost:8108"
  echo "   - Access RabbitMQ UI: http://localhost:15672 (admin/admin)"
  echo "   - Search API: http://localhost:3000/api/search/health"
  exit 0
else
  echo -e "${RED}❌ Some tests failed. Please check the logs above.${NC}"
  exit 1
fi
