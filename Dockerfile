# ---- Simple runtime ---------------------------------------------------
FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN rm -rf node_modules package-lock.json && npm install
COPY dist ./dist
ENTRYPOINT ["node", "dist/mcp-server.js"]
