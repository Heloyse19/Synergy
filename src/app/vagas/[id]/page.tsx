import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Building2, Globe, MapPin, Wallet } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/dal';
import { getJobById } from '@/lib/data/jobs';
import { formatDateTime } from '@/lib/format';
import { jobTypeLabels, startupStageLabels, workModeLabels } from '@/lib/labels';
import { splitList } from '@/lib/utils';
import { JobManageActions } from '@/components/jobs/job-manage-actions';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/ui/container';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ publicada?: string; atualizada?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const job = await getJobById(id);
  return { title: job ? `${job.title} · ${job.startup.name}` : 'Vaga' };
}

export default async function JobDetailPage({ params, searchParams }: Props) {
  const [{ id }, flags, user] = await Promise.all([params, searchParams, getCurrentUser()]);
  const job = await getJobById(id);
  if (!job) notFound();

  const isOwner = user ? user.role === 'ADMIN' || job.startup.user.id === user.id : false;
  // Vagas inativas só são visíveis para quem gerencia.
  if (!job.isActive && !isOwner) notFound();

  const skills = splitList(job.skills);

  return (
    <Container className="space-y-8 py-10">
      <Link
        href={user ? '/app/vagas' : '/vagas'}
        className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Voltar para vagas
      </Link>

      {flags.publicada ? <Alert variant="success">Vaga publicada com sucesso!</Alert> : null}
      {flags.atualizada ? <Alert variant="success">Vaga atualizada.</Alert> : null}

      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <article className="space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={job.type === 'FREELANCE' ? 'warning' : 'brand'}>
                {jobTypeLabels[job.type]}
              </Badge>
              <Badge variant="outline">{workModeLabels[job.workMode]}</Badge>
              {!job.isActive ? <Badge variant="danger">Inativa</Badge> : null}
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{job.title}</h1>
            <p className="text-sm text-slate-500">Publicada em {formatDateTime(job.createdAt)}</p>
          </div>

          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-700">
            {job.location || job.startup.city ? (
              <li className="flex items-center gap-2">
                <MapPin className="size-4 text-brand-600" aria-hidden />
                {job.location ?? job.startup.city}
              </li>
            ) : null}
            {job.salaryRange ? (
              <li className="flex items-center gap-2">
                <Wallet className="size-4 text-brand-600" aria-hidden />
                {job.salaryRange}
              </li>
            ) : null}
          </ul>

          {skills.length > 0 ? (
            <ul className="flex flex-wrap gap-2" aria-label="Habilidades desejadas">
              {skills.map((skill) => (
                <li
                  key={skill}
                  className="rounded-md bg-slate-100 px-2.5 py-1 text-sm text-slate-700"
                >
                  {skill}
                </li>
              ))}
            </ul>
          ) : null}

          <div className="prose-plain text-slate-700">{job.description}</div>

          {isOwner ? (
            <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4">
              <JobManageActions jobId={job.id} isActive={job.isActive} />
            </div>
          ) : null}
        </article>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="size-4 text-brand-600" aria-hidden />
                {job.startup.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-700">
              {job.startup.pitch ? <p>{job.startup.pitch}</p> : null}
              <dl className="space-y-1 text-slate-600">
                {job.startup.niche ? (
                  <div className="flex justify-between gap-2">
                    <dt>Nicho</dt>
                    <dd className="font-medium text-slate-800">{job.startup.niche.name}</dd>
                  </div>
                ) : null}
                <div className="flex justify-between gap-2">
                  <dt>Estágio</dt>
                  <dd className="font-medium text-slate-800">
                    {startupStageLabels[job.startup.stage]}
                  </dd>
                </div>
                {job.startup.city ? (
                  <div className="flex justify-between gap-2">
                    <dt>Cidade</dt>
                    <dd className="font-medium text-slate-800">{job.startup.city}</dd>
                  </div>
                ) : null}
              </dl>
              {job.startup.website ? (
                <a
                  href={job.startup.website}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonVariants({
                    variant: 'outline',
                    size: 'sm',
                    className: 'w-full',
                  })}
                >
                  <Globe className="size-4" aria-hidden />
                  Site da startup
                </a>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Como se candidatar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              <p>
                Siga as instruções da descrição da vaga. Candidaturas pela plataforma estão no
                roadmap do produto.
              </p>
              {!user ? (
                <Link
                  href={`/login?next=/vagas/${job.id}`}
                  className={buttonVariants({ className: 'w-full' })}
                >
                  Entrar para ver mais oportunidades
                </Link>
              ) : null}
            </CardContent>
          </Card>
        </aside>
      </div>
    </Container>
  );
}
