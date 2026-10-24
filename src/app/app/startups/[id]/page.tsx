import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Globe } from 'lucide-react';
import { requireUser } from '@/lib/auth/dal';
import { getStartupById } from '@/lib/data/startups';
import { startupStageLabels } from '@/lib/labels';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/ui/container';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const startup = await getStartupById(id);
  return { title: startup ? `${startup.name} · Explorar startups` : 'Startup' };
}

export default async function StartupDetailPage({ params }: Props) {
  await requireUser('/app/startups');
  const { id } = await params;
  const startup = await getStartupById(id);
  if (!startup) notFound();

  return (
    <Container className="space-y-8 py-10">
      <Link
        href="/app/startups"
        className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Voltar para startups
      </Link>

      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <article className="space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="brand">{startupStageLabels[startup.stage]}</Badge>
              {startup.niche ? <Badge variant="outline">{startup.niche.name}</Badge> : null}
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{startup.name}</h1>
            {startup.pitch ? <p className="text-lg text-slate-600">{startup.pitch}</p> : null}
          </div>

          {startup.description ? (
            <div className="prose-plain text-slate-700">{startup.description}</div>
          ) : null}
        </article>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sobre a startup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              <dl className="space-y-1 text-slate-600">
                {startup.city ? (
                  <div className="flex justify-between gap-2">
                    <dt>Cidade</dt>
                    <dd className="font-medium text-slate-800">{startup.city}</dd>
                  </div>
                ) : null}
                <div className="flex justify-between gap-2">
                  <dt>Estágio</dt>
                  <dd className="font-medium text-slate-800">
                    {startupStageLabels[startup.stage]}
                  </dd>
                </div>
                {startup.niche ? (
                  <div className="flex justify-between gap-2">
                    <dt>Categoria</dt>
                    <dd className="font-medium text-slate-800">{startup.niche.name}</dd>
                  </div>
                ) : null}
              </dl>
              {startup.website ? (
                <a
                  href={startup.website}
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
        </aside>
      </div>
    </Container>
  );
}
