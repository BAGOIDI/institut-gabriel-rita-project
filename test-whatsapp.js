#!/usr/bin/env node

/**
 * Script de test - Envoi WhatsApp d'Emploi du Temps
 * Institut Gabriel Rita
 */

const http = require('http');

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
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

async function testPostEndpoint(name, url, data) {
  return new Promise((resolve) => {
    const start = Date.now();
    
    const postData = JSON.stringify(data);
    const options = {
      hostname: new URL(url).hostname,
      port: new URL(url).port || 80,
      path: new URL(url).pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = http.request(options, (res) => {
      const duration = Date.now() - start;
      const status = res.statusCode;
      
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (status === 200 || status === 201) {
          log(`✓ ${name}`, 'green');
          log(`  ${url} (${duration}ms) - Status: ${status}`, 'blue');
          resolve(true);
        } else {
          log(`✗ ${name}`, 'red');
          log(`  ${url} - Status: ${status}`, 'red');
          if (body) log(`  Response: ${body}`, 'yellow');
          resolve(false);
        }
      });
    });

    req.on('error', (err) => {
      log(`✗ ${name}`, 'red');
      log(`  ${url} - Error: ${err.message}`, 'red');
      resolve(false);
    });

    req.write(postData);
    req.end();
  });
}

async function main() {
  log('\n📱 Test des Services WhatsApp - Emploi du Temps\n', 'cyan');
  log('=' .repeat(70), 'cyan');
  
  const results = [];
  
  // Test 1: WAHA Service
  log('\n🔍 1. Service WAHA (WhatsApp)', 'yellow');
  results.push(await testEndpoint(
    'WAHA Status',
    'http://localhost:3001/api/status',
    200
  ));
  
  // Test 2: Reports API - Health
  log('\n📄 2. Service Reports (Flask)', 'yellow');
  results.push(await testEndpoint(
    'Reports Health',
    'http://localhost:8000/api/reports/health',
    200
  ));
  
  // Test 3: WhatsApp Status
  log('\n💬 3. API WhatsApp', 'yellow');
  results.push(await testEndpoint(
    'WhatsApp Status',
    'http://localhost:8000/api/reports/whatsapp/status',
    200
  ));
  
  // Test 4: WhatsApp QR
  results.push(await testEndpoint(
    'WhatsApp QR Code',
    'http://localhost:8000/api/reports/whatsapp/qr',
    200
  ));
  
  // Test 5: Planning Service
  log('\n📋 4. Service Planning (NestJS)', 'yellow');
  results.push(await testEndpoint(
    'Planning Schedules',
    'http://localhost:3002/schedules',
    200
  ));
  
  // Test 6: Frontend
  log('\n🎨 5. Frontend (Vite)', 'yellow');
  results.push(await testEndpoint(
    'Frontend Page',
    'http://localhost:5173/',
    200
  ));
  
  // Test 7: Simulation d'envoi (échouera sans numéro valide)
  log('\n📨 6. Test d\'Envoi WhatsApp (Simulation)', 'yellow');
  results.push(await testPostEndpoint(
    'Send Schedule (Test)',
    'http://localhost:8000/api/reports/whatsapp/send-schedule/TestClass',
    {
      phone: '237600000000',
      period: 'all',
      teacher_name: 'Test'
    }
  ));
  
  // Résumé
  log('\n' + '='.repeat(70), 'cyan');
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  if (passed === total) {
    log(`\n✅ TOUS LES TESTS SONT PASSÉS (${passed}/${total})`, 'green');
    log('\n🎉 La fonctionnalité WhatsApp est opérationnelle à 100%!\n', 'green');
    log('📱 Pour utiliser:', 'cyan');
    log('  1. Ouvrez http://localhost:5173', 'blue');
    log('  2. Allez dans "Emploi du Temps"', 'blue');
    log('  3. Sélectionnez une classe ou un enseignant', 'blue');
    log('  4. Cliquez sur "Envoyer par WhatsApp"', 'blue');
    log('  5. Scannez le QR code si nécessaire', 'blue');
    log('  6. Entrez le numéro et envoyez!\n', 'blue');
  } else {
    log(`\n⚠️  CERTAINS TESTS ONT ÉCHOUÉ (${passed}/${total})`, 'yellow');
    log('\nServices à démarrer:\n', 'yellow');
    log('  1. WAHA: docker-compose up -d school-waha', 'blue');
    log('  2. Reports: docker-compose up -d service-reports', 'blue');
    log('  3. Planning: docker-compose up -d service-planning', 'blue');
    log('  4. Frontend: cd frontend && npm run dev\n', 'blue');
  }
  
  log('=' .repeat(70) + '\n', 'cyan');
}

main().catch(console.error);
