# --- Base ---
FROM node:18-alpine AS base

# --- Dependencies ---
FROM base AS deps
WORKDIR /usr/src/app
COPY package*.json ./
# Installation des dépendances, y compris celles pour RabbitMQ
RUN npm install

# --- Development ---
FROM base AS development
WORKDIR /usr/src/app
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .
# Commande de démarrage par défaut
CMD ["npm", "run", "start:dev"]

# --- Build (Production) ---
FROM base AS build
WORKDIR /usr/src/app
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .
RUN npm run build

# --- Production ---
FROM base AS production
WORKDIR /usr/src/app
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY package*.json ./
CMD ["node", "dist/main"]
