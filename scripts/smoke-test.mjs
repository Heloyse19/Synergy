#!/usr/bin/env node
// Smoke test dos fluxos principais contra um servidor LOCAL com o seed carregado.
// Cria dados de teste (usuário, vaga, presença em evento) — NÃO rode contra produção.
// Uso: npm run build && (PORT=3100 node .next/standalone/server.js &) && BASE_URL=http://localhost:3100 node scripts/smoke-test.mjs

const BASE = process.env.BASE_URL ?? 'http://localhost:3100';
let failures = 0;
const results = [];

function check(name, ok, detail = '') {
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures++;
}

function decode(s) {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/** Extrai os inputs hidden do primeiro <form> que contém `marker`. */
function formHidden(html, marker) {
  const forms = html.match(/<form[\s\S]*?<\/form>/g) ?? [];
  const form = forms.find((f) => f.includes(marker));
  if (!form) throw new Error(`form com "${marker}" não encontrado`);
  const fields = {};
  for (const m of form.matchAll(/<input([^>]*)>/g)) {
    const attrs = m[1];
    if (!/type="hidden"/.test(attrs)) continue;
    const name = /name="([^"]*)"/.exec(attrs)?.[1];
    const value = /value="([^"]*)"/.exec(attrs)?.[1] ?? '';
    if (name) fields[decode(name)] = decode(value);
  }
  return fields;
}

function cookieFrom(res) {
  const set = res.headers.getSetCookie?.() ?? [];
  const c = set.find((s) => s.startsWith('synergy_session='));
  return c ? c.split(';')[0] : null;
}

// React insere <!-- --> entre textos adjacentes no SSR; removemos para comparar strings.
const clean = (html) => html.replace(/<!--.*?-->/g, '');

async function get(path, cookie) {
  const res = await fetch(BASE + path, {
    redirect: 'manual',
    headers: cookie ? { cookie } : {},
  });
  return { res, html: clean(await res.text()) };
}

async function submit(path, fields, cookie) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.append(k, v);
  const res = await fetch(BASE + path, {
    method: 'POST',
    body: fd,
    redirect: 'manual',
    headers: { origin: BASE, accept: 'text/html', ...(cookie ? { cookie } : {}) },
  });
  return { res, html: clean(await res.text()) };
}

async function login(email, password) {
  const page = await get('/login');
  const hidden = formHidden(page.html, 'name="email"');
  const { res, html } = await submit('/login', { ...hidden, email, password, next: '/app' });
  return { res, html, cookie: cookieFrom(res) };
}

try {
  // Páginas públicas
  let r = await get('/');
  check(
    'GET / 200 com título',
    r.res.status === 200 && r.html.includes('Conectamos startups'),
    `status ${r.res.status}`,
  );
  r = await get('/eventos');
  check(
    'GET /eventos lista o hackathon',
    r.res.status === 200 && r.html.includes('Hackathon Synergy 2026'),
  );
  check('card mostra investidores confirmados', r.html.includes('investidores anjo confirmados'));
  r = await get('/vagas');
  check(
    'GET /vagas lista vaga do seed',
    r.res.status === 200 && r.html.includes('Desenvolvedor(a) Front-end React'),
  );
  r = await get('/vagas?tipo=FREELANCE');
  check(
    'filtro por tipo freelancer',
    r.html.includes('Designer de produto') && !r.html.includes('Estágio em dados e BI'),
  );
  r = await get('/api/health');
  check('GET /api/health ok', r.res.status === 200 && r.html.includes('"db":"up"'), r.html);
  r = await get('/app');
  check(
    'GET /app sem sessão redireciona para /login',
    r.res.status === 307 && (r.res.headers.get('location') ?? '').includes('/login?next=%2Fapp'),
    `status ${r.res.status} loc ${r.res.headers.get('location')}`,
  );
  r = await get('/rota-inexistente');
  check('404 personalizado', r.res.status === 404 && r.html.includes('Página não encontrada'));

  // Login inválido
  let l = await login('startup@demo.local', 'senha-errada');
  check(
    'login com senha errada mostra erro',
    l.res.status === 200 && l.html.includes('E-mail ou senha inválidos') && !l.cookie,
    `status ${l.res.status}`,
  );

  // Login premium
  l = await login('startup@demo.local', 'Demo@123');
  check(
    'login válido redireciona (303) e seta cookie',
    l.res.status === 303 && Boolean(l.cookie),
    `status ${l.res.status} loc ${l.res.headers.get('location')}`,
  );
  const premium = l.cookie;
  r = await get('/app', premium);
  check('painel saúda a usuária', r.res.status === 200 && r.html.includes('Olá, Ana'));
  r = await get('/login', premium);
  check(
    '/login com sessão redireciona para /app',
    r.res.status === 307 && (r.res.headers.get('location') ?? '').endsWith('/app'),
  );
  r = await get('/app/comunidade', premium);
  check('premium acessa a comunidade', r.html.includes('Bem-vindos à comunidade Synergy'));
  r = await get('/app/roadmap', premium);
  check(
    'premium vê o roadmap com progresso',
    r.html.includes('Progresso geral') && r.html.includes('5 de 18 passos'),
  );
  r = await get('/app/templates', premium);
  check('premium vê templates', r.html.includes('Captação com investidores'));
  r = await get('/app/vagas', premium);
  check(
    'startup vê gestão das próprias vagas',
    r.html.includes('Minhas vagas') && r.html.includes('Publicar vaga'),
  );

  // Criar vaga via formulário
  r = await get('/app/vagas/nova', premium);
  let hidden = formHidden(r.html, 'name="title"');
  let s = await submit(
    '/app/vagas/nova',
    {
      ...hidden,
      title: 'Vaga Smoke Test QA',
      description:
        'Vaga criada automaticamente pelo smoke test para validar o fluxo de publicação.',
      type: 'PJ',
      workMode: 'REMOTE',
      location: '',
      salaryRange: 'A combinar',
      skills: 'Playwright, Vitest',
      isActive: 'on',
    },
    premium,
  );
  const jobLoc = s.res.headers.get('location') ?? '';
  check(
    'criar vaga redireciona para a vaga',
    s.res.status === 303 && /\/vagas\/[^/?]+\?publicada=1/.test(jobLoc),
    `status ${s.res.status} loc ${jobLoc}`,
  );
  if (jobLoc) {
    r = await get(jobLoc.replace(BASE, ''), premium);
    check(
      'vaga criada aparece com sucesso',
      r.html.includes('Vaga Smoke Test QA') && r.html.includes('Vaga publicada com sucesso'),
    );
  }
  r = await get('/app/vagas/nova', premium);
  hidden = formHidden(r.html, 'name="title"');
  s = await submit(
    '/app/vagas/nova',
    { ...hidden, title: 'ab', description: 'curta', type: 'PJ', workMode: 'REMOTE' },
    premium,
  );
  check(
    'validação da vaga devolve erros por campo',
    s.res.status === 200 &&
      s.html.includes('pelo menos 3 caracteres') &&
      s.html.includes('pelo menos 20 caracteres'),
  );

  // Conta gratuita: bloqueios
  l = await login('startup-free@demo.local', 'Demo@123');
  const free = l.cookie;
  r = await get('/app/comunidade', free);
  check('gratuito vê bloqueio da comunidade', r.html.includes('exclusivo do plano Premium'));
  r = await get('/app/roadmap', free);
  check('gratuito vê bloqueio do roadmap', r.html.includes('exclusivo do plano Premium'));
  r = await get('/app/comunidade/qualquer', free);
  check(
    'rota premium interna redireciona para upgrade',
    r.res.status === 307 &&
      (r.res.headers.get('location') ?? '').includes('/app/premium?bloqueado=1'),
  );

  // Prioridade premium no hackathon (janela aberta por 7 dias no seed)
  r = await get('/eventos', free);
  const hackId = [...r.html.matchAll(/href="\/eventos\/([a-z0-9]+)"/g)].map((m) => m[1]);
  const detailPages = await Promise.all(
    [...new Set(hackId)].map(async (id) => ({ id, ...(await get(`/eventos/${id}`, free)) })),
  );
  const hack = detailPages.find((p) => p.html.includes('Hackathon Synergy 2026'));
  check('detalhe do hackathon acessível', Boolean(hack));
  if (hack) {
    check(
      'gratuito vê aviso de janela de prioridade',
      hack.html.includes('apenas para contas Premium') && hack.html.includes('disabled'),
    );
  }

  // Investidor confirma presença publicamente
  l = await login('investidor2@demo.local', 'Demo@123');
  const investor = l.cookie;
  const pitch = detailPages.find((p) => p.html.includes('Pitch Day Fintech'));
  check('detalhe do pitch day acessível', Boolean(pitch));
  if (pitch) {
    r = await get(`/eventos/${pitch.id}`, investor);
    check('investidor ainda não confirmado no pitch day', !r.html.includes('Rocha Ventures'));
    hidden = formHidden(r.html, 'name="eventId"');
    s = await submit(`/eventos/${pitch.id}`, hidden, investor);
    check('confirmar presença responde 200', s.res.status === 200, `status ${s.res.status}`);
    r = await get(`/eventos/${pitch.id}`, free);
    check(
      'presença do investidor aparece publicamente',
      r.html.includes('Diego Rocha') && r.html.includes('Rocha Ventures'),
    );
  }

  // Cadastro de nova conta
  r = await get('/cadastro');
  hidden = formHidden(r.html, 'name="startupName"');
  const email = `smoke+${Date.now()}@demo.local`;
  s = await submit('/cadastro', {
    ...hidden,
    name: 'Smoke Tester',
    email,
    password: 'SenhaForte123',
    role: 'PROFESSIONAL',
    headline: 'QA',
  });
  const regCookie = cookieFrom(s.res);
  if (s.res.status !== 303)
    console.log('cadastro alert:', /role="alert"[^>]*>([\s\S]*?)<\/(p|div)>/.exec(s.html)?.[1]);
  check(
    'cadastro redireciona com boas-vindas',
    s.res.status === 303 &&
      (s.res.headers.get('location') ?? '').includes('/app?bem-vindo=1') &&
      Boolean(regCookie),
    `status ${s.res.status} loc ${s.res.headers.get('location')}`,
  );
  if (regCookie) {
    r = await get('/app?bem-vindo=1', regCookie);
    check(
      'painel do novo profissional',
      r.html.includes('Olá, Smoke') && r.html.includes('Conta criada com sucesso'),
    );
  }
  s = await submit('/cadastro', {
    ...hidden,
    name: 'Dup',
    email,
    password: 'SenhaForte123',
    role: 'PROFESSIONAL',
  });
  check(
    'cadastro duplicado é rejeitado',
    s.res.status === 200 && s.html.includes('Já existe uma conta com este e-mail'),
  );

  // Logout
  r = await get('/app', premium);
  hidden = formHidden(r.html, 'aria-label="Sair da conta"');
  s = await submit('/app', hidden, premium);
  const cleared = (s.res.headers.getSetCookie?.() ?? []).some(
    (c) => c.startsWith('synergy_session=;') || /synergy_session=.*Max-Age=0/.test(c),
  );
  check(
    'logout limpa o cookie e redireciona',
    s.res.status === 303 && cleared,
    `status ${s.res.status} setcookie ${JSON.stringify(s.res.headers.getSetCookie?.())}`,
  );
} catch (error) {
  check('execução sem exceções', false, String(error.stack ?? error));
}

console.log(results.join('\n'));
console.log(`\n${results.length - failures}/${results.length} verificações passaram`);
process.exit(failures ? 1 : 0);
