# ---- Simple runtime ---------------------------------------------------
FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci
COPY dist ./dist
ENTRYPOINT ["node", "dist/mcp-server.js"]
