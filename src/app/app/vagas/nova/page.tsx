import type { Metadata } from 'next';
import { createJob } from '@/actions/jobs';
import { requireRole } from '@/lib/auth/dal';
import { JobForm } from '@/components/jobs/job-form';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';

export const metadata: Metadata = { title: 'Publicar vaga' };

export default async function NewJobPage() {
  await requireRole(['STARTUP'], '/app/vagas/nova');

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Minhas vagas"
        title="Publicar vaga"
        description="Descreva a oportunidade com clareza para atrair os profissionais certos."
      />
      <Card className="max-w-3xl">
        <CardContent className="p-6">
          <JobForm action={createJob} submitLabel="Publicar vaga" />
        </CardContent>
      </Card>
    </div>
  );
}
