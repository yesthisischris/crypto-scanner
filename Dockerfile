# ---- Stage 1: build ------------------------------------------------
FROM node:20-alpine AS build
WORKDIR /app

# Copy only the files that affect dependency resolution first
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable && pnpm install --frozen-lockfile

# Copy the rest and compile TS -> JS
COPY tsconfig.json .
COPY src ./src
RUN pnpm run build            # runs `tsc` (add script below)

# ---- Stage 2: runtime  (tiny image) --------------------------------
FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production

# Install only prod deps
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable && pnpm install --prod --frozen-lockfile

# Copy compiled JS + any assets
COPY --from=build /app/dist ./dist
COPY --from=build /app/src/agents/cryptoScanner/schema.ts ./src/agents/cryptoScanner/  # keep schema for runtime checks

# Ensure the container fails fast on unhandled rejections
ENV NODE_OPTIONS=--unhandled-rejections=strict

# Expose default port used by vercel-ai’s `serve` helper
EXPOSE 8787
CMD ["node", "dist/server.js"]
