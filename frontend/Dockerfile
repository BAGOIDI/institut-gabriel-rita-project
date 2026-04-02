# Stage 1: Build stage
FROM node:24-alpine AS build

# Définir le répertoire de travail
WORKDIR /app

# Variables de build pour Vite
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
# Utiliser npm ci pour une installation propre et reproductible
RUN npm ci --legacy-peer-deps

# Copier le reste des fichiers sources
COPY . .

# Construire l'application
RUN npm run build

# Stage 2: Production stage
FROM nginx:alpine

# Copier les fichiers construits vers le répertoire de service Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Ajouter une configuration Nginx personnalisée pour gérer le routage SPA (Single Page Application)
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
