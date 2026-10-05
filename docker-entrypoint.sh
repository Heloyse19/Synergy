#!/bin/sh
# Aplica as migrações pendentes e inicia o servidor.
# O seed de demonstração não roda aqui: veja docs/deploy.md ("Carregar dados de demonstração").
set -eu

echo "[entrypoint] aplicando migrações do Prisma..."
attempt=1
max_attempts=10
until (cd /app/tools && node node_modules/prisma/build/index.js migrate deploy); do
  if [ "$attempt" -ge "$max_attempts" ]; then
    echo "[entrypoint] banco indisponível após $max_attempts tentativas. Abortando." >&2
    exit 1
  fi
  echo "[entrypoint] banco ainda não respondeu (tentativa $attempt/$max_attempts). Aguardando 5s..."
  attempt=$((attempt + 1))
  sleep 5
done


echo "[entrypoint] iniciando Next.js..."
exec "$@"
