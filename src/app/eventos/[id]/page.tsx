import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  CalendarDays,
  Crown,
  ExternalLink,
  MapPin,
  Trash2,
  Users,
  Video,
} from 'lucide-react';
import { deleteEvent } from '@/actions/events';
import { getCurrentUser } from '@/lib/auth/dal';
import { getEventById } from '@/lib/data/events';
import { formatDate, formatDateRange } from '@/lib/format';
import { eventOriginLabels, eventTypeLabels, roleLabels } from '@/lib/labels';
import { canRegisterForEvent, isPriorityWindowOpen, registrationDenialMessages } from '@/lib/plan';
import { Alert } from '@/components/ui/alert';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { SubmitButton } from '@/components/ui/submit-button';
import { AttendanceForm } from './attendance-form';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const event = await getEventById(id);
  return { title: event?.title ?? 'Evento' };
}

export default async function EventDetailPage({ params }: Props) {
  const { id } = await params;
  const [event, user] = await Promise.all([getEventById(id), getCurrentUser()]);
  if (!event) notFound();

  const investors = event.attendances.filter((a) => a.user.role === 'INVESTOR');
  const participants = event.attendances.filter((a) => a.user.role !== 'INVESTOR');
  const attending = user ? event.attendances.some((a) => a.user.id === user.id) : false;
  const priorityOpen = isPriorityWindowOpen(event.priorityUntil);

  const check = user
    ? canRegisterForEvent({
        event,
        attendeeCount: event.attendances.length,
        user,
        alreadyRegistered: attending,
      })
    : null;
  const disabledReason =
    check && !check.allowed && check.reason !== 'already_registered'
      ? registrationDenialMessages[check.reason]
      : undefined;

  return (
    <Container className="space-y-8 py-10">
      <Link
        href={user ? '/app/eventos' : '/eventos'}
        className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Voltar para eventos
      </Link>

      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <article className="space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="brand">{eventTypeLabels[event.type]}</Badge>
              <Badge variant="outline">{eventOriginLabels[event.origin]}</Badge>
              {priorityOpen && event.priorityUntil ? (
                <Badge variant="premium">
                  <Crown className="size-3" aria-hidden />
                  Prioridade Premium até {formatDate(event.priorityUntil)}
                </Badge>
              ) : null}
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{event.title}</h1>
            <p className="text-sm text-slate-500">Organizado por {event.organizer.name}</p>
          </div>

          <ul className="grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
            <li className="flex items-start gap-2">
              <CalendarDays className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden />
              <span>{formatDateRange(event.startsAt, event.endsAt)}</span>
            </li>
            <li className="flex items-start gap-2">
              {event.isOnline ? (
                <Video className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden />
              ) : (
                <MapPin className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden />
              )}
              <span>
                {event.isOnline ? 'Evento online' : (event.location ?? 'Local a definir')}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Users className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden />
              <span>
                {event.attendances.length} inscrito{event.attendances.length === 1 ? '' : 's'}
                {event.capacity ? ` de ${event.capacity} vagas` : ''}
              </span>
            </li>
            {event.externalUrl ? (
              <li className="flex items-start gap-2">
                <ExternalLink className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden />
                <a
                  href={event.externalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand-700 hover:underline"
                >
                  Página oficial do evento
                </a>
              </li>
            ) : null}
          </ul>

          <div className="prose-plain text-slate-700">{event.description}</div>

          {user?.role === 'ADMIN' ? (
            <form action={deleteEvent} className="border-t border-slate-200 pt-4">
              <input type="hidden" name="eventId" value={event.id} />
              <SubmitButton variant="danger" size="sm" pendingText="Excluindo...">
                <Trash2 className="size-4" aria-hidden />
                Excluir evento (admin)
              </SubmitButton>
            </form>
          ) : null}
        </article>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Participação</CardTitle>
              <CardDescription>
                {user?.role === 'INVESTOR'
                  ? 'Sua presença fica visível publicamente para as startups.'
                  : 'Garanta sua vaga neste evento.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user ? (
                <AttendanceForm
                  eventId={event.id}
                  isInvestor={user.role === 'INVESTOR'}
                  attending={attending}
                  disabledReason={disabledReason}
                />
              ) : (
                <div className="space-y-3">
                  <Link
                    href={`/login?next=/eventos/${event.id}`}
                    className={buttonVariants({ className: 'w-full' })}
                  >
                    Entrar para participar
                  </Link>
                  <p className="text-center text-xs text-slate-500">
                    Investidores anjo confirmam presença publicamente; startups e profissionais se
                    inscrevem.
                  </p>
                </div>
              )}
              {priorityOpen && user && !attending && disabledReason ? (
                <Alert variant="warning" className="mt-3">
                  <Link href="/app/premium" className="font-medium underline">
                    Ative o Premium
                  </Link>{' '}
                  para se inscrever durante a janela de prioridade.
                </Alert>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Investidores anjo confirmados ({investors.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {investors.length > 0 ? (
                <ul className="space-y-3">
                  {investors.map((attendance) => (
                    <li key={attendance.id} className="flex items-center gap-3">
                      <Avatar
                        name={attendance.user.name}
                        className="size-8 bg-emerald-600 text-xs"
                      />
                      <div className="text-sm">
                        <p className="font-medium text-slate-900">{attendance.user.name}</p>
                        <p className="text-xs text-slate-500">
                          {attendance.user.investor?.company ?? roleLabels.INVESTOR}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">
                  Nenhum investidor confirmou presença ainda.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Startups e profissionais ({participants.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {participants.length > 0 ? (
                <ul className="space-y-2 text-sm text-slate-700">
                  {participants.slice(0, 12).map((attendance) => (
                    <li key={attendance.id} className="flex items-center justify-between gap-2">
                      <span>{attendance.user.startup?.name ?? attendance.user.name}</span>
                      <Badge variant="default">{roleLabels[attendance.user.role]}</Badge>
                    </li>
                  ))}
                  {participants.length > 12 ? (
                    <li className="text-xs text-slate-400">e mais {participants.length - 12}...</li>
                  ) : null}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">Seja a primeira startup a se inscrever.</p>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </Container>
  );
}
