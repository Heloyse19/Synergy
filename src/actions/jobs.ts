'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, type CurrentUser } from '@/lib/auth/dal';
import { jobSchema } from '@/lib/validations/jobs';
import { errorState, formValues, validationError, type ActionState } from '@/lib/action-state';

const JOB_FIELDS = [
  'title',
  'description',
  'type',
  'workMode',
  'location',
  'salaryRange',
  'skills',
  'isActive',
];

/** Busca a vaga garantindo que pertence à startup do usuário (ADMIN pode moderar qualquer vaga). */
async function findOwnedJob(jobId: string, user: CurrentUser) {
  return prisma.jobPosting.findFirst({
    where: {
      id: jobId,
      ...(user.role === 'ADMIN' ? {} : { startupId: user.startup?.id ?? '__sem_startup__' }),
    },
    select: { id: true, isActive: true },
  });
}

function revalidateJobs(jobId?: string) {
  revalidatePath('/vagas');
  revalidatePath('/app/vagas');
  revalidatePath('/app');
  if (jobId) revalidatePath(`/vagas/${jobId}`);
}

export async function createJob(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return errorState('Faça login para publicar vagas.');
  if (!user.startup) return errorState('Apenas contas de startup podem publicar vagas.');

  const values = formValues(formData, JOB_FIELDS);
  const parsed = jobSchema.safeParse(
    Object.fromEntries(JOB_FIELDS.map((f) => [f, formData.get(f)])),
  );
  if (!parsed.success) return validationError(parsed.error, values);

  const job = await prisma.jobPosting.create({
    data: { ...parsed.data, startupId: user.startup.id },
    select: { id: true },
  });

  revalidateJobs(job.id);
  redirect(`/vagas/${job.id}?publicada=1`);
}

export async function updateJob(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return errorState('Faça login para editar vagas.');

  const jobId = String(formData.get('jobId') ?? '');
  const job = await findOwnedJob(jobId, user);
  if (!job) return errorState('Vaga não encontrada ou sem permissão para editar.');

  const values = formValues(formData, JOB_FIELDS);
  const parsed = jobSchema.safeParse(
    Object.fromEntries(JOB_FIELDS.map((f) => [f, formData.get(f)])),
  );
  if (!parsed.success) return validationError(parsed.error, values);

  await prisma.jobPosting.update({ where: { id: job.id }, data: parsed.data });

  revalidateJobs(job.id);
  redirect(`/vagas/${job.id}?atualizada=1`);
}

export async function toggleJobActive(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/app/vagas');

  const jobId = String(formData.get('jobId') ?? '');
  const job = await findOwnedJob(jobId, user);
  if (!job) redirect('/app/vagas?erro=nao-encontrada');

  await prisma.jobPosting.update({ where: { id: job.id }, data: { isActive: !job.isActive } });
  revalidateJobs(job.id);
}

export async function deleteJob(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/app/vagas');

  const jobId = String(formData.get('jobId') ?? '');
  const job = await findOwnedJob(jobId, user);
  if (!job) redirect('/app/vagas?erro=nao-encontrada');

  await prisma.jobPosting.delete({ where: { id: job.id } });
  revalidateJobs(job.id);
  redirect('/app/vagas?excluida=1');
}
