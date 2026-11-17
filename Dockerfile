# Stage 1: Build Frontend
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install --no-audit --no-fund; fi
COPY . .
RUN npm run build

# Stage 2: Production Server
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev --no-audit --no-fund; fi

COPY server ./server
COPY public ./public
COPY --from=builder /app/dist ./dist

# Create persistent directories
RUN mkdir -p /app/data /app/storage/audio /app/storage/covers

EXPOSE 3000
CMD ["node", "server/index.js"]
