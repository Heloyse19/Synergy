import { describe, expect, it } from 'vitest';
import { parseTenderFilters, tenderFiltersQuery, type TenderFilterContext } from './filters';

const context: TenderFilterContext = {
  defaultNicheSlug: 'fintech',
  defaultUf: 'PR',
  nicheSlugs: ['fintech', 'healthtech'],
};

describe('parseTenderFilters', () => {
  it('usa o nicho e o estado da startup quando a URL não informa', () => {
    expect(parseTenderFilters({}, context)).toEqual({
      q: undefined,
      nicheSlug: 'fintech',
      uf: 'PR',
      modalityId: null,
      sort: 'relevancia',
      page: 1,
    });
  });

  it('aceita "todos" para remover os filtros de nicho e estado', () => {
    const filters = parseTenderFilters({ nicho: 'todos', uf: 'todos' }, context);
    expect(filters.nicheSlug).toBeNull();
    expect(filters.uf).toBeNull();
    // Sem nicho não há aderência para ordenar.
    expect(filters.sort).toBe('prazo');
    expect(parseTenderFilters({ nicho: 'todos', ordem: 'relevancia' }, context).sort).toBe('prazo');
  });

  it('ignora valores inválidos e volta aos padrões', () => {
    const filters = parseTenderFilters(
      { nicho: 'inexistente', uf: 'XX', ordem: 'aleatoria', pagina: '-3', modalidade: 'abc' },
      context,
    );
    expect(filters).toMatchObject({
      nicheSlug: 'fintech',
      uf: 'PR',
      sort: 'relevancia',
      page: 1,
      modalityId: null,
    });
  });

  it('lê os filtros válidos da URL', () => {
    const filters = parseTenderFilters(
      {
        q: '  software  ',
        nicho: 'healthtech',
        uf: 'sc',
        ordem: 'valor',
        pagina: '3',
        modalidade: '6',
      },
      context,
    );
    expect(filters).toEqual({
      q: 'software',
      nicheSlug: 'healthtech',
      uf: 'SC',
      modalityId: 6,
      sort: 'valor',
      page: 3,
    });
  });

  it('não usa um nicho padrão sem termos de busca', () => {
    const filters = parseTenderFilters({}, { ...context, defaultNicheSlug: 'biotech' });
    expect(filters.nicheSlug).toBeNull();
  });

  it('usa o primeiro valor de parâmetros repetidos e limita a busca', () => {
    const filters = parseTenderFilters({ uf: ['SP', 'RJ'], q: 'a'.repeat(200) }, context);
    expect(filters.uf).toBe('SP');
    expect(filters.q).toHaveLength(80);
  });
});

describe('tenderFiltersQuery', () => {
  it('reproduz os filtros e permite trocar a página', () => {
    const filters = parseTenderFilters({ q: 'frota', modalidade: '6' }, context);
    const query = tenderFiltersQuery(filters, { page: 2 });
    expect(query).toBe('q=frota&nicho=fintech&uf=PR&modalidade=6&ordem=relevancia&pagina=2');
    expect(parseTenderFilters(Object.fromEntries(new URLSearchParams(query)), context)).toEqual({
      ...filters,
      page: 2,
    });
  });

  it('deixa explícito quando não há filtro de nicho ou estado', () => {
    const filters = parseTenderFilters({ nicho: 'todos', uf: 'todos' }, context);
    expect(tenderFiltersQuery(filters)).toBe('nicho=todos&uf=todos&ordem=prazo');
  });
});
