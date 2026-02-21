# Utiliser une image de base Node.js
FROM node:24-alpine

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci --legacy-peer-deps

# Copier le reste des fichiers sources
COPY . .

# Construire l'application
RUN npm run build

# Installer serve pour servir l'application
RUN npm install serve --global

EXPOSE 80

# Servir l'application
CMD ["serve", "-s", "dist", "-l", "80"]