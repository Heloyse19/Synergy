// Dados iniciais: nichos, roadmap, templates, admin e contas de demonstração.
// Rode com: npm run db:seed  (ou automaticamente após `prisma migrate reset`).
// O script é idempotente: pode ser executado várias vezes sem duplicar dados.
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../src/generated/prisma/client';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL não definida.');

const prisma = new PrismaClient({ adapter: new PrismaMariaDb(databaseUrl) });

const DEMO_PASSWORD = 'Demo@123';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'Admin@123';

const daysFromNow = (days: number, hour = 19) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date;
};

async function seedNiches() {
  const niches = [
    'Fintech',
    'Healthtech',
    'Edtech',
    'Agrotech',
    'SaaS B2B',
    'E-commerce e Retailtech',
    'Logtech',
    'Govtech',
    'Climatech',
    'Marketplace',
    'Foodtech',
    'HRtech',
  ];
  for (const name of niches) {
    const slug = name
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    await prisma.niche.upsert({ where: { slug }, update: { name }, create: { name, slug } });
  }
  console.log(`✔ ${niches.length} nichos`);
}

async function upsertUser(input: {
  email: string;
  name: string;
  password: string;
  role: 'STARTUP' | 'INVESTOR' | 'PROFESSIONAL' | 'ADMIN';
  plan?: 'FREE' | 'PREMIUM';
}) {
  const passwordHash = await bcrypt.hash(input.password, 12);
  return prisma.user.upsert({
    where: { email: input.email },
    update: { name: input.name, role: input.role, plan: input.plan ?? 'FREE' },
    create: {
      email: input.email,
      name: input.name,
      passwordHash,
      role: input.role,
      plan: input.plan ?? 'FREE',
      planActivatedAt: input.plan === 'PREMIUM' ? new Date() : null,
    },
  });
}

async function seedUsers() {
  const fintech = await prisma.niche.findUniqueOrThrow({ where: { slug: 'fintech' } });
  const agro = await prisma.niche.findUniqueOrThrow({ where: { slug: 'agrotech' } });

  const admin = await upsertUser({
    email: 'admin@synergy.local',
    name: 'Equipe Synergy',
    password: ADMIN_PASSWORD,
    role: 'ADMIN',
    plan: 'PREMIUM',
  });

  const startupPremium = await upsertUser({
    email: 'startup@demo.local',
    name: 'Ana Lima',
    password: DEMO_PASSWORD,
    role: 'STARTUP',
    plan: 'PREMIUM',
  });
  await prisma.startupProfile.upsert({
    where: { userId: startupPremium.id },
    update: {},
    create: {
      userId: startupPremium.id,
      name: 'Nexa Pay',
      pitch: 'Pagamentos instantâneos e conciliação automática para pequenos varejistas.',
      description:
        'A Nexa Pay simplifica o recebimento via Pix e cartão para o pequeno varejo, com conciliação bancária automática e antecipação de recebíveis em um clique.',
      website: 'https://nexapay.example.com',
      city: 'Curitiba/PR',
      stage: 'MVP',
      nicheId: fintech.id,
    },
  });

  const startupFree = await upsertUser({
    email: 'startup-free@demo.local',
    name: 'Bruno Costa',
    password: DEMO_PASSWORD,
    role: 'STARTUP',
  });
  await prisma.startupProfile.upsert({
    where: { userId: startupFree.id },
    update: {},
    create: {
      userId: startupFree.id,
      name: 'AgroSense',
      pitch: 'Sensores de baixo custo e IA para irrigação inteligente em pequenas propriedades.',
      city: 'Londrina/PR',
      stage: 'VALIDATION',
      nicheId: agro.id,
    },
  });

  const investor1 = await upsertUser({
    email: 'investidor@demo.local',
    name: 'Carla Mendes',
    password: DEMO_PASSWORD,
    role: 'INVESTOR',
  });
  await prisma.investorProfile.upsert({
    where: { userId: investor1.id },
    update: {},
    create: {
      userId: investor1.id,
      company: 'Anjos do Sul',
      thesis: 'Fintechs e SaaS B2B em estágio de MVP a tração, tickets de R$ 100 mil a R$ 500 mil.',
      ticketMin: 100_000,
      ticketMax: 500_000,
    },
  });

  const investor2 = await upsertUser({
    email: 'investidor2@demo.local',
    name: 'Diego Rocha',
    password: DEMO_PASSWORD,
    role: 'INVESTOR',
  });
  await prisma.investorProfile.upsert({
    where: { userId: investor2.id },
    update: {},
    create: {
      userId: investor2.id,
      company: 'Rocha Ventures',
      thesis: 'Agrotech, climatech e logística. Gosto de times técnicos com validação em campo.',
      ticketMin: 50_000,
      ticketMax: 300_000,
    },
  });

  const professional = await upsertUser({
    email: 'profissional@demo.local',
    name: 'Eduarda Nunes',
    password: DEMO_PASSWORD,
    role: 'PROFESSIONAL',
  });
  await prisma.professionalProfile.upsert({
    where: { userId: professional.id },
    update: {},
    create: {
      userId: professional.id,
      headline: 'Desenvolvedora full stack',
      bio: 'Cinco anos construindo produtos web com React e Node.js. Disponível para projetos freelancer.',
      skills: 'React, Node.js, TypeScript, SQL, Next.js',
      availableForFreelance: true,
    },
  });

  console.log('✔ usuários: admin, 2 startups, 2 investidores, 1 profissional');
  return { admin, startupPremium, startupFree, investor1, investor2, professional };
}

async function seedEvents(users: Awaited<ReturnType<typeof seedUsers>>) {
  if ((await prisma.event.count()) > 0) {
    console.log('• eventos já existem, pulando');
    return;
  }

  const hackathon = await prisma.event.create({
    data: {
      title: 'Hackathon Synergy 2026',
      description:
        'Dois dias de imersão para prototipar soluções com mentoria de founders e investidores anjo. Equipes de até 5 pessoas; as 3 melhores apresentam no pitch final com investidores presentes.\n\nInclui alimentação, mentorias técnicas e de negócio. Traga seu notebook!',
      type: 'HACKATHON',
      origin: 'INTERNAL',
      startsAt: daysFromNow(14, 9),
      endsAt: daysFromNow(15, 18),
      location: 'Hub de Inovação — Curitiba/PR',
      capacity: 60,
      priorityUntil: daysFromNow(7, 23),
      organizerId: users.admin.id,
    },
  });

  const pitchDay = await prisma.event.create({
    data: {
      title: 'Pitch Day Fintech & Payments',
      description:
        'Startups de fintech apresentam em 5 minutos para uma banca de investidores anjo. Inscreva sua startup para pitchar ou participe como ouvinte.',
      type: 'PITCH_DAY',
      origin: 'INTERNAL',
      startsAt: daysFromNow(21, 19),
      endsAt: daysFromNow(21, 21),
      isOnline: true,
      capacity: 150,
      organizerId: users.admin.id,
    },
  });

  await prisma.event.create({
    data: {
      title: 'Meetup Startups do Paraná',
      description:
        'Encontro mensal da comunidade de startups do estado, organizado por parceiros. Networking, lightning talks e happy hour.',
      type: 'MEETUP',
      origin: 'EXTERNAL',
      startsAt: daysFromNow(30, 18),
      location: 'Espaço de coworking parceiro — Londrina/PR',
      externalUrl: 'https://www.meetup.com/',
      organizerId: users.admin.id,
    },
  });

  await prisma.event.create({
    data: {
      title: 'Workshop: como estruturar seu cap table',
      description:
        'Workshop prático sobre divisão societária, vesting, diluição em rodadas e instrumentos de investimento (mútuo conversível e SAFE).',
      type: 'WORKSHOP',
      origin: 'INTERNAL',
      startsAt: daysFromNow(45, 19),
      endsAt: daysFromNow(45, 21),
      isOnline: true,
      capacity: 100,
      organizerId: users.admin.id,
    },
  });

  await prisma.event.create({
    data: {
      title: 'Demo Day Primavera',
      description: 'Demo day das startups aceleradas no último ciclo. Evento já realizado.',
      type: 'DEMO_DAY',
      origin: 'INTERNAL',
      startsAt: daysFromNow(-20, 19),
      endsAt: daysFromNow(-20, 22),
      location: 'Auditório central — Curitiba/PR',
      organizerId: users.admin.id,
    },
  });

  await prisma.eventAttendance.createMany({
    data: [
      { eventId: hackathon.id, userId: users.investor1.id },
      { eventId: hackathon.id, userId: users.investor2.id },
      { eventId: hackathon.id, userId: users.startupPremium.id },
      { eventId: pitchDay.id, userId: users.investor1.id },
      { eventId: pitchDay.id, userId: users.startupPremium.id },
      { eventId: pitchDay.id, userId: users.professional.id },
    ],
  });

  console.log('✔ 5 eventos (2 com investidores confirmados)');
}

async function seedJobs(users: Awaited<ReturnType<typeof seedUsers>>) {
  if ((await prisma.jobPosting.count()) > 0) {
    console.log('• vagas já existem, pulando');
    return;
  }

  const nexa = await prisma.startupProfile.findUniqueOrThrow({
    where: { userId: users.startupPremium.id },
  });
  const agro = await prisma.startupProfile.findUniqueOrThrow({
    where: { userId: users.startupFree.id },
  });

  await prisma.jobPosting.createMany({
    data: [
      {
        startupId: nexa.id,
        title: 'Desenvolvedor(a) Front-end React',
        description:
          'Buscamos uma pessoa desenvolvedora front-end para evoluir o painel do lojista.\n\nRequisitos: React, TypeScript, testes automatizados. Diferenciais: Next.js, design systems.\n\nBenefícios: remoto, horário flexível, plano de saúde.\n\nCandidatura: envie seu portfólio para vagas@nexapay.example.com.',
        type: 'CLT',
        workMode: 'REMOTE',
        salaryRange: 'R$ 7.000 – R$ 9.500',
        skills: 'React, TypeScript, Testing Library, Next.js',
      },
      {
        startupId: nexa.id,
        title: 'Designer de produto (projeto freelancer)',
        description:
          'Projeto de 6 semanas para redesenhar o fluxo de onboarding do app. Entregáveis: pesquisa com usuários, wireframes e protótipo navegável em Figma.',
        type: 'FREELANCE',
        workMode: 'REMOTE',
        salaryRange: 'R$ 12.000 (projeto)',
        skills: 'Figma, UX Research, Prototipação',
      },
      {
        startupId: nexa.id,
        title: 'Estágio em dados e BI',
        description:
          'Apoio na construção de dashboards de conciliação e análise de churn. Estudante de TADS, Sistemas, Estatística ou áreas afins.',
        type: 'INTERNSHIP',
        workMode: 'HYBRID',
        location: 'Curitiba/PR',
        salaryRange: 'R$ 1.800 + VT + VR',
        skills: 'SQL, Python, Power BI',
      },
      {
        startupId: agro.id,
        title: 'Engenheiro(a) de software IoT',
        description:
          'Desenvolvimento de firmware para sensores de umidade e integração com nossa API. Experiência com ESP32/Arduino e MQTT.',
        type: 'PJ',
        workMode: 'HYBRID',
        location: 'Londrina/PR',
        salaryRange: 'R$ 10.000 – R$ 13.000',
        skills: 'C/C++, ESP32, MQTT, Node.js',
      },
      {
        startupId: agro.id,
        title: 'Analista de marketing digital (freelancer)',
        description:
          'Campanha de lançamento para produtores rurais: conteúdo para redes sociais, landing page e anúncios. Contrato por 3 meses.',
        type: 'FREELANCE',
        workMode: 'REMOTE',
        salaryRange: 'A combinar',
        skills: 'Meta Ads, Google Ads, Copywriting',
      },
    ],
  });

  console.log('✔ 5 vagas');
}

async function seedRoadmap(users: Awaited<ReturnType<typeof seedUsers>>) {
  if ((await prisma.roadmapStep.count()) === 0) {
    const steps: Array<{
      phase: string;
      title: string;
      description: string;
      resourceUrl?: string;
    }> = [
      {
        phase: 'Formalização',
        title: 'Definir a natureza jurídica',
        description:
          'Compare LTDA, SLU e S.A. considerando sócios, investimento futuro e custos de manutenção.',
        resourceUrl: 'https://www.gov.br/empresas-e-negocios/pt-br/empreendedor',
      },
      {
        phase: 'Formalização',
        title: 'Elaborar o contrato social',
        description:
          'Defina objeto social, capital, participação dos sócios, administração e regras de saída.',
      },
      {
        phase: 'Formalização',
        title: 'Obter o CNPJ',
        description: 'Registre a empresa na Junta Comercial e na Receita Federal pelo Redesim.',
        resourceUrl: 'https://www.gov.br/empresas-e-negocios/pt-br/redesim',
      },
      {
        phase: 'Formalização',
        title: 'Inscrição municipal e alvará',
        description:
          'Solicite a inscrição municipal e verifique a necessidade de alvará de funcionamento para a atividade.',
      },
      {
        phase: 'Formalização',
        title: 'Emitir o certificado digital e-CNPJ',
        description:
          'Necessário para assinar documentos, emitir notas fiscais e acessar sistemas do governo.',
      },
      {
        phase: 'Tributário e financeiro',
        title: 'Escolher o regime tributário',
        description:
          'Avalie Simples Nacional (com Anexo III/V e fator R) versus Lucro Presumido com um contador.',
        resourceUrl: 'https://www8.receita.fazenda.gov.br/SimplesNacional/',
      },
      {
        phase: 'Tributário e financeiro',
        title: 'Abrir conta bancária PJ',
        description:
          'Separe finanças pessoais e da empresa; compare fintechs e bancos tradicionais.',
      },
      {
        phase: 'Tributário e financeiro',
        title: 'Contratar contabilidade',
        description:
          'Escolha um escritório com experiência em startups (stock options, investimentos, folha).',
      },
      {
        phase: 'Tributário e financeiro',
        title: 'Configurar emissão de NFS-e',
        description:
          'Cadastre a empresa no sistema de nota fiscal de serviços do município (ou padrão nacional).',
        resourceUrl: 'https://www.gov.br/nfse/pt-br',
      },
      {
        phase: 'Propriedade intelectual e dados',
        title: 'Registrar a marca no INPI',
        description:
          'Pesquise anterioridade e deposite o pedido nas classes corretas antes de investir em branding.',
        resourceUrl: 'https://www.gov.br/inpi/pt-br',
      },
      {
        phase: 'Propriedade intelectual e dados',
        title: 'Registrar domínio e software',
        description:
          'Garanta os domínios principais (.com.br/.com) e avalie o registro de programa de computador no INPI.',
        resourceUrl: 'https://registro.br/',
      },
      {
        phase: 'Propriedade intelectual e dados',
        title: 'Publicar política de privacidade e adequar à LGPD',
        description:
          'Mapeie dados pessoais tratados, defina bases legais e nomeie um encarregado (DPO).',
        resourceUrl: 'https://www.gov.br/anpd/pt-br',
      },
      {
        phase: 'Propriedade intelectual e dados',
        title: 'Redigir termos de uso',
        description:
          'Deixe claras as responsabilidades, planos, cancelamento e limitações do serviço.',
      },
      {
        phase: 'Captação e governança',
        title: 'Acordo de sócios com vesting',
        description:
          'Formalize cliff e vesting dos fundadores, não concorrência e regras de deadlock.',
      },
      {
        phase: 'Captação e governança',
        title: 'Montar o cap table',
        description: 'Documente a participação atual e simule a diluição em rodadas futuras.',
      },
      {
        phase: 'Captação e governança',
        title: 'Preparar pitch deck e data room',
        description:
          'Deck de 10 a 12 slides e pasta organizada com contratos, métricas e demonstrativos.',
      },
      {
        phase: 'Captação e governança',
        title: 'Escolher o instrumento de investimento',
        description:
          'Entenda mútuo conversível, contrato de participação e SAFE adaptado ao Brasil.',
      },
      {
        phase: 'Captação e governança',
        title: 'Checklist de due diligence',
        description:
          'Antecipe o que investidores pedem: societário, trabalhista, tributário, PI e tecnologia.',
      },
    ];
    await prisma.roadmapStep.createMany({
      data: steps.map((step, index) => ({ ...step, order: index + 1 })),
    });
    console.log(`✔ ${steps.length} passos do roadmap`);
  } else {
    console.log('• roadmap já existe, pulando');
  }

  // Progresso de demonstração para a startup premium (primeiros 5 passos).
  const nexa = await prisma.startupProfile.findUniqueOrThrow({
    where: { userId: users.startupPremium.id },
  });
  const firstSteps = await prisma.roadmapStep.findMany({
    orderBy: { order: 'asc' },
    take: 5,
    select: { id: true },
  });
  for (const step of firstSteps) {
    await prisma.roadmapProgress.upsert({
      where: { startupId_stepId: { startupId: nexa.id, stepId: step.id } },
      update: {},
      create: { startupId: nexa.id, stepId: step.id },
    });
  }
}

async function seedTemplates() {
  if ((await prisma.landingPageTemplate.count()) > 0) {
    console.log('• templates já existem, pulando');
    return;
  }
  await prisma.landingPageTemplate.createMany({
    data: [
      {
        name: 'Captação com investidores',
        category: 'Captação',
        description:
          'Landing page completa para apresentar a rodada: métricas, tese, time e chamada para o data room.',
        fileUrl: '/templates/captacao-investidores.html',
      },
      {
        name: 'Lista de espera (pré-lançamento)',
        category: 'Pré-lançamento',
        description:
          'Página enxuta para captar e-mails antes do lançamento e validar interesse no produto.',
        fileUrl: '/templates/pre-lancamento.html',
      },
      {
        name: 'One-pager para investidores',
        category: 'Captação',
        description: 'Resumo executivo de uma página, pronto para imprimir ou enviar em PDF.',
        fileUrl: '/templates/one-pager.html',
      },
    ],
  });
  console.log('✔ 3 templates de landing page');
}

async function seedForum(users: Awaited<ReturnType<typeof seedUsers>>) {
  if ((await prisma.forumPost.count()) > 0) {
    console.log('• fórum já tem publicações, pulando');
    return;
  }
  const post = await prisma.forumPost.create({
    data: {
      authorId: users.startupPremium.id,
      title: 'Como vocês estruturaram o contrato social com cláusula de vesting?',
      content:
        'Estamos formalizando a Nexa Pay e o contador sugeriu deixar o vesting só no acordo de sócios. Alguém já passou por isso? Vale colocar algo no contrato social também?',
      replies: {
        create: [
          {
            authorId: users.admin.id,
            content:
              'Na prática o vesting costuma ficar no acordo de sócios (documento privado), e o contrato social referencia a existência do acordo. Assim vocês não precisam registrar alterações na Junta a cada mudança.',
          },
        ],
      },
    },
  });
  await prisma.forumPost.create({
    data: {
      authorId: users.admin.id,
      title: 'Bem-vindos à comunidade Synergy!',
      content:
        'Este espaço é para apoio mútuo entre startups: dúvidas de burocracia, captação, contratação e produto. Seja direto, compartilhe contexto e ajude quem está começando.',
    },
  });
  console.log(`✔ fórum: 2 publicações (ex.: ${post.title.slice(0, 30)}...)`);
}

async function main() {
  console.log('Iniciando seed...');
  await seedNiches();
  const users = await seedUsers();
  await seedEvents(users);
  await seedJobs(users);
  await seedRoadmap(users);
  await seedTemplates();
  await seedForum(users);
  console.log('Seed concluído.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
