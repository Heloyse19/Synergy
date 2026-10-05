'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth/dal';
import { hasPremium } from '@/lib/plan';

/** Marca/desmarca um passo do roadmap burocrático para a startup do usuário. */
export async function toggleRoadmapStep(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/app/roadmap');
  if (!hasPremium(user)) redirect('/app/premium?bloqueado=1');
  if (!user.startup) redirect('/app/roadmap');

  const stepId = Number(formData.get('stepId'));
  if (!Number.isInteger(stepId)) redirect('/app/roadmap');

  const startupId = user.startup.id;
  const existing = await prisma.roadmapProgress.findUnique({
    where: { startupId_stepId: { startupId, stepId } },
    select: { id: true },
  });

  if (existing) {
    await prisma.roadmapProgress.delete({ where: { id: existing.id } });
  } else {
    const step = await prisma.roadmapStep.findUnique({
      where: { id: stepId },
      select: { id: true },
    });
    if (step) await prisma.roadmapProgress.create({ data: { startupId, stepId } });
  }

  revalidatePath('/app/roadmap');
}
