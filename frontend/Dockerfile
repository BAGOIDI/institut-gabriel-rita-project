# Utiliser une image de base Node.js
FROM node:24-alpine

# Définir le répertoire de travail
WORKDIR /app

# Variables de build pour Vite (passées via docker-compose)
ARG VITE_API_BASE_URL=""
ARG VITE_DISABLE_AUTH="true"
ARG VITE_DEFAULT_USERNAME=""
ARG VITE_DEFAULT_PASSWORD=""
ARG VITE_DEFAULT_ROLES=""
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_DISABLE_AUTH=${VITE_DISABLE_AUTH}
ENV VITE_DEFAULT_USERNAME=${VITE_DEFAULT_USERNAME}
ENV VITE_DEFAULT_PASSWORD=${VITE_DEFAULT_PASSWORD}
ENV VITE_DEFAULT_ROLES=${VITE_DEFAULT_ROLES}

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
