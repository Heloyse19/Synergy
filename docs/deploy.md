# Deploy: Docker + Cloudflare (HTTPS, WAF e proteção contra bots) + CI/CD

## Arquitetura de produção

```
Usuário ──HTTPS──▶ Cloudflare (DNS, TLS, WAF, Bot Fight Mode, rate limiting, Turnstile)
                        │  Cloudflare Tunnel (conexão de SAÍDA criptografada iniciada pelo servidor)
                        ▼
              VPS com Docker Compose
              ├── cloudflared  → encaminha para http://app:3000
              ├── app          → Next.js (imagem ghcr.io/synergy-pi/synergy), roda `prisma migrate deploy` ao iniciar
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
curl -fsSLO https://raw.githubusercontent.com/Synergy-PI/Synergy/main/docker-compose.prod.yml
curl -fsSL https://raw.githubusercontent.com/Synergy-PI/Synergy/main/.env.production.example -o .env
nano .env   # preencha senhas e segredos (os comandos estão no arquivo), APP_URL e, depois, os tokens da Cloudflare
chmod 600 .env
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
3. No túnel, adicione uma rota do tipo **Published application** (no painel antigo: aba _Public Hostname_):
   - Subdomain: `synergy` (ou vazio para o domínio raiz) · Domain: seu domínio
   - Service URL: `http://app:3000` — HTTP, não HTTPS: o TLS termina na Cloudflare e, com `https`, o túnel
     não consegue falar com a aplicação (erro 502).
     A Cloudflare cria o registro DNS (CNAME → túnel) com proxy ativado automaticamente.

## 3. Primeiro deploy (manual)

```bash
cd /opt/synergy
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml logs -f app   # aguarde "iniciando Next.js"
```

Acesse `https://synergy.seudominio.com.br`. Se a imagem ainda não existir no GHCR, faça o primeiro push na
`main` (o pipeline a publica) ou construa localmente: `docker build -t ghcr.io/synergy-pi/synergy:latest .`
e `docker push` (requer `docker login ghcr.io` com um token com escopo `write:packages`).

Pacotes do GHCR são privados por padrão. Para o servidor fazer `pull`, torne o pacote público
(GitHub → Packages → synergy → Package settings → _Change visibility_) **ou** faça `docker login ghcr.io`
no servidor com um token de leitura (`read:packages`). O pipeline já faz esse login durante o deploy.
Em organizações, a opção _Public_ só fica disponível se estiver liberada em Settings da organização →
Packages → _Package creation_.

### Carregar dados de demonstração (opcional)

A imagem de produção não inclui o seed. Para carregar nichos, roadmap, templates e contas de demo, rode o
seed a partir do código-fonte usando a rede interna do Compose:

```bash
cd /opt/synergy && git clone https://github.com/Synergy-PI/Synergy.git src && cd src
docker run --rm -it --network synergy_internal -v "$PWD":/app -w /app \
  -e DATABASE_URL="mysql://synergy:SUA_SENHA@db:3306/synergy" -e SEED_ADMIN_PASSWORD="SenhaDoAdmin" \
  node:22-alpine sh -c "npm ci && npm run db:seed"
```

Os nichos, o roadmap e os templates fazem parte do produto; as contas `*@demo.local` podem ser apagadas
depois pelo Prisma Studio ou SQL se não quiser dados de exemplo em produção.

## 4. Configurar segurança na Cloudflare

Tudo abaixo está disponível no plano **Free**, salvo indicação.

### SSL/TLS

- **SSL/TLS → Overview**: mantenha o modo padrão (com túnel, o trecho Cloudflare → servidor já é protegido).
- **Edge Certificates**: ative _Always Use HTTPS_ e _Automatic HTTPS Rewrites_ e defina _Minimum TLS Version_
  = 1.2. Não é preciso ativar o HSTS no painel: a aplicação já envia o cabeçalho (`next.config.ts`) só para
  o próprio host, sem afetar outros subdomínios do domínio.

### WAF (Security → Security rules)

1. **Managed rules**: confira em Security → Settings que o conjunto gratuito da Cloudflare está ativo — ele
   bloqueia exploits conhecidos, injeções e scanners.
2. **Custom rules** (até 5 no Free). Restrinja cada regra ao host da aplicação, para não afetar outros
   subdomínios, e use _Edit expression_ para colar a expressão.

   **Bloquear caminhos de scanners** — ação _Block_:

   ```
   (http.host eq "synergy.seudominio.com.br") and (http.request.uri.path contains "/wp-admin" or http.request.uri.path contains "/wp-login.php" or http.request.uri.path contains "/xmlrpc.php" or http.request.uri.path contains "/.env" or http.request.uri.path contains "/.git" or http.request.uri.path contains "/phpmyadmin")
   ```

   **Bloquear métodos não usados** — ação _Block_:

   ```
   (http.host eq "synergy.seudominio.com.br") and (not http.request.method in {"GET" "POST" "HEAD" "OPTIONS"})
   ```

   O operador `matches` (regex) só existe nos planos Business e Enterprise; no Free use `contains`.

3. **Não use _Managed Challenge_ nos envios de `/login` e `/cadastro`.** Os formulários enviam os dados por
   Server Actions (requisições `fetch`), em que o desafio não pode ser exibido: o envio falharia para todos.
   Quem protege os formulários é o Turnstile (abaixo) e o limitador da aplicação.
4. **Rate limiting rule** (opcional, 1 regra no Free). Se criar, use o tipo _Rate limiting rule_ — uma
   _Custom rule_ com ação _Block_ e a mesma expressão bloqueia todo acesso às telas. Expressão
   `(http.request.uri.path eq "/login" or http.request.uri.path eq "/cadastro")`, característica _IP_,
   20 requisições / 10 segundos. É só um reforço do limitador em memória da aplicação (10 tentativas de
   login / 15 min por IP + e-mail e 5 cadastros / hora por IP).

Para testar: `https://synergy.seudominio.com.br/wp-admin` deve mostrar a página de bloqueio da Cloudflare, e
o login deve continuar funcionando. Se algo legítimo for bloqueado, Security → Analytics → Events mostra a
regra responsável (procure pelo _Ray ID_ do rodapé da página de bloqueio).

### Proteção contra bots (Security → Settings)

- Ative **Bot Fight Mode** (Free). Ele desafia tráfego automatizado conhecido, o que inclui verificações
  feitas de fora por `curl` ou monitores: `/api/health` passa a responder com um desafio (HTTP 403) para
  eles. Verifique a saúde pelo navegador ou a partir do próprio servidor. No plano Pro, _Super Bot Fight
  Mode_ permite ajustar ações para bots "definitivamente automatizados" e "provavelmente automatizados".
- Em caso de ataque, ative **Under Attack Mode** temporariamente (página _Overview_ do domínio → _Quick
  Actions_). Ele exibe um desafio para todos os visitantes; desligue quando o ataque passar. Se optar por
  mantê-lo ligado, aumente o _Challenge Passage_ (Security → Settings), que define por quanto tempo quem já
  passou pelo desafio fica liberado (o padrão é 30 minutos).

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
| `docker`  | push na `main`                | publica `ghcr.io/synergy-pi/synergy:latest` e `:sha-<commit>`               |
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

Com o Bot Fight Mode ativo, a verificação de `/api/health` feita pelo job `deploy` parte de fora e pode
receber um desafio da Cloudflare, falhando mesmo com a aplicação saudável. Nesse caso, deixe a variável
`APP_URL` vazia para pular essa etapa.

### Alternativa sem secrets: a VPS busca a imagem nova

Em repositório público, a opção mais simples é não dar ao GitHub nenhum acesso ao servidor: o pipeline só
publica a imagem e um _timer_ do systemd na VPS verifica a cada 5 minutos se há versão nova. Não usa runner,
SSH nem secrets (o job `deploy` continua sendo ignorado) e exige apenas que o servidor consiga fazer `pull`
da imagem.

```bash
sudo tee /etc/systemd/system/synergy-update.service >/dev/null <<'EOF'
[Unit]
Description=Atualiza o Synergy para a imagem mais recente
After=docker.service network-online.target
Wants=network-online.target

[Service]
Type=oneshot
WorkingDirectory=/opt/synergy
ExecStart=/usr/bin/docker compose -f docker-compose.prod.yml pull --quiet app
ExecStart=/usr/bin/docker compose -f docker-compose.prod.yml up -d --remove-orphans
ExecStart=/usr/bin/docker image prune -f
EOF

sudo tee /etc/systemd/system/synergy-update.timer >/dev/null <<'EOF'
[Unit]
Description=Verifica atualizacao do Synergy a cada 5 minutos

[Timer]
OnBootSec=2min
OnUnitActiveSec=5min
RandomizedDelaySec=30

[Install]
WantedBy=timers.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now synergy-update.timer
```

O `up -d` só recria o container quando a imagem mudou. Para atualizar na hora, sem esperar o timer:
`sudo systemctl start synergy-update.service`; o histórico fica em `journalctl -u synergy-update.service`.
O timer atualiza apenas a imagem: se o `docker-compose.prod.yml` mudar no repositório, baixe-o de novo no
servidor.

### Fluxo do dia a dia

1. Abra um PR → o CI roda lint, tipos, testes, build e Dockerfile.
2. Faça o merge na `main` → a imagem é publicada e o servidor atualizado em ~5 minutos.
3. Acompanhe em **Actions**; a aba _Deployments_ mostra o histórico do ambiente `production`.

### Rollback

```bash
cd /opt/synergy
APP_IMAGE=ghcr.io/synergy-pi/synergy:sha-abc1234 docker compose -f docker-compose.prod.yml up -d app
```

Com o timer de atualização ativo, fixe a versão no `.env` do servidor (`APP_IMAGE=...:sha-abc1234`) em vez de
passá-la só no comando; caso contrário a próxima verificação volta para `latest`.

Migrações são aditivas por padrão; se uma migração precisar ser revertida, crie uma nova migração que desfaça
a mudança (nunca edite migrações já aplicadas).

## 6. Operação

```bash
docker compose -f docker-compose.prod.yml ps                 # estado dos containers
docker compose -f docker-compose.prod.yml logs -f app        # logs da aplicação
docker compose -f docker-compose.prod.yml logs -f cloudflared
# saúde, de dentro do servidor (de fora, o Bot Fight Mode desafia o curl): {"status":"ok","db":"up",...}
docker compose -f docker-compose.prod.yml exec app curl -s http://127.0.0.1:3000/api/health
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

**Licitações (PNCP)**: a aba Licitações consulta `https://pncp.gov.br/api/consulta` a partir do container
`app` (conexão de saída, sem configuração extra). Defina `PNCP_USER_AGENT` no `.env` do servidor para
identificar o sistema nas chamadas, ex.: `Synergy/1.0 (+https://synergy.seudominio.com.br)`. Cada estado é
sincronizado sob demanda pelo botão da página (leva vários minutos e roda em segundo plano); acompanhe pelos
logs do `app` — falhas aparecem como `[licitações] sincronização de <UF> falhou`. Se o container reiniciar
durante uma sincronização, basta pedi-la de novo na página.

## Checklist de produção

- [ ] `SESSION_SECRET`, `MYSQL_PASSWORD` e `MYSQL_ROOT_PASSWORD` fortes e únicos
- [ ] `SHOW_DEMO_ACCOUNTS=false` e contas `*@demo.local` removidas (ou senhas trocadas)
- [ ] Senha do admin (`admin@synergy.local`) alterada
- [ ] Tunnel ativo, DNS com proxy (nuvem laranja) e _Always Use HTTPS_ ligado
- [ ] Managed ruleset, regras customizadas e Bot Fight Mode ativos; login e cadastro testados depois das regras
- [ ] Turnstile configurado
- [ ] Backups agendados e testados (restaure em um ambiente local pelo menos uma vez)
- [ ] Branch `main` protegida e environment `production` com revisores
