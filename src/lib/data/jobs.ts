import 'server-only';
import type { JobType, WorkMode } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';

const jobListSelect = {
  id: true,
  title: true,
  type: true,
  workMode: true,
  location: true,
  salaryRange: true,
  skills: true,
  isActive: true,
  createdAt: true,
  startup: {
    select: { id: true, name: true, city: true, niche: { select: { name: true } } },
  },
} as const;

export type JobFilters = {
  q?: string;
  type?: JobType;
  workMode?: WorkMode;
  limit?: number;
};

/** Mural público: apenas vagas ativas, mais recentes primeiro. */
export async function listActiveJobs(filters: JobFilters = {}) {
  const { q, type, workMode, limit } = filters;
  return prisma.jobPosting.findMany({
    where: {
      isActive: true,
      ...(type ? { type } : {}),
      ...(workMode ? { workMode } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q } },
              { skills: { contains: q } },
              { startup: { name: { contains: q } } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: jobListSelect,
  });
}

export type JobListItem = Awaited<ReturnType<typeof listActiveJobs>>[number];

export async function getJobById(id: string) {
  return prisma.jobPosting.findUnique({
    where: { id },
    include: {
      startup: {
        select: {
          id: true,
          name: true,
          pitch: true,
          city: true,
          website: true,
          stage: true,
          niche: { select: { name: true } },
          user: { select: { id: true } },
        },
      },
    },
  });
}

export type JobDetail = NonNullable<Awaited<ReturnType<typeof getJobById>>>;

/** Todas as vagas de uma startup (inclui inativas) para a área de gestão. */
export async function listJobsByStartup(startupId: string) {
  return prisma.jobPosting.findMany({
    where: { startupId },
    orderBy: { createdAt: 'desc' },
    select: jobListSelect,
  });
}
