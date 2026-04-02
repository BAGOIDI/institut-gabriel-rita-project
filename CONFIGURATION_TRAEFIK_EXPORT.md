# Configuration Traefik pour l'Export PDF et les APIs

## Problème Résolu

Avec Traefik comme reverse proxy, les ports ne doivent **PAS** apparaître dans les URLs car :
- Tout le trafic passe par les ports standards 80 (HTTP) et 443 (HTTPS)
- Traefik route les requêtes vers les bons microservices via les labels
- Les chemins d'API utilisent des préfixes (`/api/core`, `/api/finance`, etc.)

## Solution Appliquée

### 1. Modification du Fichier `.env`

**AVANT (Incorrect avec Traefik) :**
```env
VITE_API_BASE_URL=http://localhost:80
```

**APRÈS (Correct avec Traefik) :**
```env
VITE_API_BASE_URL=/
```

### 2. Comment ça Marche

#### Architecture de Routage Traefik

```
Requête Frontend → Traefik (Port 80/443) → Microservice
```

**Exemples de Routage :**

| Chemin API | Route Traefik | Microservice | Port Interne |
|------------|---------------|--------------|--------------|
| `/api/core/*` | `Host(\`localhost\`) && PathPrefix(\`/api/core\`)` | service-core-scolarite | 3000 |
| `/api/finance/*` | `Host(\`localhost\`) && PathPrefix(\`/api/finance\`)` | service-finance | 3000 |
| `/api/planning/*` | `Host(\`localhost\`) && PathPrefix(\`/api/planning\`)` | service-planning | 3000 |
| `/api/bulletins/*` | `Host(\`localhost\`) && PathPrefix(\`/api/bulletins\`)` | service-bulletins | 3000 |
| `/api/dashboard/*` | `Host(\`localhost\`) && PathPrefix(\`/api/dashboard\`)` | service-dashboard | 3000 |
| `/api/reports/*` | `Host(\`localhost\`) && PathPrefix(\`/api/reports\`)` | service-reports | 5000 |

#### Flux d'une Requête d'Export PDF

1. **Frontend** : `GET /api/reports/pdf?type=bulletin&studentId=123`
2. **Traefik** : Intercepte la requête sur le port 80
3. **Routing** : Identifie le préfixe `/api/reports` → service-reports
4. **Strip Prefix** : Retire `/api/reports` du chemin
5. **Forwarding** : Transmet à `http://service-reports:5000/pdf?type=bulletin&studentId=123`
6. **Réponse** : Le PDF généré retourne au frontend via Traefik

### 3. Configuration Docker Compose

Les labels Traefik dans `docker-compose.yml` :

```yaml
service-reports:
  labels:
    - "traefik.enable=true"
    - "traefik.http.routers.reports.rule=Host(\`localhost\`) && PathPrefix(\`/api/reports\`)"
    - "traefik.http.services.reports.loadbalancer.server.port=5000"
```

**Explication :**
- `traefik.enable=true` : Active Traefik pour ce service
- `Host(\`localhost\`)` : Écoute les requêtes sur localhost
- `PathPrefix(\`/api/reports\`)` : Capture toutes les URLs commençant par `/api/reports`
- `loadbalancer.server.port=5000` : Transmet au port interne du conteneur

### 4. Pourquoi l'Export PDF ne Fonctionnait Plus

**Problème :**
- Avec `VITE_API_BASE_URL=http://localhost:80`, le frontend générait des URLs comme `http://localhost:80/api/reports/pdf`
- Mais le navigateur essayait d'accéder directement au service sans passer par Traefik
- Conflit de ports et échec des requêtes CORS

**Solution :**
- Avec `VITE_API_BASE_URL=/`, le frontend génère `/api/reports/pdf`
- Le navigateur fait une requête relative automatiquement routée par Traefik
- Plus de conflit de ports, tout passe par le port 80

### 5. Vérification et Tests

#### Tester la Configuration

1. **Redémarrer les conteneurs :**
   ```powershell
   docker-compose down
   docker-compose up -d
   ```

2. **Vérifier que Traefik route correctement :**
   ```powershell
   # Logs Traefik
   docker logs infra-traefik
   
   # Logs service-reports
   docker logs service-reports
   ```

3. **Tester une génération PDF :**
   - Ouvrir le dashboard
   - Générer un bulletin ou rapport
   - Vérifier que l'URL dans le navigateur est `http://localhost/api/reports/...` (sans port)

#### Points de Vigilance

✅ **À FAIRE :**
- Utiliser `VITE_API_BASE_URL=/` dans `.env`
- S'assurer que tous les appels API utilisent des chemins relatifs
- Vérifier que les labels Traefik sont corrects dans docker-compose.yml

❌ **À NE PAS FAIRE :**
- Mettre des ports explicites dans les URLs (`http://localhost:3000`)
- Modifier les ports exposés dans docker-compose.yml (sauf nécessité absolue)
- Oublier de rebuild le frontend après changement de `.env`

### 6. Reconstruction du Frontend

Après modification de `.env`, **toujours** reconstruire :

```powershell
# Arrêter le frontend
docker stop school-frontend

# Rebuild avec les nouvelles variables
docker-compose build school-frontend

# Redémarrer
docker-compose up -d school-frontend
```

### 7. Dépannage

#### L'export PDF ne fonctionne toujours pas ?

1. **Vérifier le fichier .env :**
   ```powershell
   Get-Content frontend\.env
   # Doit afficher : VITE_API_BASE_URL=/
   ```

2. **Vérifier les logs du service :**
   ```powershell
   docker logs service-reports --tail 50
   ```

3. **Tester en direct :**
   ```powershell
   # Depuis un autre conteneur
   docker exec service-reports curl http://localhost:5000/health
   ```

4. **Vérifier Traefik :**
   ```powershell
   # Dashboard Traefik (si activé)
   http://localhost:8080/api/http/routers
   ```

## Résumé

| Élément | Configuration |
|---------|--------------|
| **Fichier .env** | `VITE_API_BASE_URL=/` |
| **Port d'entrée** | 80 (HTTP) ou 443 (HTTPS) |
| **Routage** | Basé sur les préfixes `/api/*` |
| **Services** | Ports internes non exposés |
| **Avantage** | URLs propres, plus de conflits de ports |

Cette configuration assure que tous les services communiquent proprement via Traefik, permettant à l'export PDF et autres fonctionnalités de fonctionner correctement ! 🚀
