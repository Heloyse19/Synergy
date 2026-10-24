import type { Metadata } from 'next';
import Link from 'next/link';
import { Rocket, Search, Sparkles } from 'lucide-react';
import { requireUser } from '@/lib/auth/dal';
import { listNiches } from '@/lib/data/niches';
import { listInvestorInterestNicheIds } from '@/lib/data/investors';
import { listStartups } from '@/lib/data/startups';
import {
  parseStartupFilters,
  hasStartupFilters,
  type StartupSearchParams,
} from '@/lib/startup-filters';
import { startupStageLabels, toOptions } from '@/lib/labels';
import { StartupCard } from '@/components/startups/startup-card';
import { Button, buttonVariants } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input, Select } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';

export const metadata: Metadata = { title: 'Explorar startups' };

type Props = { searchParams: Promise<StartupSearchParams> };

export default async function AppStartupsPage({ searchParams }: Props) {
  const [user, params] = await Promise.all([requireUser('/app/startups'), searchParams]);
  const filters = parseStartupFilters(params);
  const isInvestor = user.role === 'INVESTOR' && Boolean(user.investor);

  // "Dar match" resolvido em ids reais de nicho; os interesses também destacam cards da listagem comum.
  const investorId = isInvestor ? (user.investor?.id ?? null) : null;
  const matchNicheIds = investorId ? await listInvestorInterestNicheIds(investorId) : [];
  const listingFilters =
    filters.mine && isInvestor ? { ...filters, nicheIds: matchNicheIds } : filters;

  const [rawStartups, niches] = await Promise.all([listStartups(listingFilters), listNiches()]);
  const matchSet = new Set(matchNicheIds);
  // Matched primeiro; a ordem relativa (nome) permanece entre os grupos.
  const startups = [...rawStartups].sort((a, b) => {
    const aMatch = a.niche ? matchSet.has(a.niche.id) : false;
    const bMatch = b.niche ? matchSet.has(b.niche.id) : false;
    if (aMatch !== bMatch) return aMatch ? -1 : 1;
    return 0;
  });
  const hasFilters = hasStartupFilters(listingFilters);
  const matchActive = Boolean(filters.mine) && isInvestor;

  const matchSearchParams = new URLSearchParams();
  if (params.q) matchSearchParams.set('q', params.q);
  if (params.categoria) matchSearchParams.set('categoria', params.categoria);
  if (params.estagio) matchSearchParams.set('estagio', params.estagio);
  if (!matchActive) matchSearchParams.set('minhas', '1');
  const matchQuery = matchSearchParams.toString();

  const description =
    user.role === 'INVESTOR'
      ? 'Descubra as startups cadastradas no ecossistema por categoria e estágio.'
      : 'Conheça as startups cadastradas no ecossistema por categoria e estágio.';

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Descobrir" title="Explorar startups" description={description} />

      <div className="space-y-6">
        <form
          method="get"
          action="/app/startups"
          className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_180px_180px_auto]"
        >
          <label className="sr-only" htmlFor="q">
            Buscar
          </label>
          <Input
            id="q"
            name="q"
            placeholder="Buscar por nome ou pitch da startup"
            defaultValue={filters.q ?? ''}
          />
          <Select name="categoria" defaultValue={filters.nicheId ?? ''} aria-label="Categoria">
            <option value="">Todas as categorias</option>
            {niches.map((niche) => (
              <option key={niche.id} value={niche.id}>
                {niche.name}
              </option>
            ))}
          </Select>
          <Select name="estagio" defaultValue={filters.stage ?? ''} aria-label="Estágio">
            <option value="">Todos os estágios</option>
            {toOptions(startupStageLabels).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              <Search className="size-4" aria-hidden />
              Filtrar
            </Button>
            {hasFilters ? (
              <Link href="/app/startups" className={buttonVariants({ variant: 'ghost' })}>
                Limpar
              </Link>
            ) : null}
          </div>
        </form>

        {isInvestor && matchNicheIds.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Link
              href={matchQuery ? `/app/startups?${matchQuery}` : '/app/startups'}
              className={buttonVariants({
                variant: matchActive ? 'secondary' : 'outline',
                size: 'sm',
              })}
            >
              <Sparkles className="size-4" aria-hidden />
              Dar match
            </Link>
            <span className="text-xs text-slate-500">
              Sua tese cobre {matchNicheIds.length}{' '}
              {matchNicheIds.length === 1 ? 'categoria' : 'categorias'}.
            </span>
          </div>
        ) : null}

        {startups.length === 0 ? (
          <EmptyState
            icon={Rocket}
            title={hasFilters ? 'Nenhuma startup encontrada' : 'Nenhuma startup cadastrada ainda'}
            description={
              hasFilters
                ? 'Tente outros termos ou limpe os filtros.'
                : 'Quando startups se cadastrarem, elas aparecerão aqui para você explorar.'
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {startups.map((startup) => (
              <StartupCard
                key={startup.id}
                startup={startup}
                highlighted={startup.niche ? matchSet.has(startup.niche.id) : false}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
