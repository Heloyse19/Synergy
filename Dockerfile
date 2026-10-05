# syntax=docker/dockerfile:1.7
# Imagem de produção do Synergy (Next.js standalone + Prisma migrate deploy no start).
# Build:  docker build -t synergy .
# Run:    docker run -p 3000:3000 --env-file .env synergy

ARG NODE_VERSION=22

# ---------- deps: instala dependências, gera o Prisma Client e prepara o CLI de migrações ----------
FROM node:${NODE_VERSION}-alpine AS deps
ARG PRISMA_VERSION=7.10.0
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
# `npm ci` roda o postinstall (prisma generate), por isso o schema é copiado antes.
RUN npm ci --no-audit --no-fund
# Prisma CLI isolado (o bundle standalone do Next não inclui o CLI). É copiado para a imagem final
# e usado pelo docker-entrypoint.sh para rodar `prisma migrate deploy`.
RUN mkdir -p /tools && cd /tools \
    && npm init -y >/dev/null \
    && npm install --no-audit --no-fund --omit=dev prisma@${PRISMA_VERSION} dotenv@^18 \
    && npm cache clean --force

# ---------- builder: compila a aplicação ----------
FROM node:${NODE_VERSION}-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---------- runner: imagem final enxuta ----------
FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    TZ=America/Sao_Paulo

RUN apk add --no-cache libc6-compat curl tzdata \
    && addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# CLI do Prisma + schema + migrações (para o entrypoint)
COPY --from=deps --chown=nextjs:nodejs /tools /app/tools
COPY --chown=nextjs:nodejs prisma.config.ts /app/tools/prisma.config.ts
COPY --chown=nextjs:nodejs prisma /app/tools/prisma

# Saída standalone do Next.js + arquivos estáticos
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --chown=nextjs:nodejs docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -fsS http://127.0.0.1:3000/api/health || exit 1

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "server.js"]
