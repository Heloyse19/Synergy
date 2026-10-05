# Roadmap do produto

Relação entre o documento de checkpoint do PI, o que o MVP entrega e o que falta construir.

## Requisitos funcionais

| Requisito                                                                     | Status | Onde está / observações                                                 |
| ----------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------- |
| Cadastro de usuários com perfis distintos (Startup, Investidor, Profissional) | ✅     | `/cadastro`, `src/actions/auth.ts`, perfis 1:1 no banco                 |
| Investidores anjo sinalizam publicamente em quais eventos estarão presentes   | ✅     | `/eventos/[id]` → "Confirmar presença publicamente"; aparece nos cards  |
| Bloquear comunidade e roadmap burocrático para contas no plano gratuito       | ✅     | `requirePremium`, `PremiumGate`; upgrade **simulado** em `/app/premium` |
| Publicação, edição e exclusão de vagas pelas startups                         | ✅     | `/app/vagas`, `src/actions/jobs.ts` (inclui ativar/desativar)           |

## Escopo definido

| Item do escopo                                    | Status | Observações                                                                                |
| ------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------ |
| Cadastro e segmentação de startups por nicho      | ✅/🔜  | Nicho no cadastro e perfil. **Falta** um diretório público de startups filtrável por nicho |
| Aba de eventos externos e internos                | ✅     | `origin` INTERNAL/EXTERNAL, link externo                                                   |
| Sistema de prioridade de inscrição                | ✅     | `priorityUntil`: janela exclusiva Premium + capacidade                                     |
| Confirmação de presença de investidores anjo      | ✅     | Lista pública no evento                                                                    |
| Mural de vagas fixas e freelancer                 | ✅     | Tipos CLT/PJ/Freelancer/Estágio com filtros                                                |
| Fórum de comunidade (Premium)                     | ✅     | Publicações e respostas; exclusão por autor/admin                                          |
| Roadmap burocrático (Premium)                     | ✅     | 18 passos em 4 fases com progresso por startup                                             |
| Templates de landing page para captação (Premium) | ✅     | 3 templates HTML em `public/templates`                                                     |

Fora do escopo (mantido): matching automático de startups similares; consultoria ao vivo.

## Requisitos não funcionais

| Requisito   | Como o MVP atende                                                                                                                                                                                                                       |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Segurança   | Senhas com bcrypt, sessão em cookie HttpOnly assinado, validação no servidor, checagem de propriedade nas actions, cabeçalhos de segurança, rate limiting, Turnstile, Cloudflare WAF/Bot Fight Mode, origem sem portas abertas (Tunnel) |
| Usabilidade | Layout responsivo (Tailwind), navegação por abas, mensagens de erro por campo, estados vazios explicativos                                                                                                                              |

## Backlog sugerido (priorizado)

### Alta prioridade

| #   | Item                                                                                                               | Área sugerida        |
| --- | ------------------------------------------------------------------------------------------------------------------ | -------------------- |
| 1   | **Pagamento do Premium** (Stripe, Mercado Pago ou Asaas) substituindo a ativação simulada; webhook atualiza `plan` | Back-end             |
| 2   | **Candidatura a vagas**: tabela `JobApplication`, botão "Candidatar-se", lista de candidatos para a startup        | Back-end + Front-end |
| 3   | **Diretório de startups** público com filtro por nicho e estágio (segmentação do escopo)                           | Front-end + Dados    |
| 4   | **Recuperação de senha e confirmação de e-mail** (ex.: Resend) + troca de senha no perfil                          | Back-end             |
| 5   | **Painel administrativo**: gerenciar usuários, eventos, moderar fórum e vagas                                      | Full stack           |

### Média prioridade

| #   | Item                                                                                      | Área sugerida |
| --- | ----------------------------------------------------------------------------------------- | ------------- |
| 6   | Edição de eventos (hoje só criação/exclusão) e inscrição em lista de espera quando lotado | Back-end      |
| 7   | Upload de logo/avatar (Cloudflare R2 ou S3)                                               | Back-end      |
| 8   | Notificações por e-mail: investidor confirmou presença, nova vaga no seu nicho            | Back-end      |
| 9   | Busca e paginação nas listagens (hoje carregam tudo)                                      | Dados         |
| 10  | Testes end-to-end com Playwright nos fluxos principais (cadastro → vaga → evento)         | Qualidade     |
| 11  | Content Security Policy com nonces                                                        | Segurança     |

### Baixa prioridade / ideias

- Categorias e busca no fórum; marcar resposta como solução.
- Métricas no painel admin (cadastros por semana, eventos mais procurados).
- Exportar roadmap como PDF; mais templates de landing page.
- Modo escuro.

## Próximas entregas do checkpoint (mapeamento)

| Entrega prevista                               | Situação                                                             |
| ---------------------------------------------- | -------------------------------------------------------------------- |
| Concluir a modelagem do banco MySQL            | ✅ `prisma/schema.prisma` + `docs/banco-de-dados.dbml`               |
| Criar o repositório oficial no GitHub          | ✅ `Heloyse19/Synergy` com CI/CD, templates de issue/PR e Dependabot |
| Wireframes das telas de eventos e vagas        | ✅ Telas implementadas (podem servir de base para refinar o design)  |
| Configurar o ambiente de desenvolvimento local | ✅ `docker compose up -d` + `npm run dev` (README)                   |
| Validar protótipos com o grupo                 | 🔜 Rodar o MVP com as contas de demonstração e coletar feedback      |
