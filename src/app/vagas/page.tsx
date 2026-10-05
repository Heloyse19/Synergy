import type { Metadata } from 'next';
import { JobsBoard, type JobSearchParams } from '@/components/jobs/jobs-board';
import { Container } from '@/components/ui/container';
import { PageHeader } from '@/components/ui/page-header';

export const metadata: Metadata = { title: 'Vagas' };
export const dynamic = 'force-dynamic';

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<JobSearchParams>;
}) {
  const params = await searchParams;

  return (
    <Container className="space-y-8 py-10">
      <PageHeader
        eyebrow="Mural"
        title="Vagas em startups"
        description="Oportunidades fixas (CLT, PJ, estágio) e projetos freelancer publicados pelas startups do ecossistema."
      />
      <JobsBoard params={params} basePath="/vagas" />
    </Container>
  );
}
