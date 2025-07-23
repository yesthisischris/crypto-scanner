# ---- Build stage -----------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src/
RUN npm run build

# ---- Runtime stage ---------------------------------------------------
FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
ENTRYPOINT ["node", "dist/mcp-server.js"]
