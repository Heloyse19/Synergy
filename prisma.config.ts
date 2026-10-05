// Configuração do Prisma CLI (Prisma 7+).
// A URL do banco NÃO fica mais no schema.prisma: ela vem daqui, via variável de ambiente.
// O CLI não carrega .env automaticamente, por isso importamos o dotenv.
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

const databaseUrl = process.env.DATABASE_URL;

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    // Popula o banco com dados iniciais (nichos, roadmap, usuários demo). Rode: npm run db:seed
    seed: 'tsx prisma/seed.ts',
  },
  // `prisma generate` não precisa de banco (ex.: no `npm install` do CI/Docker).
  // Já `migrate`, `db seed` e `studio` exigem DATABASE_URL e falham com erro claro se faltar.
  datasource: databaseUrl ? { url: databaseUrl } : undefined,
});
