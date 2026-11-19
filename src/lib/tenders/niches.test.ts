import { describe, expect, it } from 'vitest';
import { getTenderMatcher, matchTender, NICHE_TENDER_TERMS, TECH_TERMS } from './niches';
import { toSearchTerm, toSearchText } from './text';

// Slugs dos nichos criados em prisma/seed.ts.
const SEEDED_NICHES = [
  'agrotech',
  'climatech',
  'e-commerce-e-retailtech',
  'edtech',
  'fintech',
  'foodtech',
  'govtech',
  'healthtech',
  'hrtech',
  'logtech',
  'marketplace',
  'saas-b2b',
];

function match(nicheSlug: string, object: string) {
  const matcher = getTenderMatcher(nicheSlug);
  if (!matcher) throw new Error(`nicho sem termos: ${nicheSlug}`);
  return matchTender(toSearchText(object), matcher);
}

describe('NICHE_TENDER_TERMS', () => {
  it('cobre todos os nichos do seed', () => {
    expect(Object.keys(NICHE_TENDER_TERMS).sort()).toEqual(SEEDED_NICHES);
  });

  it('não tem termos vazios nem repetidos dentro de um nicho', () => {
    for (const [slug, terms] of Object.entries(NICHE_TENDER_TERMS)) {
      const normalized = [...terms.specific, ...terms.domain].map(toSearchTerm);
      expect(normalized.every(Boolean), slug).toBe(true);
      expect(new Set(normalized).size, slug).toBe(normalized.length);
    }
    expect(TECH_TERMS.map(toSearchTerm).every(Boolean)).toBe(true);
  });

  it('devolve null para nicho sem termos definidos', () => {
    expect(getTenderMatcher('nicho-inexistente')).toBeNull();
    expect(getTenderMatcher('constructor')).toBeNull();
  });
});

describe('matchTender', () => {
  it('reconhece uma expressão específica do nicho', () => {
    const result = match(
      'healthtech',
      'Contratação de empresa para implantação de PRONTUÁRIO ELETRÔNICO nas unidades de saúde',
    );
    expect(result?.strength).toBe('strong');
    expect(result?.terms).toContain('prontuário eletrônico');
  });

  it('aceita tecnologia + palavra do setor como aderência possível', () => {
    const result = match(
      'healthtech',
      'Licenciamento de software para controle de estoque da farmácia municipal',
    );
    expect(result?.strength).toBe('related');
    expect(result?.terms).toEqual(expect.arrayContaining(['software', 'farmácia']));
  });

  it('descarta compras do setor que não são soluções de tecnologia', () => {
    expect(
      match('healthtech', 'Aquisição de luvas e seringas para a Secretaria Municipal de Saúde'),
    ).toBeNull();
    expect(match('agrotech', 'Aquisição de sementes para a agricultura familiar')).toBeNull();
  });

  it('descarta tecnologia sem relação com o setor', () => {
    expect(match('agrotech', 'Licença de uso de software de edição de vídeo')).toBeNull();
  });

  it('dá mais pontos a quem tem mais termos do nicho', () => {
    const one = match('logtech', 'Serviço de gestão de frota');
    const many = match(
      'logtech',
      'Plataforma de gestão de frota com rastreamento veicular, telemetria e roteirização de entregas',
    );
    expect(one).not.toBeNull();
    expect(many!.score).toBeGreaterThan(one!.score);
  });

  it('uma expressão específica vale mais que qualquer aderência apenas possível', () => {
    const strong = match('edtech', 'Serviços de gestão escolar');
    const related = match(
      'edtech',
      'Software e aplicativo em plataforma web para alunos da escola, com biblioteca e capacitação no ensino',
    );
    expect(strong?.strength).toBe('strong');
    expect(related?.strength).toBe('related');
    expect(strong!.score).toBeGreaterThan(related!.score);
  });
});
