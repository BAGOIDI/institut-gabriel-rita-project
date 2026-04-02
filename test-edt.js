#!/usr/bin/env node

/**
 * Script de test rapide pour vérifier l'API Emploi du Temps
 * Institut Gabriel Rita
 */

const http = require('http');

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

async function testEndpoint(name, url, expectedStatus = 200) {
  return new Promise((resolve) => {
    const start = Date.now();
    
    http.get(url, (res) => {
      const duration = Date.now() - start;
      const status = res.statusCode;
      
      if (status === expectedStatus) {
        log(`✓ ${name}`, 'green');
        log(`  ${url} (${duration}ms) - Status: ${status}`, 'blue');
        resolve(true);
      } else {
        log(`✗ ${name}`, 'red');
        log(`  ${url} - Expected: ${expectedStatus}, Got: ${status}`, 'red');
        resolve(false);
      }
    }).on('error', (err) => {
      log(`✗ ${name}`, 'red');
      log(`  ${url} - Error: ${err.message}`, 'red');
      resolve(false);
    });
  });
}

async function main() {
  log('\n🔍 Test des services - Emploi du Temps\n', 'blue');
  log('=' .repeat(60), 'blue');
  
  const results = [];
  
  // Test 1: Service Planning (NestJS)
  log('\n📋 Service Planning (NestJS)', 'yellow');
  results.push(await testEndpoint(
    'GET /schedules',
    'http://localhost:3002/schedules',
    200
  ));
  
  results.push(await testEndpoint(
    'GET /schedules?classId=1',
    'http://localhost:3002/schedules?classId=1',
    200
  ));
  
  results.push(await testEndpoint(
    'GET /schedules/staff/1',
    'http://localhost:3002/schedules/staff/1',
    200
  ));
  
  // Test 2: Service Reports (Flask)
  log('\n📄 Service Reports (Flask)', 'yellow');
  results.push(await testEndpoint(
    'GET /api/reports/health',
    'http://localhost:8000/api/reports/health',
    200
  ));
  
  results.push(await testEndpoint(
    'GET /api/reports/available',
    'http://localhost:8000/api/reports/available',
    200
  ));
  
  // Test 3: Frontend (Vite)
  log('\n🎨 Frontend (Vite)', 'yellow');
  results.push(await testEndpoint(
    'GET / (Frontend)',
    'http://localhost:5173/',
    200
  ));
  
  // Résumé
  log('\n' + '='.repeat(60), 'blue');
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  if (passed === total) {
    log(`\n✅ TOUS LES TESTS SONT PASSÉS (${passed}/${total})`, 'green');
    log('\nLa page Emploi du Temps est opérationnelle à 100%!\n', 'green');
  } else {
    log(`\n⚠️  CERTAINS TESTS ONT ÉCHOUÉ (${passed}/${total})`, 'yellow');
    log('\nVérifiez que tous les services sont démarrés:\n', 'yellow');
    log('  1. service-planning: npm run start:dev', 'blue');
    log('  2. service-reports: flask run --port 8000', 'blue');
    log('  3. frontend: npm run dev\n', 'blue');
  }
}

main().catch(console.error);
