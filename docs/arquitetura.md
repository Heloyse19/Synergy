# Arquitetura

## Visão geral

O Synergy é um **monólito fullstack em Next.js**: as páginas (React Server Components), as mutações
(Server Actions) e o acesso ao banco (Prisma) vivem no mesmo projeto e no mesmo container. Em produção o
tráfego entra pela Cloudflare e chega ao container por um túnel de saída, sem expor portas no servidor.

```mermaid
flowchart LR
  U[Navegador] -->|HTTPS| CF[Cloudflare\nDNS · TLS · WAF · Bot Fight Mode · Rate limiting]
  CF -->|Cloudflare Tunnel| T[cloudflared]
  subgraph VPS [Servidor com Docker]
    T -->|http://app:3000| APP[Container Next.js\nRSC · Server Actions · proxy.ts]
    APP -->|Prisma + mariadb| DB[(MySQL 8)]
  end
  U -. widget .-> TS[Turnstile]
  APP -. siteverify .-> TS
```

## Camadas do código

| Camada            | Pasta                 | Responsabilidade                                                                                                 |
| ----------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Rotas e páginas   | `src/app`             | Server Components que buscam dados e renderizam a UI. Formulários são Client Components pequenos                 |
| Mutações          | `src/actions`         | Server Actions (`'use server'`). Toda escrita no banco passa por aqui, com autenticação, autorização e validação |
| Consultas         | `src/lib/data`        | Funções de leitura reutilizadas pelas páginas (selects explícitos, nunca `passwordHash`)                         |
| Validação         | `src/lib/validations` | Schemas Zod compartilhados por formulários e actions                                                             |
| Autenticação      | `src/lib/auth`        | Token JWT (`token.ts`), cookie (`session.ts`), senha (`password.ts`) e DAL (`dal.ts`)                            |
| Regras de negócio | `src/lib/plan.ts`     | Premium e prioridade de inscrição — funções puras com testes unitários                                           |
| Licitações        | `src/lib/tenders`     | Termos por nicho, pontuação de aderência, filtros e sincronização com o PNCP (regras puras com testes)           |
| Integrações       | `src/lib/pncp`        | Cliente e validação da API oficial de consultas do PNCP                                                          |
| UI                | `src/components`      | `ui/` (primitivos), `layout/`, e componentes por domínio (`events/`, `jobs/`, ...)                               |
| Banco             | `prisma/`             | `schema.prisma` (fonte da verdade), migrações SQL versionadas e `seed.ts`                                        |

Convenção de nomes: **código em inglês** (tabelas, variáveis, funções) e **textos da interface em português**
(`src/lib/labels.ts` traduz os enums do banco).

## Fluxo de uma requisição

1. `src/proxy.ts` roda antes das rotas `/app/*`, `/login` e `/cadastro`: faz uma verificação **otimista**
   do cookie de sessão e redireciona cedo (sem ir ao banco).
2. O layout raiz chama `getCurrentUser()` para montar o cabeçalho. A função é memoizada por requisição
   (`React.cache`), então as páginas reutilizam o resultado sem consultas extras.
3. Páginas protegidas chamam `requireUser()`, `requireRole()` ou `requirePremium()` (DAL). Essa é a
   verificação **definitiva** — o proxy nunca é a única barreira.
4. Como o layout lê cookies, todas as páginas são renderizadas dinamicamente a cada requisição
   (nada fica em cache estático), o que também evita acesso ao banco durante o `next build`.

## Fluxo de uma Server Action (ex.: publicar vaga)

```mermaid
sequenceDiagram
  participant B as Navegador (JobForm)
  participant A as createJob (src/actions/jobs.ts)
  participant D as DAL / Prisma
  B->>A: POST FormData (useActionState)
  A->>D: getCurrentUser()
  D-->>A: usuário com startup
  A->>A: jobSchema.safeParse(FormData)
  alt inválido
    A-->>B: ActionState { status: 'error', fieldErrors, values }
  else válido
    A->>D: prisma.jobPosting.create(...)
    A->>A: revalidatePath('/vagas') · redirect('/vagas/:id')
    A-->>B: navegação para a vaga criada
  end
```

Todas as actions seguem o mesmo contrato (`ActionState` em `src/lib/action-state.ts`): autenticam, validam
com Zod, checam **propriedade** (a startup só edita as próprias vagas; autor ou admin excluem posts) e
devolvem mensagens amigáveis em português. Erros de validação repopulam o formulário.

## Licitações (integração com o PNCP)

A aba **Licitações** (`/app/licitacoes`, para startups) mostra editais com propostas abertas no
[PNCP](https://pncp.gov.br) que combinam com o nicho da startup. A ideia veio do projeto LicitaAI: uma
startup com contratos públicos tem receita, e receita pesa na decisão do investidor.

```mermaid
flowchart LR
  U[Startup] -->|Buscar / Atualizar| A[requestTenderSync\nsrc/actions/tenders.ts]
  A -->|fila em memória\num estado por vez| S[sync.ts]
  S -->|GET /contratacoes/proposta\npágina a página| P[API oficial do PNCP]
  S -->|upsert + searchText| DB[(Tender · TenderSync)]
  U -->|abre a página| PG["/app/licitacoes"]
  PG -->|searchTenders| DB
  PG -->|termos do nicho| N[niches.ts]
```

**Por que copiar as licitações para o nosso banco?** A API oficial de consultas
([Swagger](https://pncp.gov.br/api/consulta/swagger-ui/index.html)) lista as contratações com propostas
abertas por estado, mas **não tem filtro por palavra-chave** e leva de 5 a 40 segundos por página. A busca
textual do portal (`/api/search`) não é uma API pública: ela derruba a maioria das conexões de clientes
automatizados (medimos ~70% de falha) e não deve ser usada. Por isso sincronizamos os editais abertos de um
estado para a tabela `Tender` e fazemos a busca localmente (medido com os 3,3 mil editais do Paraná:
cerca de 0,25 s por consulta de nicho, contra 5 a 40 s de uma única página do PNCP).

**Sincronização** (`src/lib/tenders/sync.ts`): iniciada por uma Server Action, roda em segundo plano no
próprio servidor (`after()`), uma chamada por vez e um estado por vez. Cada página é validada com Zod
(`src/lib/pncp/normalize.ts`) antes de ser gravada; ao final, o que não apareceu mais (encerrado, revogado,
suspenso) é removido. O progresso fica em `TenderSync` e a página se atualiza sozinha enquanto a busca roda.
O Paraná, por exemplo, tinha 3,3 mil editais abertos em nov/2026: 68 páginas, 13 minutos.

**Aderência ao nicho** (`src/lib/tenders/niches.ts`): editais não falam "fintech" ou "healthtech", então
cada nicho tem expressões **específicas** ("prontuário eletrônico", "gestão de frota") e palavras do
**setor** ("saúde", "transporte") que só contam quando o objeto também descreve uma solução de tecnologia
("software", "aplicativo"...). O objeto de cada edital é gravado normalizado em `Tender.searchText`
(minúsculas, sem acentos, plural reduzido, sem preposições), o que permite casar palavras inteiras com
`LIKE` no banco e
repetir o mesmo teste em memória para pontuar e explicar o resultado ("Termos encontrados").

É uma **triagem por palavras**, não uma análise do edital: a decisão de participar continua sendo humana.
O resumo dos requisitos de habilitação com IA é a próxima etapa (ver `docs/roadmap-do-produto.md`).

## Autenticação e autorização

- **Senhas** com bcrypt (custo 12). No login a comparação acontece mesmo quando o e-mail não existe, para
  não revelar contas pelo tempo de resposta.
- **Sessão** stateless: JWT HS256 assinado com `SESSION_SECRET` (≥ 32 caracteres), guardado em cookie
  `HttpOnly`, `SameSite=Lax`, `Secure` em produção, validade de 7 dias. O payload carrega apenas `sub`
  (id do usuário) e `role`; dados do usuário (plano, perfis) vêm sempre do banco.
- **Autorização** por perfil (`Role`) e por plano (`Plan`). `hasPremium()` libera admins automaticamente.
- **Proteção contra abuso**: limitador em memória para login/cadastro (`src/lib/rate-limit.ts`), Turnstile
  opcional nos formulários e, na borda, rate limiting e Bot Fight Mode da Cloudflare (ver `docs/deploy.md`).
- **Cabeçalhos de segurança** em `next.config.ts` (`nosniff`, `X-Frame-Options`, `Referrer-Policy`,
  `Permissions-Policy`, HSTS). O Next.js ainda aplica verificação de `Origin` (CSRF) nas Server Actions.

## Regras de negócio centrais

| Regra                                                            | Onde                                          | Teste                                 |
| ---------------------------------------------------------------- | --------------------------------------------- | ------------------------------------- |
| Comunidade, roadmap e templates só para Premium                  | `hasPremium`, `requirePremium`, `PremiumGate` | `src/lib/plan.test.ts`                |
| Investidores confirmam presença publicamente, sem limite         | `canRegisterForEvent`                         | `src/lib/plan.test.ts`                |
| Janela de prioridade: só Premium se inscreve até `priorityUntil` | `canRegisterForEvent`                         | `src/lib/plan.test.ts`                |
| Capacidade do evento                                             | `canRegisterForEvent`                         | `src/lib/plan.test.ts`                |
| Datas digitadas são horário de Brasília                          | `parseDateTimeLocal`                          | `src/lib/validations/events.test.ts`  |
| Licitação só aparece para o nicho se casar com os termos dele    | `matchTender`                                 | `src/lib/tenders/niches.test.ts`      |
| Só licitações que aceitam propostas entram no banco              | `parseTender`                                 | `src/lib/pncp/normalize.test.ts`      |
| Um estado não é sincronizado de novo em menos de 3 horas         | `syncAvailability`                            | `src/lib/tenders/sync-policy.test.ts` |

## Decisões técnicas (resumo das ADRs)

1. **Next.js fullstack em vez de Django + React separados** — um único repositório, uma linguagem
   (TypeScript) para front e back, deploy de um container só e menos integração a manter. O time
   continua com React no front, como planejado.
2. **MySQL 8** — mantido conforme o planejamento da equipe (modelagem em DBML/dbdiagram.io).
3. **Prisma 7** — schema declarativo próximo do DBML, migrações SQL versionadas e cliente tipado.
   No Prisma 7 a URL do banco fica em `prisma.config.ts` e o cliente usa um _driver adapter_
   (`@prisma/adapter-mariadb`, compatível com MySQL). O pacote `mariadb` é fixado em versão corrigida
   via `overrides` no `package.json`.
4. **Autenticação própria seguindo o guia oficial do Next.js** — menos dependências e um fluxo
   transparente para aprendizado. Se o produto precisar de login social, recuperação de senha por e-mail
   ou 2FA, migrar para Auth.js ou Better Auth é um passo natural (ver roadmap).
5. **Server Actions em vez de API REST** — menos código de integração; a segurança é tratada em cada
   action. Se surgir um cliente externo (app mobile), expor Route Handlers em `src/app/api`.
6. **Tailwind sem biblioteca de componentes** — primitivos próprios e simples em `src/components/ui`.
   A equipe pode adotar shadcn/ui depois sem reescrever páginas.
7. **Cloudflare Tunnel em vez de portas abertas** — o servidor não expõe 80/443; WAF e proteção contra
   bots não podem ser contornados acessando o IP de origem diretamente.

## Limitações conhecidas

- Upgrade Premium é **simulado** (não há cobrança). Integração com gateway de pagamento está no backlog.
- O limitador de requisições é em memória: funciona para uma instância. Com várias réplicas, usar Redis
  ou confiar apenas no rate limiting da Cloudflare.
- Não há envio de e-mails (confirmação de conta, recuperação de senha).
- A sincronização de licitações é **manual** (botão na página) e a fila vive na memória do servidor: vale
  para uma instância e é interrompida se o container reiniciar (basta pedir de novo). Não há agendamento
  diário ainda.
- A aderência das licitações ao nicho é por palavras-chave: há falsos positivos e editais relevantes que
  usam outro vocabulário ficam de fora. Os termos ficam em `src/lib/tenders/niches.ts`.
- Custos das licitações que crescem com o volume: cada sincronização baixa de novo todos os editais abertos
  do estado (não é incremental) e a consulta por nicho percorre todas as licitações do recorte (dezenas de
  `LIKE` por linha). Serve para alguns estados; para o Brasil inteiro (~30 mil editais) vale sincronizar só
  o que mudou e gravar a aderência no momento da sincronização.
- Sem CSP (Content Security Policy) estrita ainda — exige nonces nos scripts do Next.js.
