import 'server-only';
import { prisma } from '@/lib/prisma';

export async function listRoadmapSteps() {
  return prisma.roadmapStep.findMany({ orderBy: { order: 'asc' } });
}

export type RoadmapStepItem = Awaited<ReturnType<typeof listRoadmapSteps>>[number];

/** IDs dos passos concluídos pela startup. */
export async function getCompletedStepIds(startupId: string): Promise<Set<number>> {
  const rows = await prisma.roadmapProgress.findMany({
    where: { startupId },
    select: { stepId: true },
  });
  return new Set(rows.map((row) => row.stepId));
}

/** Agrupa os passos por fase preservando a ordem. */
export function groupStepsByPhase<T extends { phase: string }>(
  steps: T[],
): Array<{ phase: string; steps: T[] }> {
  const groups = new Map<string, T[]>();
  for (const step of steps) {
    const list = groups.get(step.phase) ?? [];
    list.push(step);
    groups.set(step.phase, list);
  }
  return Array.from(groups, ([phase, items]) => ({ phase, steps: items }));
}
