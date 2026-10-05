import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { updateJob } from '@/actions/jobs';
import { requireUser } from '@/lib/auth/dal';
import { prisma } from '@/lib/prisma';
import { JobForm } from '@/components/jobs/job-form';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';

export const metadata: Metadata = { title: 'Editar vaga' };

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, user] = await Promise.all([params, requireUser('/app/vagas')]);

  const job = await prisma.jobPosting.findFirst({
    where: {
      id,
      ...(user.role === 'ADMIN' ? {} : { startupId: user.startup?.id ?? '__sem_startup__' }),
    },
    select: {
      id: true,
      title: true,
      description: true,
      type: true,
      workMode: true,
      location: true,
      salaryRange: true,
      skills: true,
      isActive: true,
    },
  });
  if (!job) notFound();

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Minhas vagas" title="Editar vaga" description={job.title} />
      <Card className="max-w-3xl">
        <CardContent className="p-6">
          <JobForm action={updateJob} jobId={job.id} job={job} submitLabel="Salvar alterações" />
        </CardContent>
      </Card>
    </div>
  );
}
