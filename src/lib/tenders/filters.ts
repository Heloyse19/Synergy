// Filtros da página de licitações, lidos da query string.
// Módulo puro (sem banco) para facilitar testes unitários.
import { isUf, type Uf } from './states';

/** Valor dos filtros de nicho e estado que significa "sem filtro". */
export const ALL = 'todos';

export const TENDER_SORTS = ['relevancia', 'prazo', 'recentes', 'valor'] as const;
export type TenderSort = (typeof TENDER_SORTS)[number];

export const tenderSortLabels: Record<TenderSort, string> = {
  relevancia: 'Maior aderência ao nicho',
  prazo: 'Prazo mais próximo',
  recentes: 'Publicadas recentemente',
  valor: 'Maior valor estimado',
};

export type TenderSearchParams = Partial<
  Record<'q' | 'nicho' | 'uf' | 'modalidade' | 'ordem' | 'pagina', string | string[]>
>;

export type TenderFilters = {
  q?: string;
  /** Slug do nicho usado para casar as licitações; `null` lista todas. */
  nicheSlug: string | null;
  /** `null` considera todos os estados já sincronizados. */
  uf: Uf | null;
  modalityId: number | null;
  sort: TenderSort;
  page: number;
};

export type TenderFilterContext = {
  /** Nicho e estado da startup logada: valem quando a URL não informa outro. */
  defaultNicheSlug: string | null;
  defaultUf: Uf | null;
  /** Nichos que podem ser escolhidos (existem no banco e têm termos de busca). */
  nicheSlugs: readonly string[];
};

const MAX_QUERY_LENGTH = 80;
const MAX_PAGE = 10_000;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function positiveInt(value: string | undefined, max: number): number | null {
  if (!value || !/^\d{1,6}$/.test(value)) return null;
  const number = Number(value);
  return number >= 1 && number <= max ? number : null;
}

export function parseTenderFilters(
  params: TenderSearchParams,
  context: TenderFilterContext,
): TenderFilters {
  const selectable = (slug: string | null) =>
    slug !== null && context.nicheSlugs.includes(slug) ? slug : null;

  const nicheParam = first(params.nicho);
  const nicheSlug =
    nicheParam === ALL
      ? null
      : (selectable(nicheParam ?? null) ?? selectable(context.defaultNicheSlug));

  const ufParam = first(params.uf)?.toUpperCase();
  const uf = ufParam === ALL.toUpperCase() ? null : isUf(ufParam) ? ufParam : context.defaultUf;

  const sortParam = first(params.ordem);
  const requestedSort = TENDER_SORTS.find((sort) => sort === sortParam);
  // "Aderência" só existe quando há um nicho; sem ele, o prazo é a ordem mais útil.
  const sort =
    requestedSort && (requestedSort !== 'relevancia' || nicheSlug)
      ? requestedSort
      : nicheSlug
        ? 'relevancia'
        : 'prazo';

  return {
    q: first(params.q)?.trim().slice(0, MAX_QUERY_LENGTH) || undefined,
    nicheSlug,
    uf,
    modalityId: positiveInt(first(params.modalidade), 999),
    sort,
    page: positiveInt(first(params.pagina), MAX_PAGE) ?? 1,
  };
}

/**
 * Query string que reproduz os filtros (com alterações opcionais), usada na paginação e nos atalhos.
 * Nicho e estado vão sempre explícitos para que o link não dependa dos padrões do perfil.
 */
export function tenderFiltersQuery(
  filters: TenderFilters,
  changes: Partial<TenderFilters> = {},
): string {
  const next = { ...filters, ...changes };
  const params = new URLSearchParams();
  if (next.q) params.set('q', next.q);
  params.set('nicho', next.nicheSlug ?? ALL);
  params.set('uf', next.uf ?? ALL);
  if (next.modalityId) params.set('modalidade', String(next.modalityId));
  params.set('ordem', next.sort);
  if (next.page > 1) params.set('pagina', String(next.page));
  return params.toString();
}
