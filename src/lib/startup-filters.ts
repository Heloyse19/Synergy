import { StartupStage } from '@/generated/prisma/enums';
import type { StartupFilters } from '@/lib/data/startups';

export type StartupSearchParams = {
  q?: string;
  categoria?: string;
  estagio?: string;
  minhas?: string;
};

const startupStageValues = new Set<string>(Object.values(StartupStage));

function isStartupStage(value: string | undefined): value is StartupStage {
  return value !== undefined && startupStageValues.has(value);
}

function parseNicheId(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

/** Converte os searchParams da página em filtros de consulta, ignorando valores inválidos. */
export function parseStartupFilters(params: StartupSearchParams): StartupFilters {
  return {
    q: params.q?.trim().slice(0, 80) || undefined,
    nicheId: parseNicheId(params.categoria),
    stage: isStartupStage(params.estagio) ? params.estagio : undefined,
    mine: params.minhas === '1' ? true : undefined,
  };
}

export function hasStartupFilters(filters: StartupFilters): boolean {
  return Boolean(filters.q || filters.nicheId || filters.stage || filters.mine);
}
