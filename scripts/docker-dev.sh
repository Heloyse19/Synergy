#!/bin/sh
# Inicialização do serviço `dev` (docker-compose.yml).
# Instala as dependências no volume do container (só quando o package-lock.json muda) e sobe o
# Next.js em modo desenvolvimento, observando o código espelhado do host por bind mount.
set -eu

stamp=node_modules/.package-lock.sha256
current=$(sha256sum package-lock.json | cut -d' ' -f1)

if [ "$(cat "$stamp" 2>/dev/null || true)" != "$current" ]; then
  echo "[dev] package-lock.json novo ou alterado: instalando dependências (npm ci)..."
  npm ci --no-audit --no-fund
  echo "$current" > "$stamp"
fi

echo "[dev] iniciando Next.js (hot reload)..."
exec npx next dev --hostname 0.0.0.0
