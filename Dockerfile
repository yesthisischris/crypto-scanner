# ---- Build stage -----------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY tsconfig.json src ./
RUN pnpm run build

# ---- Runtime stage ---------------------------------------------------
FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --prod --frozen-lockfile
COPY --from=builder /app/dist ./dist
ENTRYPOINT ["node", "dist/mcp-server.js"]
