# Deploy: Docker + Cloudflare (HTTPS, WAF e proteção contra bots) + CI/CD

## Arquitetura de produção

```
Usuário ──HTTPS──▶ Cloudflare (DNS, TLS, WAF, Bot Fight Mode, rate limiting, Turnstile)
                        │  Cloudflare Tunnel (conexão de SAÍDA criptografada iniciada pelo servidor)
                        ▼
              VPS com Docker Compose
              ├── cloudflared  → encaminha para http://app:3000
              ├── app          → Next.js (imagem ghcr.io/heloyse19/synergy), roda `prisma migrate deploy` ao iniciar
              └── db           → MySQL 8 (volume persistente)
```

Por que assim:

- **Nenhuma porta pública** além do SSH. O WAF e a proteção contra bots não podem ser contornados acessando
  o IP do servidor diretamente, porque nada responde em 80/443.
- **HTTPS automático** com certificado da Cloudflare na borda; o túnel protege o trecho Cloudflare → servidor.
- **Um único artefato** (imagem Docker) promovido do CI para produção; migrações aplicadas automaticamente.

Alternativas (não usadas no MVP): Cloudflare Workers via OpenNext (sem Docker, serverless) e Cloudflare
Containers (beta). O desenho atual funciona em qualquer VPS (Oracle Cloud Always Free, Hetzner, DigitalOcean,
AWS Lightsail...).

## Pré-requisitos

1. Um **domínio com DNS na Cloudflare** (plano Free basta).
2. Um **servidor Linux** (Ubuntu 22.04/24.04, 1 vCPU / 2 GB RAM é suficiente para o MVP) com acesso SSH.
3. O repositório no GitHub com permissão para configurar _secrets_ e _environments_.

## 1. Preparar o servidor

```bash
# no servidor, como usuário com sudo
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER && newgrp docker

# firewall: só SSH (o tráfego web entra pelo túnel)
sudo ufw allow OpenSSH && sudo ufw --force enable

# diretório da aplicação
sudo mkdir -p /opt/synergy && sudo chown $USER:$USER /opt/synergy
cd /opt/synergy
curl -fsSLO https://raw.githubusercontent.com/Heloyse19/Synergy/main/docker-compose.prod.yml
curl -fsSL https://raw.githubusercontent.com/Heloyse19/Synergy/main/.env.production.example -o .env
nano .env   # preencha senhas (use `openssl rand -base64 32`), APP_URL e, depois, os tokens da Cloudflare
```

Crie também um usuário dedicado para o deploy automático (opcional, mas recomendado):

```bash
sudo adduser --disabled-password --gecos "" deploy
sudo usermod -aG docker deploy
sudo chown -R deploy:deploy /opt/synergy
# no SEU computador: gere a chave usada pelo GitHub Actions
ssh-keygen -t ed25519 -C "github-actions-synergy" -f synergy_deploy_key -N ""
# copie o conteúdo de synergy_deploy_key.pub para /home/deploy/.ssh/authorized_keys no servidor
```

## 2. Criar o Cloudflare Tunnel

1. Painel Cloudflare → **Zero Trust** → **Networks** → **Tunnels** → **Create a tunnel** → _Cloudflared_.
2. Nome: `synergy`. Em _Install and run a connector_ escolha **Docker** e copie apenas o **token**
   (a parte depois de `--token`). Cole em `CLOUDFLARE_TUNNEL_TOKEN` no `.env` do servidor.
3. Aba **Public Hostname** → _Add a public hostname_:
   - Subdomain: `synergy` (ou vazio para o domínio raiz) · Domain: seu domínio
   - Service: **HTTP** · URL: `app:3000`
     A Cloudflare cria o registro DNS (CNAME → túnel) com proxy ativado automaticamente.

## 3. Primeiro deploy (manual)

```bash
cd /opt/synergy
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml logs -f app   # aguarde "iniciando Next.js"
```

Acesse `https://synergy.seudominio.com.br`. Se a imagem ainda não existir no GHCR, faça o primeiro push na
`main` (o pipeline a publica) ou construa localmente: `docker build -t ghcr.io/heloyse19/synergy:latest .`
e `docker push` (requer `docker login ghcr.io` com um token com escopo `write:packages`).

Pacotes do GHCR são privados por padrão. Para o servidor fazer `pull`, torne o pacote público
(GitHub → Packages → synergy → Package settings → _Change visibility_) **ou** faça `docker login ghcr.io`
no servidor com um token de leitura (`read:packages`). O pipeline já faz esse login durante o deploy.

### Carregar dados de demonstração (opcional)

A imagem de produção não inclui o seed. Para carregar nichos, roadmap, templates e contas de demo, rode o
seed a partir do código-fonte usando a rede interna do Compose:

```bash
cd /opt/synergy && git clone https://github.com/Heloyse19/Synergy.git src && cd src
docker run --rm -it --network synergy_internal -v "$PWD":/app -w /app \
  -e DATABASE_URL="mysql://synergy:SUA_SENHA@db:3306/synergy" -e SEED_ADMIN_PASSWORD="SenhaDoAdmin" \
  node:22-alpine sh -c "npm ci && npm run db:seed"
```

Os nichos, o roadmap e os templates fazem parte do produto; as contas `*@demo.local` podem ser apagadas
depois pelo Prisma Studio ou SQL se não quiser dados de exemplo em produção.

## 4. Configurar segurança na Cloudflare

Tudo abaixo está disponível no plano **Free**, salvo indicação.

### SSL/TLS

- **SSL/TLS → Overview**: modo _Full (strict)_ (com túnel, a Cloudflare já valida a conexão).
- **Edge Certificates**: ative _Always Use HTTPS_, _Automatic HTTPS Rewrites_, _HSTS_ (max-age 6 meses,
  include subdomains) e _Minimum TLS Version_ = 1.2.

### WAF (Security → WAF)

1. **Managed rules**: ative o _Cloudflare Managed Ruleset_ (no Free é o conjunto gratuito) — bloqueia
   exploits conhecidos, injeções e scanners.
2. **Custom rules** (até 5 no Free) — sugestões:

   | Nome                                  | Expressão                                                                                                   | Ação              |
   | ------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------- |
   | Bloquear caminhos de scanners         | `(http.request.uri.path matches "^/(wp-admin                                                                | wp-login\\.php    | xmlrpc\\.php | \\.env | \\.git | phpmyadmin)")` | Block |
   | Desafiar automações no login/cadastro | `(http.request.uri.path in {"/login" "/cadastro"} and http.request.method eq "POST" and not cf.client.bot)` | Managed Challenge |
   | Bloquear métodos não usados           | `(not http.request.method in {"GET" "POST" "HEAD" "OPTIONS"})`                                              | Block             |

3. **Rate limiting rules** (1 regra no Free): expressão
   `(http.request.uri.path in {"/login" "/cadastro"} and http.request.method eq "POST")`,
   característica _IP_, **10 requisições / 10 segundos**, ação _Block_ por 10 segundos (ou _Managed Challenge_).
   Isso complementa o limitador em memória da aplicação (10 tentativas de login / 15 min por IP + e-mail).

### Proteção contra bots (Security → Bots)

- Ative **Bot Fight Mode** (Free). Ele desafia tráfego automatizado conhecido. No plano Pro, _Super Bot
  Fight Mode_ permite ajustar ações para bots "definitivamente automatizados" e "provavelmente automatizados".
- **Security → Settings**: _Security Level_ = Medium e _Browser Integrity Check_ ativado.
- Em caso de ataque, ative **Under Attack Mode** temporariamente (desafio JavaScript para todos).

### Turnstile (CAPTCHA invisível nos formulários)

1. Painel Cloudflare → **Turnstile** → _Add widget_: nome `synergy`, domínio do site, modo **Managed**.
2. Copie _Site Key_ e _Secret Key_ para `TURNSTILE_SITE_KEY` e `TURNSTILE_SECRET_KEY` no `.env` do servidor e
   reinicie: `docker compose -f docker-compose.prod.yml up -d`.
3. O widget aparece em `/login` e `/cadastro`; o servidor valida o token em `siteverify` antes de processar.
   Sem as chaves, a aplicação simplesmente não exige o desafio (útil em desenvolvimento).

### Cache

A aplicação envia `Cache-Control: private, no-store` nas páginas dinâmicas; a Cloudflare armazena em cache
apenas os assets estáticos (`/_next/static`, imagens, templates). Não é necessário criar _Cache Rules_.

## 5. Configurar o CI/CD no GitHub

O workflow `.github/workflows/ci-cd.yml` tem três etapas:

| Job       | Quando                        | O que faz                                                                   |
| --------- | ----------------------------- | --------------------------------------------------------------------------- |
| `quality` | todo push e PR                | `npm ci`, lint, typecheck, testes, build; em PRs também valida o Dockerfile |
| `docker`  | push na `main`                | publica `ghcr.io/heloyse19/synergy:latest` e `:sha-<commit>`                |
| `deploy`  | push na `main`, após `docker` | SSH no servidor → `docker compose pull && up -d` → verifica `/api/health`   |

Configure em **Settings → Environments → New environment** `production` (opcionalmente com
_Required reviewers_ para aprovar deploys manualmente) e adicione:

| Tipo     | Nome             | Valor                                          |
| -------- | ---------------- | ---------------------------------------------- |
| Secret   | `DEPLOY_HOST`    | IP ou hostname do servidor                     |
| Secret   | `DEPLOY_USER`    | `deploy`                                       |
| Secret   | `DEPLOY_SSH_KEY` | conteúdo da chave privada `synergy_deploy_key` |
| Secret   | `DEPLOY_PORT`    | porta SSH (opcional, padrão 22)                |
| Variable | `APP_URL`        | `https://synergy.seudominio.com.br`            |

Sem esses secrets o job de deploy é **ignorado com um aviso** (o CI e a publicação da imagem continuam
funcionando), então o pipeline pode ser adotado em etapas.

### Fluxo do dia a dia

1. Abra um PR → o CI roda lint, tipos, testes, build e Dockerfile.
2. Faça o merge na `main` → a imagem é publicada e o servidor atualizado em ~5 minutos.
3. Acompanhe em **Actions**; a aba _Deployments_ mostra o histórico do ambiente `production`.

### Rollback

```bash
cd /opt/synergy
APP_IMAGE=ghcr.io/heloyse19/synergy:sha-abc1234 docker compose -f docker-compose.prod.yml up -d app
```

Migrações são aditivas por padrão; se uma migração precisar ser revertida, crie uma nova migração que desfaça
a mudança (nunca edite migrações já aplicadas).

## 6. Operação

```bash
docker compose -f docker-compose.prod.yml ps                 # estado dos containers
docker compose -f docker-compose.prod.yml logs -f app        # logs da aplicação
docker compose -f docker-compose.prod.yml logs -f cloudflared
curl -s https://synergy.seudominio.com.br/api/health          # {"status":"ok","db":"up",...}
```

**Backup do banco** (agende com cron, ex.: diariamente às 3h):

```bash
docker compose -f docker-compose.prod.yml exec -T db \
  mysqldump -usynergy -p"$MYSQL_PASSWORD" synergy | gzip > /opt/synergy/backups/synergy-$(date +%F).sql.gz
```

**Atualizar o MySQL/cloudflared**: `docker compose -f docker-compose.prod.yml pull && up -d`
(o Dependabot abre PRs quando há novas versões das imagens usadas no `Dockerfile`).

**Métricas e segurança**: Cloudflare → _Analytics & Logs_ (tráfego, cache) e _Security → Events_
(requisições bloqueadas/desafiadas pelo WAF, rate limiting e Bot Fight Mode).

## Checklist de produção

- [ ] `SESSION_SECRET`, `MYSQL_PASSWORD` e `MYSQL_ROOT_PASSWORD` fortes e únicos
- [ ] `SHOW_DEMO_ACCOUNTS=false` e contas `*@demo.local` removidas (ou senhas trocadas)
- [ ] Senha do admin (`admin@synergy.local`) alterada
- [ ] Tunnel ativo, DNS com proxy (nuvem laranja), _Always Use HTTPS_ e HSTS ligados
- [ ] Managed ruleset, regras customizadas, rate limiting e Bot Fight Mode ativos
- [ ] Turnstile configurado
- [ ] Backups agendados e testados (restaure em um ambiente local pelo menos uma vez)
- [ ] Branch `main` protegida e environment `production` com revisores
