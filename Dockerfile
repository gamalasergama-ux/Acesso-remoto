FROM node:24-bookworm-slim
ENV NODE_ENV=production GAMA_HOME=/app/var
WORKDIR /app
COPY package.json package-lock.json ./
COPY scripts/patch-engine.js scripts/patch-engine.js
RUN npm ci --omit=dev && npm cache clean --force
COPY --chown=node:node . .
RUN mkdir -p /app/var && chown node:node /app/var
USER node
EXPOSE 8443 8080
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 CMD node scripts/doctor.js
CMD ["node", "server.js"]
