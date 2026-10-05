# Guia de contribuição

## Fluxo de trabalho

1. **Issue primeiro**: toda funcionalidade ou bug tem uma issue (use os templates). Linke o requisito do PI.
2. **Branch a partir da `main`**: `feat/<descricao-curta>`, `fix/<descricao>`, `docs/<descricao>`.
   Ex.: `feat/candidatura-vagas`.
3. **Commits pequenos** no padrão [Conventional Commits](https://www.conventionalcommits.org/pt-br/):
   `feat: permitir candidatura em vagas`, `fix: corrigir filtro de vagas por modelo`, `docs: ...`, `chore: ...`.
4. **Pull Request** para a `main` usando o template. O CI precisa passar (lint, tipos, testes, build) e pelo
   menos **uma pessoa revisa** antes do merge.
5. **Merge na `main` = deploy automático** em produção (ver `docs/deploy.md`). Teste bem antes!

Recomendado nas configurações do repositório: proteger a branch `main` (exigir PR, status checks e 1 aprovação).

## Antes de abrir o PR

```bash
npm run lint && npm run typecheck && npm test
npm run format
```

## Convenções de código

- **TypeScript estrito**. Evite `any`; prefira tipos inferidos do Prisma e do Zod.
- **Identificadores em inglês, textos em português.** Rótulos de enums em `src/lib/labels.ts`.
- **Server Components por padrão.** Use `'use client'` apenas em componentes que precisam de estado,
  eventos ou hooks (formulários, menus).
- **Toda mutação é uma Server Action em `src/actions`** e segue o contrato `ActionState`:
  autenticar (`getCurrentUser`) → autorizar (perfil/plano/propriedade) → validar (Zod) → gravar →
  `revalidatePath` → `redirect` ou retornar estado.
- **Toda leitura reutilizável fica em `src/lib/data`** com `select` explícito (nunca retorne `passwordHash`).
- **Validação sempre no servidor** com Zod (`src/lib/validations`). A validação HTML é só conveniência.
- **Componentes de UI** em `src/components/ui` são primitivos genéricos; componentes de domínio ficam em
  pastas por área (`events/`, `jobs/`...).
- **Formatação** com Prettier (`npm run format`) e lint com ESLint. Não discuta estilo em review.

## Como adicionar uma funcionalidade (passo a passo)

Exemplo: _candidatura a vagas_.

1. **Modelo**: adicione `JobApplication` em `prisma/schema.prisma` e rode
   `npm run db:migrate -- --name job_applications`. Atualize `docs/banco-de-dados.md` e o `.dbml`.
2. **Validação**: crie o schema Zod em `src/lib/validations/applications.ts`.
3. **Action**: `src/actions/applications.ts` com `applyToJob(prev, formData)`.
4. **Consulta**: `src/lib/data/applications.ts` (`listApplicationsByJob`, ...).
5. **UI**: formulário client (`useActionState`) + página/sections em `src/app/...`.
6. **Testes**: regras puras em `src/lib/*.test.ts`; schemas em `src/lib/validations/*.test.ts`.
7. **Docs**: atualize `docs/roadmap-do-produto.md` (marque o item) e o README se houver nova tela.

## Testes

- Unitários com Vitest: `npm test` (ou `npm run test:watch`). Arquivos `*.test.ts` ao lado do código.
- Smoke test dos fluxos principais (login, cadastro, vaga, evento, bloqueio Premium) contra um servidor
  local com o seed carregado — cria dados de teste, **não rode contra produção**:

  ```bash
  npm run build && cp -r public .next/standalone/ && cp -r .next/static .next/standalone/.next/
  set -a && . ./.env && set +a && PORT=3100 SHOW_DEMO_ACCOUNTS=true node .next/standalone/server.js &
  BASE_URL=http://localhost:3100 node scripts/smoke-test.mjs
  ```

- Testes end-to-end (Playwright) ainda não estão configurados — está no backlog.

## Dúvidas frequentes

- **Alterei o schema e os tipos não atualizaram** → `npm run db:generate`.
- **Erro `SESSION_SECRET ausente ou curto`** → gere um valor com `openssl rand -base64 32` no `.env`.
- **Erro de conexão com o banco** → `docker compose up -d` e confira a `DATABASE_URL`.
- **Quero resetar tudo** → `npm run db:reset` (apaga o banco local).
