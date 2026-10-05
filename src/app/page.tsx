import Link from 'next/link';
import {
  ArrowRight,
  Briefcase,
  CalendarDays,
  Crown,
  HandCoins,
  MessageSquare,
  Rocket,
} from 'lucide-react';
import { getDashboardStats } from '@/lib/data/dashboard';
import { listEvents } from '@/lib/data/events';
import { listActiveJobs } from '@/lib/data/jobs';
import { roleDescriptions, roleLabels } from '@/lib/labels';
import { EventCard } from '@/components/events/event-card';
import { JobCard } from '@/components/jobs/job-card';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Container } from '@/components/ui/container';

export const dynamic = 'force-dynamic';

const features = [
  {
    icon: CalendarDays,
    title: 'Eventos',
    description:
      'Hackathons, pitch days e meetups internos e externos. Veja quais investidores anjo já confirmaram presença.',
    href: '/eventos',
  },
  {
    icon: Briefcase,
    title: 'Vagas',
    description: 'Mural em que startups anunciam vagas fixas e oportunidades para freelancers.',
    href: '/vagas',
  },
  {
    icon: MessageSquare,
    title: 'Comunidade',
    description: 'Fórum de suporte mútuo entre startups registradas, exclusivo do plano Premium.',
    href: '/app/comunidade',
  },
  {
    icon: Crown,
    title: 'Premium',
    description:
      'Roadmap burocrático guiado e templates de landing page para captação de recursos.',
    href: '/app/premium',
  },
];

const roleIcons = { STARTUP: Rocket, INVESTOR: HandCoins, PROFESSIONAL: Briefcase } as const;

export default async function HomePage() {
  const [stats, events, jobs] = await Promise.all([
    getDashboardStats(),
    listEvents('upcoming', 3),
    listActiveJobs({ limit: 3 }),
  ]);

  const statItems = [
    { label: 'Startups', value: stats.startups },
    { label: 'Investidores anjo', value: stats.investors },
    { label: 'Eventos próximos', value: stats.upcomingEvents },
    { label: 'Vagas abertas', value: stats.activeJobs },
  ];

  return (
    <>
      <section className="border-b border-slate-200 bg-white">
        <Container className="grid gap-10 py-16 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:py-24">
          <div className="space-y-6">
            <span className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
              Ecossistema de startups e investidores anjo
            </span>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Conectamos startups, profissionais e investidores anjo em um só lugar.
            </h1>
            <p className="max-w-xl text-lg text-slate-600">
              Encontre apoio técnico, recrute talentos, participe de eventos com investidores
              confirmados e organize a burocracia da sua startup com um roadmap guiado.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/cadastro" className={buttonVariants({ size: 'lg' })}>
                Criar conta gratuita
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link href="/eventos" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
                Ver eventos
              </Link>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-4">
            {statItems.map((item) => (
              <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <dt className="text-sm text-slate-500">{item.label}</dt>
                <dd className="mt-1 text-3xl font-bold text-slate-900">{item.value}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      <Container className="space-y-16 py-16">
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Para quem é o Synergy</h2>
            <p className="mt-1 text-slate-600">
              Escolha seu perfil no cadastro e tenha uma experiência personalizada.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {(Object.keys(roleDescriptions) as Array<keyof typeof roleDescriptions>).map((role) => {
              const Icon = roleIcons[role];
              return (
                <Card key={role}>
                  <CardContent className="space-y-3 p-6">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                      <Icon className="size-5" aria-hidden />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">{roleLabels[role]}</h3>
                    <p className="text-sm text-slate-600">{roleDescriptions[role]}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">O que você encontra na plataforma</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <Link key={feature.href} href={feature.href} className="group">
                <Card className="h-full transition-colors group-hover:border-brand-300">
                  <CardContent className="space-y-3 p-6">
                    <feature.icon className="size-6 text-brand-600" aria-hidden />
                    <h3 className="font-semibold text-slate-900">{feature.title}</h3>
                    <p className="text-sm text-slate-600">{feature.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {events.length > 0 ? (
          <section className="space-y-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Próximos eventos</h2>
                <p className="mt-1 text-slate-600">
                  Investidores anjo sinalizam publicamente onde estarão.
                </p>
              </div>
              <Link href="/eventos" className={buttonVariants({ variant: 'ghost' })}>
                Ver todos
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        ) : null}

        {jobs.length > 0 ? (
          <section className="space-y-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Vagas recentes</h2>
                <p className="mt-1 text-slate-600">
                  Oportunidades fixas e freelancer publicadas pelas startups.
                </p>
              </div>
              <Link href="/vagas" className={buttonVariants({ variant: 'ghost' })}>
                Ver mural
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          </section>
        ) : null}

        <section className="rounded-2xl bg-slate-900 px-8 py-12 text-white sm:px-12">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-3 py-1 text-xs font-semibold text-slate-950">
                <Crown className="size-3" aria-hidden />
                Plano Premium
              </span>
              <h2 className="text-3xl font-bold">
                Organize a burocracia e capte recursos com mais confiança.
              </h2>
              <p className="text-slate-300">
                Comunidade de suporte, roadmap burocrático com progresso salvo, templates de landing
                page e prioridade de inscrição em eventos.
              </p>
            </div>
            <Link
              href="/app/premium"
              className={buttonVariants({ variant: 'premium', size: 'lg' })}
            >
              Conhecer o Premium
            </Link>
          </div>
        </section>
      </Container>
    </>
  );
}
