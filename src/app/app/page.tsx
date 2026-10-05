import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Briefcase,
  CalendarDays,
  Crown,
  LayoutTemplate,
  Lock,
  MessageSquare,
  Plus,
  Route,
} from 'lucide-react';
import { requireUser } from '@/lib/auth/dal';
import { getDashboardStats } from '@/lib/data/dashboard';
import { listEvents, listUserEvents } from '@/lib/data/events';
import { listActiveJobs, listJobsByStartup } from '@/lib/data/jobs';
import { formatDateTime } from '@/lib/format';
import { eventTypeLabels, roleLabels } from '@/lib/labels';
import { hasPremium } from '@/lib/plan';
import { EventCard } from '@/components/events/event-card';
import { JobCard } from '@/components/jobs/job-card';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlanBadge } from '@/components/ui/plan-badge';

export const metadata: Metadata = { title: 'Painel' };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ 'bem-vindo'?: string; erro?: string }>;
}) {
  const [user, params] = await Promise.all([requireUser(), searchParams]);
  const premium = hasPremium(user);

  const [stats, upcomingEvents, myEvents, myJobs, recentJobs] = await Promise.all([
    getDashboardStats(),
    listEvents('upcoming', 3),
    listUserEvents(user.id),
    user.startup ? listJobsByStartup(user.startup.id) : Promise.resolve([]),
    user.role === 'PROFESSIONAL' || user.role === 'INVESTOR'
      ? listActiveJobs({ limit: 3 })
      : Promise.resolve([]),
  ]);

  const firstName = user.name.split(' ')[0];

  const sections = [
    {
      href: '/app/comunidade',
      icon: MessageSquare,
      title: 'Comunidade',
      description: 'Fórum de suporte mútuo entre startups.',
      locked: !premium,
    },
    {
      href: '/app/eventos',
      icon: CalendarDays,
      title: 'Eventos',
      description: `${stats.upcomingEvents} evento${stats.upcomingEvents === 1 ? '' : 's'} nos próximos dias.`,
      locked: false,
    },
    {
      href: '/app/vagas',
      icon: Briefcase,
      title: user.role === 'STARTUP' ? 'Minhas vagas' : 'Vagas',
      description:
        user.role === 'STARTUP'
          ? `${myJobs.length} vaga${myJobs.length === 1 ? '' : 's'} publicada${myJobs.length === 1 ? '' : 's'}.`
          : `${stats.activeJobs} vaga${stats.activeJobs === 1 ? '' : 's'} aberta${stats.activeJobs === 1 ? '' : 's'} no mural.`,
      locked: false,
    },
    {
      href: '/app/premium',
      icon: Crown,
      title: 'Premium',
      description: premium
        ? 'Roadmap burocrático e templates liberados.'
        : 'Desbloqueie o roadmap e os templates.',
      locked: false,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Olá, {firstName}!</h1>
          <p className="mt-1 text-slate-600">
            {user.startup ? `${user.startup.name} · ` : ''}
            Este é o seu painel no Synergy.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="brand">{roleLabels[user.role]}</Badge>
          <PlanBadge plan={user.plan} />
        </div>
      </div>

      {params['bem-vindo'] ? (
        <Alert variant="success" title="Conta criada com sucesso!">
          Complete seu perfil para aparecer melhor para a comunidade.{' '}
          <Link href="/app/perfil" className="font-medium underline">
            Editar perfil
          </Link>
        </Alert>
      ) : null}
      {params.erro === 'sem-permissao' ? (
        <Alert variant="error">Você não tem permissão para acessar essa área.</Alert>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {sections.map((section) => (
          <Link key={section.href} href={section.href} className="group">
            <Card className="h-full transition-colors group-hover:border-brand-300">
              <CardContent className="flex h-full flex-col gap-3 p-5">
                <div className="flex items-center justify-between">
                  <section.icon className="size-6 text-brand-600" aria-hidden />
                  {section.locked ? (
                    <Lock className="size-4 text-amber-500" aria-label="Exclusivo Premium" />
                  ) : null}
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900">{section.title}</h2>
                  <p className="mt-1 text-sm text-slate-600">{section.description}</p>
                </div>
                <span className="mt-auto flex items-center gap-1 text-sm font-medium text-brand-600">
                  Abrir <ArrowRight className="size-4" aria-hidden />
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Próximos eventos</h2>
            <Link href="/app/eventos" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
              Ver todos
            </Link>
          </div>
          {upcomingEvents.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {upcomingEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Nenhum evento agendado no momento.</p>
          )}

          {recentJobs.length > 0 ? (
            <>
              <div className="flex items-center justify-between pt-4">
                <h2 className="text-lg font-semibold text-slate-900">Vagas recentes</h2>
                <Link href="/vagas" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
                  Ver mural
                </Link>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {recentJobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            </>
          ) : null}
        </section>

        <aside className="space-y-4">
          {user.role === 'STARTUP' ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Minhas vagas</CardTitle>
                <CardDescription>
                  {myJobs.filter((job) => job.isActive).length} ativa(s) de {myJobs.length}{' '}
                  publicada(s).
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <Link href="/app/vagas/nova" className={buttonVariants({ size: 'sm' })}>
                  <Plus className="size-4" aria-hidden />
                  Publicar vaga
                </Link>
                <Link
                  href="/app/vagas"
                  className={buttonVariants({ variant: 'outline', size: 'sm' })}
                >
                  Gerenciar vagas
                </Link>
              </CardContent>
            </Card>
          ) : null}

          {user.role === 'ADMIN' ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Administração</CardTitle>
                <CardDescription>
                  Cadastre eventos internos e divulgue eventos externos.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/app/eventos/novo" className={buttonVariants({ size: 'sm' })}>
                  <Plus className="size-4" aria-hidden />
                  Novo evento
                </Link>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {user.role === 'INVESTOR' ? 'Presenças confirmadas' : 'Minhas inscrições'}
              </CardTitle>
              <CardDescription>
                {user.role === 'INVESTOR'
                  ? 'Eventos em que você sinalizou presença publicamente.'
                  : 'Próximos eventos em que você está inscrito.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {myEvents.length > 0 ? (
                <ul className="space-y-3">
                  {myEvents.map(({ event }) => (
                    <li key={event.id} className="text-sm">
                      <Link
                        href={`/eventos/${event.id}`}
                        className="font-medium text-slate-900 hover:text-brand-700"
                      >
                        {event.title}
                      </Link>
                      <p className="text-xs text-slate-500">
                        {eventTypeLabels[event.type]} · {formatDateTime(event.startsAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">
                  Você ainda não confirmou presença em nenhum evento.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className={premium ? 'border-amber-200' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Crown className="size-4 text-amber-500" aria-hidden />
                Recursos Premium
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              <Link
                href="/app/roadmap"
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 hover:border-brand-300"
              >
                <Route className="size-4 text-brand-600" aria-hidden />
                Roadmap burocrático
                {!premium ? <Lock className="ml-auto size-3.5 text-amber-500" aria-hidden /> : null}
              </Link>
              <Link
                href="/app/templates"
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 hover:border-brand-300"
              >
                <LayoutTemplate className="size-4 text-brand-600" aria-hidden />
                Templates de landing page
                {!premium ? <Lock className="ml-auto size-3.5 text-amber-500" aria-hidden /> : null}
              </Link>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
