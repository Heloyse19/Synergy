import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@/generated/prisma/client';

// Prisma 7 usa um "driver adapter" (aqui o conector mariadb, compatível com MySQL)
// em vez do motor em Rust. O cliente é um singleton para não abrir um pool a cada hot reload.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL não definida. Copie .env.example para .env e ajuste.');
  }

  const adapter = new PrismaMariaDb(url);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
}

function getClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

/**
 * Instância preguiçosa: o cliente só é criado na primeira consulta.
 * Assim o `next build` (que apenas importa os módulos) não exige DATABASE_URL —
 * importante no Docker e no CI, onde não há .env em tempo de build.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getClient();
    const value = Reflect.get(client, prop) as unknown;
    return typeof value === 'function'
      ? (value as (...args: unknown[]) => unknown).bind(client)
      : value;
  },
});
