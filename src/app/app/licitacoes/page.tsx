import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Landmark } from 'lucide-react';
import { requireRole } from '@/lib/auth/dal';
import { listNiches } from '@/lib/data/niches';
import {
  listTenderModalities,
  listTenderSyncs,
  searchTenders,
  type TenderSyncItem,
} from '@/lib/data/tenders';
import { formatRelative } from '@/lib/format';
import {
  parseTenderFilters,
  tenderFiltersQuery,
  type TenderSearchParams,
} from '@/lib/tenders/filters';
import { NICHE_TENDER_TERMS, getTenderMatcher } from '@/lib/tenders/niches';
import { UF_NAMES, inState, isUf, ofState, ufFromCity } from '@/lib/tenders/states';
import { isSyncRunning, syncAvailability } from '@/lib/tenders/sync-policy';
import { TenderCard } from '@/components/tenders/tender-card';
import { TenderFilters } from '@/components/tenders/tender-filters';
import { TenderSyncPanel, type TenderSyncView } from '@/components/tenders/tender-sync-panel';
import { Alert } from '@/components/ui/alert';
import { buttonVariants } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';

export const metadata: Metadata = { title: 'Licitações' };

type Props = { searchParams: Promise<TenderSearchParams> };

function toSyncView(sync: TenderSyncItem | undefined, now: Date): TenderSyncView {
  if (!sync) return { kind: 'never' };
  if (isSyncRunning(sync, now)) {
    return { kind: 'running', pagesDone: sync.pagesDone, totalPages: sync.totalPages };
  }
  const updatedLabel = sync.completedAt ? formatRelative(sync.completedAt, now) : null;
  if (sync.status === 'SUCCEEDED' && updatedLabel) {
    return {
      kind: 'ready',
      tenderCount: sync.tenderCount,
      updatedLabel,
      canRefresh: syncAvailability(sync, now) === 'available',
    };
  }
  return {
    kind: 'failed',
    // RUNNING sem sinal de vida: o servidor reiniciou no meio da busca.
    error: sync.status === 'FAILED' && sync.error ? sync.error : 'a busca foi interrompida.',
    updatedLabel,
  };
}

export default async function TendersPage({ searchParams }: Props) {
  const [user, params, niches, syncs] = await Promise.all([
    requireRole(['STARTUP'], '/app/licitacoes'),
    searchParams,
    listNiches(),
    listTenderSyncs(),
  ]);
  const now = new Date();

  // Só nichos com termos de busca definidos podem filtrar as licitações.
  const selectableNiches = niches.filter((niche) => getTenderMatcher(niche.slug) !== null);
  const ownNiche = niches.find((niche) => niche.id === user.startup?.nicheId) ?? null;
  const ownUf = ufFromCity(user.startup?.city);

  const filters = parseTenderFilters(params, {
    defaultNicheSlug: ownNiche?.slug ?? null,
    defaultUf: ownUf,
    nicheSlugs: selectableNiches.map((niche) => niche.slug),
  });
  const niche = selectableNiches.find((item) => item.slug === filters.nicheSlug) ?? null;

  const [result, modalities] = await Promise.all([
    searchTenders(filters, now),
    listTenderModalities(filters.uf, now),
  ]);

  const syncedUfs = syncs.map((sync) => sync.uf).filter(isUf);
  const hasTendersInScope = modalities.length > 0;
  const pageHref = (page: number) => `/app/licitacoes?${tenderFiltersQuery(filters, { page })}`;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Oportunidades"
        title={niche ? `Licitações para ${niche.name}` : 'Licitações abertas'}
        description="Editais com propostas abertas no Portal Nacional de Contratações Públicas (PNCP). Contratos públicos são receita — e receita pesa na decisão de quem investe."
      />

      {user.startup && !ownNiche ? (
        <Alert variant="info">
          Defina o nicho da sua startup para ver primeiro as licitações mais aderentes.{' '}
          <Link
            data-testid="tenders-profile-link"
            href="/app/perfil"
            className="font-medium underline"
          >
            Editar perfil
          </Link>
        </Alert>
      ) : null}

      <TenderFilters
        filters={filters}
        niches={selectableNiches}
        ownNicheSlug={ownNiche?.slug ?? null}
        modalities={modalities}
        syncedUfs={syncedUfs}
      />

      {filters.uf ? (
        <TenderSyncPanel
          uf={filters.uf}
          view={toSyncView(
            syncs.find((sync) => sync.uf === filters.uf),
            now,
          )}
        />
      ) : syncedUfs.length > 0 ? (
        <p className="text-sm text-slate-600" data-testid="tenders-synced-states">
          Estados sincronizados: {syncedUfs.map((uf) => UF_NAMES[uf]).join(', ')}. Escolha um estado
          no filtro para atualizá-lo ou para buscar as licitações de outro.
          {user.startup && !ownUf
            ? ' Para abrir direto no seu estado, informe a cidade no perfil como "Cidade/UF".'
            : ''}
        </p>
      ) : (
        <EmptyState
          icon={Landmark}
          title="Nenhum estado sincronizado ainda"
          description='Escolha um estado no filtro acima e clique em "Filtrar" para buscar as licitações dele no PNCP.'
        />
      )}

      {niche ? (
        <details className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          <summary className="cursor-pointer font-medium text-slate-900">
            Como escolhemos as licitações de {niche.name}?
          </summary>
          <div className="mt-3 space-y-2">
            <p>
              Procuramos no objeto de cada edital as expressões abaixo. Também entram os editais que
              contratam uma solução de tecnologia (software, plataforma, aplicativo...) e citam o
              setor. É uma triagem por palavras: confira o edital antes de decidir participar.
            </p>
            <ul className="flex flex-wrap gap-1.5" aria-label={`Expressões de ${niche.name}`}>
              {NICHE_TENDER_TERMS[niche.slug]?.specific.map((term) => (
                <li
                  key={term}
                  className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                >
                  {term}
                </li>
              ))}
            </ul>
          </div>
        </details>
      ) : null}

      {result.total > 0 ? (
        <section className="space-y-4" aria-label="Licitações encontradas">
          <p className="text-sm text-slate-600" data-testid="tenders-result-count">
            <span className="font-semibold text-slate-900">
              {result.total.toLocaleString('pt-BR')}
              {result.truncated ? '+' : ''}
            </span>{' '}
            {result.total === 1 ? 'licitação aberta' : 'licitações abertas'}
            {niche ? ` com aderência a ${niche.name}` : ''}
            {filters.uf ? ` ${inState(filters.uf)}` : ''}
            {filters.q ? ` para "${filters.q}"` : ''}.
          </p>

          <div className="grid gap-4 lg:grid-cols-2">
            {result.items.map((tender) => (
              <TenderCard key={tender.id} tender={tender} now={now} />
            ))}
          </div>

          {result.pageCount > 1 ? (
            <nav
              className="flex items-center justify-between gap-3"
              aria-label="Paginação das licitações"
            >
              {result.page > 1 ? (
                <Link
                  data-testid="tenders-previous-page"
                  href={pageHref(result.page - 1)}
                  className={buttonVariants({ variant: 'outline', size: 'sm' })}
                >
                  <ChevronLeft className="size-4" aria-hidden />
                  Anterior
                </Link>
              ) : (
                <span />
              )}
              <span className="text-sm text-slate-600">
                Página {result.page} de {result.pageCount}
              </span>
              {result.page < result.pageCount ? (
                <Link
                  data-testid="tenders-next-page"
                  href={pageHref(result.page + 1)}
                  className={buttonVariants({ variant: 'outline', size: 'sm' })}
                >
                  Próxima
                  <ChevronRight className="size-4" aria-hidden />
                </Link>
              ) : (
                <span />
              )}
            </nav>
          ) : null}
        </section>
      ) : hasTendersInScope ? (
        <EmptyState
          icon={Landmark}
          title="Nenhuma licitação encontrada"
          description={
            niche
              ? `Nenhum edital aberto${filters.uf ? ` ${inState(filters.uf)}` : ''} casa com os termos de ${niche.name} e os filtros escolhidos.`
              : 'Tente outros termos ou limpe os filtros.'
          }
          action={
            niche ? (
              <Link
                data-testid="tenders-show-all"
                href={`/app/licitacoes?${tenderFiltersQuery(filters, { nicheSlug: null, sort: 'prazo', page: 1 })}`}
                className={buttonVariants({ variant: 'outline' })}
              >
                Ver todas as licitações{filters.uf ? ` ${ofState(filters.uf)}` : ''}
              </Link>
            ) : undefined
          }
        />
      ) : null}
    </div>
  );
}
