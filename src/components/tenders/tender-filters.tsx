import Link from 'next/link';
import { Search } from 'lucide-react';
import {
  ALL,
  TENDER_SORTS,
  tenderSortLabels,
  type TenderFilters as Filters,
} from '@/lib/tenders/filters';
import { UF_NAMES, UFS, type Uf } from '@/lib/tenders/states';
import { Button, buttonVariants } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input, Select } from '@/components/ui/input';

type TenderFiltersProps = {
  filters: Filters;
  niches: Array<{ slug: string; name: string }>;
  ownNicheSlug: string | null;
  modalities: Array<{ id: number; name: string; count: number }>;
  /** Estados que já têm licitações sincronizadas. */
  syncedUfs: Uf[];
};

/** Filtros da página de licitações. Envia por GET para que a busca fique na URL. */
export function TenderFilters({
  filters,
  niches,
  ownNicheSlug,
  modalities,
  syncedUfs,
}: TenderFiltersProps) {
  const otherUfs = UFS.filter((uf) => !syncedUfs.includes(uf));
  const ufOption = (uf: Uf) => (
    <option key={uf} value={uf}>
      {UF_NAMES[uf]} ({uf})
    </option>
  );

  return (
    <form
      data-testid="tenders-filters-form"
      method="get"
      action="/app/licitacoes"
      className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <Field label="Palavra-chave" htmlFor="q" className="sm:col-span-2 lg:col-span-4">
        <Input
          id="q"
          data-testid="tenders-search"
          name="q"
          placeholder="Buscar no objeto, órgão ou cidade"
          defaultValue={filters.q ?? ''}
          maxLength={80}
        />
      </Field>

      <Field label="Nicho" htmlFor="nicho">
        <Select
          id="nicho"
          data-testid="tenders-niche-filter"
          name="nicho"
          defaultValue={filters.nicheSlug ?? ALL}
        >
          <option value={ALL}>Todas as licitações</option>
          {niches.map((niche) => (
            <option key={niche.slug} value={niche.slug}>
              {niche.name}
              {niche.slug === ownNicheSlug ? ' (seu nicho)' : ''}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Estado" htmlFor="uf">
        <Select id="uf" data-testid="tenders-uf-filter" name="uf" defaultValue={filters.uf ?? ALL}>
          <option value={ALL}>Todos os sincronizados</option>
          {syncedUfs.length > 0 ? (
            <optgroup label="Já sincronizados">{syncedUfs.map(ufOption)}</optgroup>
          ) : null}
          <optgroup label="Ainda não sincronizados">{otherUfs.map(ufOption)}</optgroup>
        </Select>
      </Field>

      <Field label="Modalidade" htmlFor="modalidade">
        <Select
          id="modalidade"
          data-testid="tenders-modality-filter"
          name="modalidade"
          defaultValue={filters.modalityId?.toString() ?? ''}
        >
          <option value="">Todas as modalidades</option>
          {modalities.map((modality) => (
            <option key={modality.id} value={modality.id}>
              {modality.name} ({modality.count})
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Ordenar por" htmlFor="ordem">
        <Select
          id="ordem"
          data-testid="tenders-sort-filter"
          name="ordem"
          defaultValue={filters.sort}
        >
          {TENDER_SORTS.map((sort) => (
            <option key={sort} value={sort}>
              {tenderSortLabels[sort]}
            </option>
          ))}
        </Select>
      </Field>

      <div className="flex gap-2 sm:col-span-2 lg:col-span-4">
        <Button data-testid="tenders-filter-submit" type="submit">
          <Search className="size-4" aria-hidden />
          Filtrar
        </Button>
        <Link
          data-testid="tenders-clear-filters"
          href="/app/licitacoes"
          className={buttonVariants({ variant: 'ghost' })}
        >
          Limpar filtros
        </Link>
      </div>
    </form>
  );
}
