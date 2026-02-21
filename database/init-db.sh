#!/bin/bash
set -e
echo "🚀 Initialisation des bases de données..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE keycloak_db;
    CREATE DATABASE lms_db;
    CREATE DATABASE snipeit_db;
    CREATE DATABASE scolarite_db;
    CREATE DATABASE planning_db;
    
    GRANT ALL PRIVILEGES ON DATABASE keycloak_db TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE lms_db TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE snipeit_db TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE scolarite_db TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE planning_db TO $POSTGRES_USER;
EOSQL
echo "✅ Bases de données créées."
