import type { Metadata } from 'next';
import Link from 'next/link';
import { BriefcaseBusiness, Plus } from 'lucide-react';
import { requireUser } from '@/lib/auth/dal';
import { listJobsByStartup } from '@/lib/data/jobs';
import { JobCard } from '@/components/jobs/job-card';
import { JobManageActions } from '@/components/jobs/job-manage-actions';
import { JobsBoard, type JobSearchParams } from '@/components/jobs/jobs-board';
import { Alert } from '@/components/ui/alert';
import { buttonVariants } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';

export const metadata: Metadata = { title: 'Vagas' };

type Props = { searchParams: Promise<JobSearchParams & { excluida?: string; erro?: string }> };

export default async function AppJobsPage({ searchParams }: Props) {
  const [user, params] = await Promise.all([requireUser('/app/vagas'), searchParams]);

  // Startups gerenciam as próprias vagas; demais perfis veem o mural.
  if (user.startup) {
    const jobs = await listJobsByStartup(user.startup.id);
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Minhas vagas"
          title={user.startup.name}
          description="Publique, edite, ative/desative e exclua as vagas da sua startup."
          actions={
            <Link href="/app/vagas/nova" className={buttonVariants()}>
              <Plus className="size-4" aria-hidden />
              Publicar vaga
            </Link>
          }
        />
        {params.excluida ? <Alert variant="success">Vaga excluída.</Alert> : null}
        {params.erro ? <Alert variant="error">Vaga não encontrada ou sem permissão.</Alert> : null}

        {jobs.length === 0 ? (
          <EmptyState
            icon={BriefcaseBusiness}
            title="Você ainda não publicou vagas"
            description="Divulgue vagas fixas ou oportunidades freelancer para a comunidade de profissionais."
            action={
              <Link href="/app/vagas/nova" className={buttonVariants()}>
                Publicar primeira vaga
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                actions={<JobManageActions jobId={job.id} isActive={job.isActive} />}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Mural"
        title="Vagas em startups"
        description="Oportunidades fixas e projetos freelancer publicados pelas startups do ecossistema."
      />
      <JobsBoard params={params} basePath="/app/vagas" />
    </div>
  );
}
