# 🔄 Solution Alternative - Utiliser Typesense Directement

## Problème Actuel

Le container `service-core-scolarite` ne démarre pas après le build. Nous allons utiliser une approche alternative.

---

## ✅ Solution 1: Script Node.js pour Indexer Directement

Créez un fichier `index-to-typesense.js` :

```javascript
// index-to-typesense.js
const Typesense = require('typesense');

const client = new Typesense.Client({
  nodes: [{
    host: 'localhost',
    port: 8108,
    protocol: 'http'
  }],
  apiKey: 'xyz',
  connectionTimeoutSeconds: 5
});

// Données fictives pour tester (remplacez par vos données réelles)
const students = [
  { id: '1', first_name: 'Jean', last_name: 'Dupont', email: 'jean@example.com', status: 'ACTIVE' },
  { id: '2', first_name: 'Marie', last_name: 'Curie', email: 'marie@example.com', status: 'ACTIVE' },
  { id: '3', first_name: 'Pierre', last_name: 'Martin', email: 'pierre@example.com', status: 'INACTIVE' }
];

const teachers = [
  { id: '1', firstName: 'Albert', lastName: 'Einstein', email: 'albert@example.com', specialty: 'Physique', contractType: 'TEACHING', status: 'ACTIVE' },
  { id: '2', firstName: 'Isaac', lastName: 'Newton', email: 'isaac@example.com', specialty: 'Mathématiques', contractType: 'TEACHING', status: 'ACTIVE' }
];

async function initializeCollections() {
  try {
    // Collection Students
    try {
      await client.collections('students').retrieve();
      console.log('✅ Collection "students" already exists');
    } catch (e) {
      if (e?.name === 'ObjectNotFound') {
        await client.collections().create({
          name: 'students',
          fields: [
            { name: 'id', type: 'string' },
            { name: 'first_name', type: 'string' },
            { name: 'last_name', type: 'string' },
            { name: 'email', type: 'string' },
            { name: 'status', type: 'string', facet: true },
            { name: 'full_name', type: 'string' },
          ],
          default_sorting_field: 'full_name',
        });
        console.log('✅ Collection "students" created');
      }
    }

    // Collection Teachers
    try {
      await client.collections('teachers').retrieve();
      console.log('✅ Collection "teachers" already exists');
    } catch (e) {
      if (e?.name === 'ObjectNotFound') {
        await client.collections().create({
          name: 'teachers',
          fields: [
            { name: 'id', type: 'string' },
            { name: 'firstName', type: 'string' },
            { name: 'lastName', type: 'string' },
            { name: 'email', type: 'string' },
            { name: 'specialty', type: 'string', facet: true },
            { name: 'contractType', type: 'string', facet: true },
            { name: 'status', type: 'string', facet: true },
            { name: 'fullName', type: 'string' },
          ],
          default_sorting_field: 'fullName',
        });
        console.log('✅ Collection "teachers" created');
      }
    }
  } catch (error) {
    console.error('❌ Error initializing collections:', error);
  }
}

async function bulkIndexStudents() {
  try {
    const documents = students.map(s => ({
      ...s,
      full_name: `${s.first_name} ${s.last_name}`.trim()
    }));
    
    await client.collections('students').documents().import(documents, { action: 'upsert' });
    console.log(`✅ Indexed ${students.length} students`);
  } catch (error) {
    console.error('❌ Error indexing students:', error);
  }
}

async function bulkIndexTeachers() {
  try {
    const documents = teachers.map(t => ({
      ...t,
      fullName: `${t.firstName} ${t.lastName}`.trim()
    }));
    
    await client.collections('teachers').documents().import(documents, { action: 'upsert' });
    console.log(`✅ Indexed ${teachers.length} teachers`);
  } catch (error) {
    console.error('❌ Error indexing teachers:', error);
  }
}

async function main() {
  console.log('🚀 Starting Typesense initialization...');
  
  await initializeCollections();
  await bulkIndexStudents();
  await bulkIndexTeachers();
  
  // Vérification
  const studentsCollection = await client.collections('students').retrieve();
  const teachersCollection = await client.collections('teachers').retrieve();
  
  console.log('\n📊 Results:');
  console.log(`   Students: ${studentsCollection.num_documents}`);
  console.log(`   Teachers: ${teachersCollection.num_documents}`);
  console.log('\n✅ Done! You can search at http://localhost:8108');
}

main().catch(console.error);
```

### Exécution

```powershell
# Installer typesense
npm install typesense

# Exécuter le script
node index-to-typesense.js
```

---

## ✅ Solution 2: Commandes curl Directes vers Typesense

### 1. Créer les collections

```powershell
# Collection Students
curl.exe -X POST http://localhost:8108/collections ^
  -H "Content-Type: application/json" ^
  -d '{
    "name": "students",
    "fields": [
      {"name": "id", "type": "string"},
      {"name": "first_name", "type": "string"},
      {"name": "last_name", "type": "string"},
      {"name": "email", "type": "string"},
      {"name": "status", "type": "string", "facet": true},
      {"name": "full_name", "type": "string"}
    ],
    "default_sorting_field": "full_name"
  }'

# Collection Teachers
curl.exe -X POST http://localhost:8108/collections ^
  -H "Content-Type: application/json" ^
  -d '{
    "name": "teachers",
    "fields": [
      {"name": "id", "type": "string"},
      {"name": "firstName", "type": "string"},
      {"name": "lastName", "type": "string"},
      {"name": "email", "type": "string"},
      {"name": "specialty", "type": "string", "facet": true},
      {"name": "contractType", "type": "string", "facet": true},
      {"name": "status", "type": "string", "facet": true},
      {"name": "fullName", "type": "string"}
    ],
    "default_sorting_field": "fullName"
  }'
```

### 2. indexer des étudiants

```powershell
curl.exe -X POST http://localhost:8108/collections/students/documents/import?action=upsert ^
  -H "Content-Type: application/json" ^
  -d '[
    {"id": "1", "first_name": "Jean", "last_name": "Dupont", "email": "jean@example.com", "status": "ACTIVE", "full_name": "Jean Dupont"},
    {"id": "2", "first_name": "Marie", "last_name": "Curie", "email": "marie@example.com", "status": "ACTIVE", "full_name": "Marie Curie"},
    {"id": "3", "first_name": "Pierre", "last_name": "Martin", "email": "pierre@example.com", "status": "INACTIVE", "full_name": "Pierre Martin"}
  ]'
```

### 3. Indexer des enseignants

```powershell
curl.exe -X POST http://localhost:8108/collections/teachers/documents/import?action=upsert ^
  -H "Content-Type: application/json" ^
  -d '[
    {"id": "1", "firstName": "Albert", "lastName": "Einstein", "email": "albert@example.com", "specialty": "Physique", "contractType": "TEACHING", "status": "ACTIVE", "fullName": "Albert Einstein"},
    {"id": "2", "firstName": "Isaac", "lastName": "Newton", "email": "isaac@example.com", "specialty": "Mathematiques", "contractType": "TEACHING", "status": "ACTIVE", "fullName": "Isaac Newton"}
  ]'
```

### 4. Vérifier

```powershell
# Voir les collections
curl.exe http://localhost:8108/collections

# Voir le nombre de documents
curl.exe http://localhost:8108/collections/students | ConvertFrom-Json | Select-Object -ExpandProperty num_documents
curl.exe http://localhost:8108/collections/teachers | ConvertFrom-Json | Select-Object -ExpandProperty num_documents
```

---

## 🔍 Tester la Recherche

```powershell
# Rechercher un étudiant
curl.exe -s "http://localhost:8108/collections/students/documents/search?q=dupont&query_by=first_name,last_name"

# Rechercher un enseignant par matière
curl.exe -s "http://localhost:8108/collections/teachers/documents/search?q=physique&query_by=specialty"

# Recherche floue
curl.exe -s "http://localhost:8108/collections/students/documents/search?q=jean&query_by=first_name&num_typos=1"
```

---

## 🛠️ Diagnostic du Container

Pour comprendre pourquoi le container ne démarre pas :

```powershell
# Voir les logs d'erreur
docker-compose logs service-core-scolarite

# Vérifier si le container existe
docker ps -a | findstr service-core-scolarite

# Tenter de démarrer manuellement
docker-compose start service-core-scolarite

# Si ça échoue, voir les détails
docker inspect service-core-scolarite
```

---

## 📝 Prochaines Étapes

1. **Utiliser la solution curl** ci-dessus pour indexer immédiatement
2. **Diagnostiquer le container** avec les commandes de diagnostic
3. **Une fois le container réparé**, les endpoints API seront disponibles

---

## ✅ Ce Qui Fonctionne Déjà

- ✅ Typesense tourne (http://localhost:8108)
- ✅ RabbitMQ tourne (http://localhost:15672)
- ✅ PostgreSQL tourne
- ✅ Les scripts et la documentation sont prêts
- ✅ Vous pouvez indexer manuellement avec curl

---

*En attendant la résolution du problème de container, utilisez les solutions directes ci-dessus.*
