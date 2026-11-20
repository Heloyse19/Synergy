import 'server-only';
import type { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import type { TenderFilters } from '@/lib/tenders/filters';
import {
  getTenderMatcher,
  matchTender,
  type TenderMatch,
  type TenderMatcher,
} from '@/lib/tenders/niches';
import { ufFromCity, type Uf } from '@/lib/tenders/states';
import { tokenize } from '@/lib/tenders/text';

export const TENDERS_PAGE_SIZE = 10;

/** Teto de licitações avaliadas em memória ao ordenar por aderência ao nicho. */
const MAX_NICHE_CANDIDATES = 5000;
const MAX_QUERY_TOKENS = 6;

const tenderListSelect = {
  id: true,
  pncpId: true,
  object: true,
  agencyName: true,
  unitName: true,
  city: true,
  uf: true,
  modalityName: true,
  number: true,
  estimatedValue: true,
  isPriceRegistration: true,
  closesAt: true,
  publishedAt: true,
  sourceUrl: true,
} as const;

type TenderRow = Prisma.TenderGetPayload<{ select: typeof tenderListSelect }>;

export type TenderListItem = Omit<TenderRow, 'estimatedValue'> & {
  estimatedValue: number | null;
  /** Aderência ao nicho pesquisado; `null` quando a listagem não filtra por nicho. */
  match: TenderMatch | null;
};

export type TenderSearchResult = {
  items: TenderListItem[];
  total: number;
  page: number;
  pageCount: number;
  /** A busca por nicho atingiu o teto de candidatas: pode haver mais resultados do que os contados. */
  truncated: boolean;
};

function toListItem(row: TenderRow, match: TenderMatch | null): TenderListItem {
  return { ...row, estimatedValue: row.estimatedValue?.toNumber() ?? null, match };
}

/** Cada palavra digitada precisa iniciar alguma palavra do objeto; órgão e cidade também são pesquisados. */
function keywordWhere(q: string): Prisma.TenderWhereInput {
  const tokens = tokenize(q).slice(0, MAX_QUERY_TOKENS);
  return {
    OR: [
      ...(tokens.length > 0
        ? [{ AND: tokens.map((token) => ({ searchText: { contains: ` ${token}` } })) }]
        : []),
      { agencyName: { contains: q } },
      { city: { contains: q } },
    ],
  };
}

function baseWhere(filters: TenderFilters, now: Date): Prisma.TenderWhereInput {
  return {
    closesAt: { gt: now },
    ...(filters.uf ? { uf: filters.uf } : {}),
    ...(filters.modalityId ? { modalityId: filters.modalityId } : {}),
    ...(filters.q ? keywordWhere(filters.q) : {}),
  };
}

/** Pré-filtro no banco equivalente a `matchTender`: expressão específica OU (tecnologia E setor). */
function nicheWhere(matcher: TenderMatcher): Prisma.TenderWhereInput {
  const has = ({ term }: { term: string }) => ({ searchText: { contains: ` ${term} ` } });
  const conditions: Prisma.TenderWhereInput[] = matcher.specific.map(has);
  if (matcher.domain.length > 0) {
    conditions.push({ AND: [{ OR: matcher.tech.map(has) }, { OR: matcher.domain.map(has) }] });
  }
  return { OR: conditions };
}

type Candidate = {
  id: string;
  closesAt: Date;
  publishedAt: Date;
  estimatedValue: number | null;
  match: TenderMatch;
};

async function findNicheCandidates(
  where: Prisma.TenderWhereInput,
  matcher: TenderMatcher,
): Promise<{ candidates: Candidate[]; truncated: boolean }> {
  const rows = await prisma.tender.findMany({
    where: { AND: [where, nicheWhere(matcher)] },
    orderBy: { closesAt: 'asc' },
    take: MAX_NICHE_CANDIDATES,
    select: {
      id: true,
      searchText: true,
      closesAt: true,
      publishedAt: true,
      estimatedValue: true,
    },
  });
  const candidates: Candidate[] = [];
  for (const row of rows) {
    const match = matchTender(row.searchText, matcher);
    if (match) {
      candidates.push({
        id: row.id,
        closesAt: row.closesAt,
        publishedAt: row.publishedAt,
        estimatedValue: row.estimatedValue?.toNumber() ?? null,
        match,
      });
    }
  }
  return { candidates, truncated: rows.length === MAX_NICHE_CANDIDATES };
}

const byDeadline = (a: Candidate, b: Candidate) => a.closesAt.getTime() - b.closesAt.getTime();

const candidateSorters: Record<TenderFilters['sort'], (a: Candidate, b: Candidate) => number> = {
  relevancia: (a, b) => b.match.score - a.match.score || byDeadline(a, b),
  prazo: byDeadline,
  recentes: (a, b) => b.publishedAt.getTime() - a.publishedAt.getTime(),
  valor: (a, b) => (b.estimatedValue ?? -1) - (a.estimatedValue ?? -1) || byDeadline(a, b),
};

const databaseOrder: Record<TenderFilters['sort'], Prisma.TenderOrderByWithRelationInput[]> = {
  relevancia: [{ closesAt: 'asc' }],
  prazo: [{ closesAt: 'asc' }],
  recentes: [{ publishedAt: 'desc' }],
  // No MySQL, NULL fica por último em ordem decrescente.
  valor: [{ estimatedValue: 'desc' }, { closesAt: 'asc' }],
};

function paginate(total: number, requestedPage: number) {
  const pageCount = Math.max(1, Math.ceil(total / TENDERS_PAGE_SIZE));
  const page = Math.min(requestedPage, pageCount);
  return { page, pageCount, skip: (page - 1) * TENDERS_PAGE_SIZE };
}

/**
 * Licitações com propostas abertas. Com um nicho, só entram as que casam com os termos dele
 * (`match` explica o porquê) e a ordenação por aderência fica disponível.
 */
export async function searchTenders(
  filters: TenderFilters,
  now: Date = new Date(),
): Promise<TenderSearchResult> {
  const where = baseWhere(filters, now);
  const matcher = filters.nicheSlug ? getTenderMatcher(filters.nicheSlug) : null;

  if (!matcher) {
    const total = await prisma.tender.count({ where });
    const { page, pageCount, skip } = paginate(total, filters.page);
    const rows = await prisma.tender.findMany({
      where,
      orderBy: [...databaseOrder[filters.sort], { id: 'asc' }],
      skip,
      take: TENDERS_PAGE_SIZE,
      select: tenderListSelect,
    });
    return {
      items: rows.map((row) => toListItem(row, null)),
      total,
      page,
      pageCount,
      truncated: false,
    };
  }

  // A aderência é calculada em memória: buscamos só as colunas necessárias para pontuar e ordenar
  // todas as candidatas e, depois, os dados completos apenas da página exibida.
  const { candidates, truncated } = await findNicheCandidates(where, matcher);
  candidates.sort(candidateSorters[filters.sort]);
  const { page, pageCount, skip } = paginate(candidates.length, filters.page);
  const pageCandidates = candidates.slice(skip, skip + TENDERS_PAGE_SIZE);

  const rows = await prisma.tender.findMany({
    where: { id: { in: pageCandidates.map((candidate) => candidate.id) } },
    select: tenderListSelect,
  });
  const rowsById = new Map(rows.map((row) => [row.id, row]));
  const items = pageCandidates.flatMap((candidate) => {
    const row = rowsById.get(candidate.id);
    return row ? [toListItem(row, candidate.match)] : [];
  });

  return { items, total: candidates.length, page, pageCount, truncated };
}

/**
 * Resumo do painel: quantas licitações abertas casam com o nicho da startup, no mesmo recorte padrão
 * da página de licitações (estado da startup, quando a cidade do perfil informa a UF).
 */
export async function countTendersForStartup(
  startup: { nicheId: number | null; city: string | null },
  now: Date = new Date(),
): Promise<number> {
  if (!startup.nicheId) return 0;
  const niche = await prisma.niche.findUnique({
    where: { id: startup.nicheId },
    select: { slug: true },
  });
  const matcher = niche ? getTenderMatcher(niche.slug) : null;
  if (!matcher) return 0;
  const uf = ufFromCity(startup.city);
  const where: Prisma.TenderWhereInput = { closesAt: { gt: now }, ...(uf ? { uf } : {}) };
  const { candidates } = await findNicheCandidates(where, matcher);
  return candidates.length;
}

/** Modalidades presentes entre as licitações abertas, para o filtro. */
export async function listTenderModalities(uf: Uf | null, now: Date = new Date()) {
  const groups = await prisma.tender.groupBy({
    by: ['modalityId', 'modalityName'],
    where: { closesAt: { gt: now }, ...(uf ? { uf } : {}) },
    _count: { _all: true },
    orderBy: { modalityName: 'asc' },
  });
  return groups.map((group) => ({
    id: group.modalityId,
    name: group.modalityName,
    count: group._count._all,
  }));
}

/** Situação da sincronização de cada estado que já foi (ou está sendo) sincronizado. */
export async function listTenderSyncs() {
  return prisma.tenderSync.findMany({
    orderBy: { uf: 'asc' },
    select: {
      uf: true,
      status: true,
      heartbeatAt: true,
      completedAt: true,
      pagesDone: true,
      totalPages: true,
      tenderCount: true,
      error: true,
    },
  });
}

export type TenderSyncItem = Awaited<ReturnType<typeof listTenderSyncs>>[number];
