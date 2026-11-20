// Regras de aderência entre licitações e nichos de startup.
// Módulo puro (sem banco) para facilitar testes unitários.
//
// Editais não usam o vocabulário de startups ("fintech", "healthtech"): falam em "prontuário eletrônico"
// ou "gestão de frota". Por isso cada nicho tem dois grupos de termos:
//   - specific: expressões que sozinhas indicam uma oportunidade do nicho;
//   - domain:   palavras do setor que só contam quando o objeto também descreve uma solução de tecnologia
//               (TECH_TERMS). "Saúde" aparece em toda compra de luva e remédio; "software" + "saúde" não.
// As chaves são os slugs da tabela `Niche` (ver prisma/seed.ts). Ao criar um nicho, inclua os termos aqui.
//
// Os termos foram calibrados com os editais abertos do Paraná (nov/2026). Lições que valem para novos
// termos: prefira expressões a palavras soltas; evite siglas e palavras com outro sentido em editais
// ("CRM" é o conselho de medicina, "plataforma" é carroceria de caminhão, "emissões" vira "emissão" de
// cartão); e não use o que todo edital de software traz ("treinamento", "municipal", "servidores").
// A comparação ignora acentos, plural e preposições (ver ./text.ts).
import { includesTerm, toSearchTerm } from './text';

export type NicheTenderTerms = { specific: string[]; domain: string[] };

/** Indicam que o objeto contrata uma solução de tecnologia, e não material, obra ou serviço manual. */
export const TECH_TERMS = [
  'software',
  'aplicativo',
  'sistema de gestão',
  'sistema integrado',
  'sistema informatizado',
  'sistema de informação',
  'sistema web',
  'plataforma digital',
  'plataforma tecnológica',
  'plataforma web',
  'plataforma online',
  'plataforma eletrônica',
  'plataforma integrada',
  'solução tecnológica',
  'solução de tecnologia',
  'solução digital',
  'solução informatizada',
  'licença de uso',
  'licenciamento de uso',
  'computação em nuvem',
  'saas',
  'tecnologia da informação',
  'inteligência artificial',
  'internet das coisas',
  'telemetria',
  'business intelligence',
];

export const NICHE_TENDER_TERMS: Record<string, NicheTenderTerms> = {
  fintech: {
    specific: [
      'meios de pagamento',
      'pagamento eletrônico',
      'pagamento digital',
      'gateway de pagamento',
      'cartão de crédito',
      'cartão de débito',
      'boleto',
      'conciliação bancária',
      'conciliação financeira',
      'carteira digital',
      'gestão de recebíveis',
      'antecipação de recebíveis',
      'crédito consignado',
      'empréstimo consignado',
      'microcrédito',
      'educação financeira',
      'sistema contábil',
      'software contábil',
      'instituição de pagamento',
    ],
    domain: [
      'financeiro',
      'financeira',
      'contábil',
      'contabilidade',
      'tributário',
      'tributária',
      'arrecadação',
      'pagamento',
      'bancário',
      'bancária',
      'cobrança',
      'tesouraria',
    ],
  },
  healthtech: {
    specific: [
      'prontuário eletrônico',
      'telemedicina',
      'telessaúde',
      'teleconsulta',
      'telediagnóstico',
      'telerradiologia',
      'telelaudo',
      'saúde digital',
      'prescrição eletrônica',
    ],
    domain: [
      'saúde',
      'hospitalar',
      'hospital',
      'clínica',
      'paciente',
      'ambulatorial',
      'laboratorial',
      'farmácia',
      'farmacêutica',
      'enfermagem',
      'odontológico',
      'sus',
      'gestão hospitalar',
      'regulação',
    ],
  },
  edtech: {
    specific: [
      'plataforma educacional',
      'plataforma de ensino',
      'plataforma de aprendizagem',
      'ensino a distância',
      'educação a distância',
      'ambiente virtual de aprendizagem',
      'gestão escolar',
      'gestão educacional',
      'gestão acadêmica',
      'robótica educacional',
      'tecnologia educacional',
      'conteúdo digital educacional',
      'material didático digital',
      'cursos online',
    ],
    domain: [
      'educação',
      'educacional',
      'escolar',
      'escola',
      'ensino',
      'aprendizagem',
      'aluno',
      'estudante',
      'pedagógico',
      'pedagógica',
      'acadêmico',
      'acadêmica',
      'biblioteca',
    ],
  },
  agrotech: {
    specific: [
      'agricultura de precisão',
      'agricultura digital',
      'drone agrícola',
      'monitoramento agrícola',
      'estação meteorológica',
      'estação agrometeorológica',
      'cadastro ambiental rural',
    ],
    domain: [
      'agrícola',
      'agricultura',
      'agropecuária',
      'agropecuário',
      'agronegócio',
      'rural',
      'pecuária',
      'irrigação',
      'lavoura',
      'safra',
      'rebanho',
      'florestal',
      'georreferenciamento',
      'sensoriamento remoto',
      'extensão rural',
    ],
  },
  'saas-b2b': {
    specific: [
      'software como serviço',
      'software as a service',
      'saas',
      'licenciamento de software',
      'licença de software',
      'licença de uso de software',
      'desenvolvimento de software',
      'fábrica de software',
      'sustentação de sistemas',
      'sistema de gestão',
      'sistema integrado de gestão',
      'erp',
      'computação em nuvem',
      'gestão eletrônica de documentos',
      'gestão documental',
      'assinatura eletrônica',
      'assinatura digital',
      'business intelligence',
      'automação de processos',
      'service desk',
      'chatbot',
      'inteligência artificial',
    ],
    // Qualquer contratação de software interessa a quem vende SaaS: entra como aderência possível.
    domain: [
      'software',
      'aplicativo',
      'sistema informatizado',
      'sistema web',
      'plataforma digital',
    ],
  },
  'e-commerce-e-retailtech': {
    specific: [
      'comércio eletrônico',
      'e-commerce',
      'loja virtual',
      'marketplace',
      'ponto de venda',
      'frente de caixa',
      'automação comercial',
      'gestão de estoque',
      'controle de estoque',
      'autoatendimento',
      'programa de fidelidade',
      'catálogo eletrônico',
    ],
    domain: ['varejo', 'varejista', 'loja', 'vendas', 'estoque', 'almoxarifado', 'consumidor'],
  },
  logtech: {
    specific: [
      'gestão de frota',
      'gerenciamento de frota',
      'monitoramento de frota',
      'controle de frota',
      'rastreamento veicular',
      'rastreamento de veículos',
      'rastreamento de cargas',
      'monitoramento veicular',
      'telemetria veicular',
      'roteirização',
      'gestão logística',
      'gestão de armazém',
      'gerenciamento de abastecimento',
      'gestão de abastecimento',
      'logística reversa',
    ],
    domain: [
      'logística',
      'logístico',
      'transporte',
      'frota',
      'veículo',
      'armazenagem',
      'armazém',
      'carga',
      'entrega',
      'distribuição',
      'frete',
      'mobilidade',
    ],
  },
  govtech: {
    specific: [
      'governo digital',
      'cidade inteligente',
      'transformação digital',
      'gestão pública',
      'portal da transparência',
      'ouvidoria',
      'atendimento ao cidadão',
      'serviços digitais',
      'processo eletrônico',
      'protocolo eletrônico',
      'nota fiscal eletrônica',
      'gestão tributária',
      'cadastro multifinalitário',
      'cadastro imobiliário',
      'solução inovadora',
      'inovação aberta',
      'encomenda tecnológica',
      'startup',
      'dados abertos',
    ],
    domain: [
      'cidadão',
      'contribuinte',
      'tributário',
      'tributária',
      'arrecadação',
      'legislativo',
      'administração pública',
      'transparência',
      'protocolo',
      'fiscalização',
      'urbano',
      'geoprocessamento',
    ],
  },
  climatech: {
    specific: [
      'energia solar',
      'energia fotovoltaica',
      'sistema fotovoltaico',
      'usina fotovoltaica',
      'energia renovável',
      'crédito de carbono',
      'gases de efeito estufa',
      'mudanças climáticas',
      'monitoramento ambiental',
      'qualidade do ar',
      'gestão de resíduos',
      'coleta seletiva',
      'compostagem',
      'biogás',
      'reuso de água',
      'veículo elétrico',
      'restauração florestal',
    ],
    domain: [
      'ambiental',
      'meio ambiente',
      'sustentável',
      'sustentabilidade',
      'climático',
      'climática',
      'resíduos',
      'energia',
      'eficiência energética',
      'hídrico',
      'hídrica',
      'saneamento básico',
      'reciclagem',
      'reflorestamento',
    ],
  },
  marketplace: {
    specific: [
      'marketplace',
      'plataforma de intermediação',
      'intermediação de serviços',
      'plataforma de compras',
      'plataforma de contratação',
      'transporte por aplicativo',
      'aplicativo de transporte',
      'economia compartilhada',
      'comércio eletrônico',
    ],
    domain: ['intermediação', 'agenciamento', 'fornecedores', 'prestadores de serviço', 'catálogo'],
  },
  foodtech: {
    specific: [
      'alimentos orgânicos',
      'produtos orgânicos',
      'proteína vegetal',
      'alimentação saudável',
      'gestão de alimentação',
      'refeições congeladas',
    ],
    domain: [
      'alimentação',
      'alimento',
      'alimentício',
      'alimentar',
      'refeição',
      'merenda',
      'nutrição',
      'nutricional',
      'restaurante',
      'cozinha',
      'cantina',
    ],
  },
  hrtech: {
    specific: [
      'recrutamento e seleção',
      'ponto eletrônico',
      'controle de ponto',
      'registro de ponto',
      'clima organizacional',
      'educação corporativa',
      'treinamento corporativo',
      'esocial',
      'gestão de benefícios',
      'auxílio alimentação',
      'vale alimentação',
      'vale refeição',
      'agente de integração',
    ],
    domain: [
      'gestão de pessoas',
      'recursos humanos',
      'avaliação de desempenho',
      'colaboradores',
      'funcionários',
      'pessoal',
      'trabalhista',
      'estágio',
      'estagiário',
      'previdenciário',
      'folha de pagamento',
    ],
  },
};

export type CompiledTerm = { label: string; term: string };

export type TenderMatcher = {
  specific: CompiledTerm[];
  domain: CompiledTerm[];
  tech: CompiledTerm[];
};

function compile(terms: string[]): CompiledTerm[] {
  return terms.map((label) => ({ label, term: toSearchTerm(label) })).filter(({ term }) => term);
}

const TECH = compile(TECH_TERMS);
const matchers = new Map<string, TenderMatcher>();

/** Termos de um nicho prontos para comparação; `null` quando o nicho ainda não tem termos definidos. */
export function getTenderMatcher(nicheSlug: string): TenderMatcher | null {
  const cached = matchers.get(nicheSlug);
  if (cached) return cached;
  if (!Object.hasOwn(NICHE_TENDER_TERMS, nicheSlug)) return null;
  const terms = NICHE_TENDER_TERMS[nicheSlug];
  const matcher = { specific: compile(terms.specific), domain: compile(terms.domain), tech: TECH };
  matchers.set(nicheSlug, matcher);
  return matcher;
}

export type TenderMatch = {
  /** Quanto maior, mais termos do nicho o objeto contém. */
  score: number;
  /** strong: contém uma expressão específica do nicho; related: tecnologia + palavra do setor. */
  strength: 'strong' | 'related';
  /** Termos encontrados (como escritos em NICHE_TENDER_TERMS), para explicar o resultado ao usuário. */
  terms: string[];
};

const SPECIFIC_WEIGHT = 3;
const MAX_COUNTED_TERMS = 3;
/** Garante que qualquer expressão específica fique acima da melhor aderência apenas "possível". */
const STRONG_BONUS = 10;

/**
 * Avalia a aderência de uma licitação (pelo `searchText` do objeto) a um nicho.
 * Devolve `null` quando o objeto não tem relação com o nicho.
 */
export function matchTender(searchText: string, matcher: TenderMatcher): TenderMatch | null {
  const hits = (terms: CompiledTerm[]) =>
    terms.filter(({ term }) => includesTerm(searchText, term));
  const specific = hits(matcher.specific);
  const domain = hits(matcher.domain);
  const tech = hits(matcher.tech);
  const hasTechInDomain = tech.length > 0 && domain.length > 0;

  if (specific.length === 0 && !hasTechInDomain) return null;

  let score = SPECIFIC_WEIGHT * Math.min(specific.length, MAX_COUNTED_TERMS);
  if (specific.length > 0) score += STRONG_BONUS;
  if (hasTechInDomain) score += 1 + Math.min(domain.length, MAX_COUNTED_TERMS);
  else if (tech.length > 0) score += 1;

  const explained = hasTechInDomain ? [...specific, ...tech, ...domain] : [...specific, ...tech];
  return {
    score,
    strength: specific.length > 0 ? 'strong' : 'related',
    terms: [...new Set(explained.map(({ label }) => label))],
  };
}
