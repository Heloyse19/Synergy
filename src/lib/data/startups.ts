import 'server-only';
import type { StartupStage } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';

const startupListSelect = {
  id: true,
  name: true,
  pitch: true,
  city: true,
  stage: true,
  website: true,
  niche: { select: { id: true, name: true } },
} as const;

export type StartupFilters = {
  q?: string;
  nicheId?: number;
  nicheIds?: number[];
  stage?: StartupStage;
  /** "Dar match": restringe às categorias seguidas pelo investidor (resolvido antes da consulta). */
  mine?: boolean;
};

/** Diretório de startups visível a quem está logado, filtrável por categoria e estágio. */
export async function listStartups(filters: StartupFilters = {}) {
  const { q, nicheId, nicheIds, stage } = filters;
  return prisma.startupProfile.findMany({
    where: {
      ...(nicheId ? { nicheId } : {}),
      ...(nicheIds ? { nicheId: { in: nicheIds } } : {}),
      ...(stage ? { stage } : {}),
      ...(q
        ? {
            OR: [{ name: { contains: q } }, { pitch: { contains: q } }],
          }
        : {}),
    },
    orderBy: { name: 'asc' },
    select: startupListSelect,
  });
}

export type StartupListItem = Awaited<ReturnType<typeof listStartups>>[number];

export async function getStartupById(id: string) {
  return prisma.startupProfile.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      pitch: true,
      description: true,
      city: true,
      stage: true,
      website: true,
      niche: { select: { id: true, name: true } },
    },
  });
}

export type StartupDetail = NonNullable<Awaited<ReturnType<typeof getStartupById>>>;
