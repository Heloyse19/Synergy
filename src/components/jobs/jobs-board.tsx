import { BriefcaseBusiness, Search } from 'lucide-react';
import { JobType, WorkMode } from '@/generated/prisma/enums';
import { listActiveJobs, type JobFilters } from '@/lib/data/jobs';
import { jobTypeLabels, toOptions, workModeLabels } from '@/lib/labels';
import { Button, buttonVariants } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input, Select } from '@/components/ui/input';
import { JobCard } from './job-card';
import Link from 'next/link';

export type JobSearchParams = { q?: string; tipo?: string; modelo?: string };

function isEnumValue<T extends Record<string, string>>(
  obj: T,
  value: string | undefined,
): value is T[keyof T] {
  return value !== undefined && Object.values(obj).includes(value);
}

export function parseJobFilters(params: JobSearchParams): JobFilters {
  return {
    q: params.q?.trim().slice(0, 80) || undefined,
    type: isEnumValue(JobType, params.tipo) ? params.tipo : undefined,
    workMode: isEnumValue(WorkMode, params.modelo) ? params.modelo : undefined,
  };
}

/** Mural de vagas com filtros — compartilhado entre /vagas e /app/vagas. */
export async function JobsBoard({
  params,
  basePath,
}: {
  params: JobSearchParams;
  basePath: string;
}) {
  const filters = parseJobFilters(params);
  const jobs = await listActiveJobs(filters);
  const hasFilters = Boolean(filters.q || filters.type || filters.workMode);

  return (
    <div className="space-y-6">
      <form
        data-testid="jobs-filters-form"
        method="get"
        action={basePath}
        className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_180px_180px_auto]"
      >
        <label className="sr-only" htmlFor="q">
          Buscar
        </label>
        <Input
          id="q"
          data-testid="jobs-search"
          name="q"
          placeholder="Buscar por cargo, habilidade ou startup"
          defaultValue={filters.q ?? ''}
        />
        <Select
          data-testid="jobs-type-filter"
          name="tipo"
          defaultValue={filters.type ?? ''}
          aria-label="Tipo de contratação"
        >
          <option value="">Todos os tipos</option>
          {toOptions(jobTypeLabels).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <Select
          data-testid="jobs-work-mode-filter"
          name="modelo"
          defaultValue={filters.workMode ?? ''}
          aria-label="Modelo de trabalho"
        >
          <option value="">Todos os modelos</option>
          {toOptions(workModeLabels).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <div className="flex gap-2">
          <Button data-testid="jobs-filter-submit" type="submit" className="flex-1">
            <Search className="size-4" aria-hidden />
            Filtrar
          </Button>
          {hasFilters ? (
            <Link
              data-testid="jobs-clear-filters"
              href={basePath}
              className={buttonVariants({ variant: 'ghost' })}
            >
              Limpar
            </Link>
          ) : null}
        </div>
      </form>

      {jobs.length === 0 ? (
        <EmptyState
          icon={BriefcaseBusiness}
          title={hasFilters ? 'Nenhuma vaga encontrada' : 'Nenhuma vaga publicada ainda'}
          description={
            hasFilters
              ? 'Tente outros termos ou limpe os filtros.'
              : 'As startups cadastradas podem publicar vagas fixas e oportunidades freelancer.'
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
