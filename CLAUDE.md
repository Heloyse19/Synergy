@AGENTS.md

# Synergy — guia para assistentes de código

Plataforma Next.js 16 (App Router) + Prisma 7 + MySQL que conecta startups, profissionais e investidores anjo.
Leia `README.md` e `docs/arquitetura.md` antes de alterar a estrutura.

## Comandos

- `npm run dev` · `npm run build` · `npm run lint` · `npm run typecheck` · `npm test`
- Banco: `docker compose up -d`, `npm run db:migrate -- --name <nome>`, `npm run db:seed`, `npm run db:generate`

## Convenções

- Código em inglês; textos da interface em português (rótulos de enums em `src/lib/labels.ts`).
- Mutações apenas em `src/actions/*` (Server Actions) seguindo `ActionState`: autenticar → autorizar → validar com Zod → gravar → `revalidatePath`.
- Leituras em `src/lib/data/*` com `select` explícito; nunca retornar `passwordHash`.
- Autorização definitiva na DAL (`src/lib/auth/dal.ts`); `src/proxy.ts` é apenas verificação otimista.
- Regras do Premium/prioridade de eventos em `src/lib/plan.ts` (puras, com testes).
- Após mudar `prisma/schema.prisma`: criar migração, atualizar `docs/banco-de-dados.md` e `docs/banco-de-dados.dbml`.
- Rodar `npm run format` antes de finalizar.
