# Synergy

[![CI/CD](https://github.com/Heloyse19/Synergy/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/Heloyse19/Synergy/actions/workflows/ci-cd.yml)

Plataforma web que conecta **startups em estágio inicial**, **profissionais** e **investidores anjo**.
Projeto Integrador — TADS 042 Noite · Parceiro: Ecossistema de Startups e Investidores Anjo X.

> Este repositório contém o **MVP** (produto mínimo viável) do sistema, com a base técnica pronta para a
> equipe continuar o desenvolvimento das demais funcionalidades. Veja o que falta em
> [`docs/roadmap-do-produto.md`](docs/roadmap-do-produto.md).

## O problema e a solução

Startups em estágios iniciais têm dificuldade para encontrar apoio técnico, recrutar talentos, se conectar
com investidores anjo e lidar com a burocracia sem direcionamento. O Synergy centraliza isso em um só lugar:
eventos com presença confirmada de investidores, mural de vagas, comunidade de suporte e um roadmap
burocrático guiado (recursos Premium).

## Funcionalidades do MVP

| Área             | O que já funciona                                                                                                                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cadastro e login | Perfis distintos (Startup, Investidor anjo, Profissional) com campos específicos; sessão segura; proteção contra bots                                                                                   |
| Painel           | Abas Comunidade, Eventos, Vagas e Premium; resumo por perfil; edição de perfil                                                                                                                          |
| Eventos          | Listagem pública (próximos/passados), detalhe, investidores anjo **confirmam presença publicamente**, inscrição com **janela de prioridade Premium** e capacidade; criação por administradores          |
| Vagas            | Mural público com filtros (busca, tipo, modelo); startups **publicam, editam, ativam/desativam e excluem** suas vagas                                                                                   |
| Premium          | Bloqueio de recursos para o plano gratuito; ativação simulada (sem pagamento); comunidade (fórum com respostas); roadmap burocrático com progresso por startup; templates de landing page para captação |
| Infra            | Docker (dev e produção), CI/CD no GitHub Actions, deploy com Cloudflare Tunnel + WAF + Bot Fight Mode + Turnstile                                                                                       |

## Stack

- **Next.js 16** (App Router, Server Components e Server Actions) + **React 19** + **TypeScript** — front-end e back-end no mesmo projeto
- **Tailwind CSS 4** — estilos utilitários; componentes próprios em `src/components/ui`
- **Prisma 7** + **MySQL 8** — ORM com migrações versionadas (driver `@prisma/adapter-mariadb`)
- **Zod 4** — validação de formulários no servidor
- **jose** + **bcryptjs** — sessão (JWT em cookie HttpOnly) e hash de senhas
- **Vitest** — testes unitários · **ESLint** + **Prettier** — qualidade de código
- **Docker** + **GitHub Actions** + **Cloudflare** (Tunnel, WAF, Bot Fight Mode, Turnstile)

## Como rodar localmente

Pré-requisitos: [Node.js 22](https://nodejs.org), [Docker](https://docs.docker.com/get-docker/) e Git.

```bash
git clone git@github.com:Heloyse19/Synergy.git
cd Synergy
cp .env.example .env          # ajuste se necessário (os valores padrão funcionam com o Docker local)
docker compose up -d          # sobe o MySQL 8 em localhost:3306
npm install                   # instala dependências e gera o Prisma Client
npm run db:migrate            # aplica as migrações (cria as tabelas)
npm run db:seed               # dados de demonstração (nichos, eventos, vagas, roadmap, usuários)
npm run dev                   # http://localhost:3000
```

Para ver as contas de demonstração na tela de login, adicione `SHOW_DEMO_ACCOUNTS=true` ao `.env`.

### Contas de demonstração (senha `Demo@123`)

| Perfil              | E-mail                    | Plano                                                        |
| ------------------- | ------------------------- | ------------------------------------------------------------ |
| Startup (Nexa Pay)  | `startup@demo.local`      | Premium                                                      |
| Startup (AgroSense) | `startup-free@demo.local` | Gratuito                                                     |
| Investidor anjo     | `investidor@demo.local`   | Gratuito                                                     |
| Investidor anjo     | `investidor2@demo.local`  | Gratuito                                                     |
| Profissional        | `profissional@demo.local` | Gratuito                                                     |
| Administrador       | `admin@synergy.local`     | Premium (senha em `SEED_ADMIN_PASSWORD`, padrão `Admin@123`) |

### Scripts

| Comando                       | O que faz                                                                              |
| ----------------------------- | -------------------------------------------------------------------------------------- |
| `npm run dev`                 | Servidor de desenvolvimento com hot reload                                             |
| `npm run build`               | Build de produção (gera `.next/standalone`)                                            |
| `npm start`                   | Executa o build de produção                                                            |
| `npm run lint`                | ESLint                                                                                 |
| `npm run typecheck`           | Tipos de rotas do Next + `tsc --noEmit`                                                |
| `npm test`                    | Testes unitários (Vitest)                                                              |
| `npm run format`              | Formata o código com Prettier                                                          |
| `npm run db:migrate`          | Cria/aplica migração a partir do `schema.prisma` (dev)                                 |
| `npm run db:deploy`           | Aplica migrações pendentes (produção)                                                  |
| `npm run db:seed`             | Popula o banco com dados de demonstração                                               |
| `npm run db:studio`           | Interface visual do banco (Prisma Studio)                                              |
| `npm run db:reset`            | Apaga e recria o banco local (roda migrações + seed)                                   |
| `node scripts/smoke-test.mjs` | Smoke test dos fluxos principais contra um servidor local (ver `docs/contribuindo.md`) |

## Estrutura do projeto

```
├── prisma/                 # schema.prisma, migrações e seed
├── public/templates/       # templates de landing page (recurso Premium)
├── src/
│   ├── app/                # rotas (App Router): páginas públicas, (auth), app/ (área logada), api/
│   ├── actions/            # Server Actions: todas as mutações (auth, vagas, eventos, fórum, perfil, plano)
│   ├── components/         # ui/ (botões, inputs, cards...), layout/, events/, jobs/, premium/, auth/
│   ├── lib/
│   │   ├── auth/           # sessão (JWT), senha (bcrypt), DAL (verificação de acesso)
│   │   ├── data/           # consultas ao banco usadas pelas páginas
│   │   ├── validations/    # schemas Zod dos formulários
│   │   ├── plan.ts         # regras do Premium e da prioridade em eventos
│   │   └── prisma.ts       # instância do Prisma Client
│   ├── generated/prisma/   # Prisma Client gerado (não versionado)
│   └── proxy.ts            # redirecionamentos de autenticação (antigo middleware)
├── docs/                   # documentação do projeto
├── .github/workflows/      # CI/CD
├── Dockerfile, docker-compose.yml, docker-compose.prod.yml
└── prisma.config.ts, next.config.ts, eslint.config.mjs, vitest.config.mts
```

## Docker

```bash
docker compose up -d                        # só o banco (uso diário em desenvolvimento)
docker compose --profile full up --build    # banco + aplicação com a imagem de produção, em http://localhost:3000
```

A imagem de produção aplica as migrações automaticamente ao iniciar (`docker-entrypoint.sh`).

## Deploy e CI/CD

Cada push na branch `main` roda lint, tipos, testes e build; publica a imagem em
`ghcr.io/heloyse19/synergy` e atualiza o servidor via SSH. O tráfego de produção passa pela **Cloudflare**
(HTTPS, WAF, Bot Fight Mode e Turnstile) e chega ao servidor por um **Cloudflare Tunnel**, sem portas abertas.
Passo a passo completo em [`docs/deploy.md`](docs/deploy.md).

## Documentação

- [Arquitetura e decisões técnicas](docs/arquitetura.md)
- [Banco de dados (modelo, tabelas e DBML)](docs/banco-de-dados.md)
- [Deploy com Docker, Cloudflare e CI/CD](docs/deploy.md)
- [Guia de contribuição (fluxo de trabalho e convenções)](docs/contribuindo.md)
- [Roadmap do produto (requisitos × status × backlog)](docs/roadmap-do-produto.md)

## Equipe

Heloyse Silva, Pedro Henrique Cordeiro, Pedro Juan, Vanessa Trezena, Maíra Lourenço, Sávio e Vinícius Oliveira.
Papéis: Back-end — Pedro Henrique e Heloyse · Front-end — Vinícius e Vanessa · Dados — Pedro Juan.
