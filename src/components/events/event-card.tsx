import Link from 'next/link';
import { CalendarDays, Crown, MapPin, Users, Video } from 'lucide-react';
import type { EventListItem } from '@/lib/data/events';
import { formatDate, formatDateRange } from '@/lib/format';
import { eventOriginLabels, eventTypeLabels } from '@/lib/labels';
import { isPriorityWindowOpen } from '@/lib/plan';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export function EventCard({ event }: { event: EventListItem }) {
  const investors = event.attendances.map((a) => a.user);
  const priorityOpen = isPriorityWindowOpen(event.priorityUntil);

  return (
    <Card className="flex h-full flex-col transition-shadow hover:shadow-md">
      <CardContent className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="brand">{eventTypeLabels[event.type]}</Badge>
          <Badge variant="outline">{eventOriginLabels[event.origin]}</Badge>
          {priorityOpen && event.priorityUntil ? (
            <Badge
              variant="premium"
              title="Inscrições exclusivas para Premium durante a janela de prioridade"
            >
              <Crown className="size-3" aria-hidden />
              Prioridade Premium até {formatDate(event.priorityUntil)}
            </Badge>
          ) : null}
        </div>

        <h3 className="text-lg font-semibold leading-snug text-slate-900">
          <Link href={`/eventos/${event.id}`} className="hover:text-brand-700">
            {event.title}
          </Link>
        </h3>

        <ul className="space-y-1.5 text-sm text-slate-600">
          <li className="flex items-center gap-2">
            <CalendarDays className="size-4 shrink-0 text-slate-400" aria-hidden />
            <span>{formatDateRange(event.startsAt, event.endsAt)}</span>
          </li>
          <li className="flex items-center gap-2">
            {event.isOnline ? (
              <Video className="size-4 shrink-0 text-slate-400" aria-hidden />
            ) : (
              <MapPin className="size-4 shrink-0 text-slate-400" aria-hidden />
            )}
            <span>{event.isOnline ? 'Online' : (event.location ?? 'Local a definir')}</span>
          </li>
          <li className="flex items-center gap-2">
            <Users className="size-4 shrink-0 text-slate-400" aria-hidden />
            <span>
              {event._count.attendances} inscrito{event._count.attendances === 1 ? '' : 's'}
              {event.capacity ? ` · ${event.capacity} vagas` : ''}
            </span>
          </li>
        </ul>

        <div className="mt-auto border-t border-slate-100 pt-3">
          {investors.length > 0 ? (
            <p className="text-sm text-slate-700">
              <span className="font-medium text-emerald-700">
                {investors.length} investidor{investors.length === 1 ? '' : 'es'} anjo confirmado
                {investors.length === 1 ? '' : 's'}:
              </span>{' '}
              {investors
                .slice(0, 3)
                .map(
                  (user) =>
                    user.name + (user.investor?.company ? ` (${user.investor.company})` : ''),
                )
                .join(', ')}
              {investors.length > 3 ? ` e mais ${investors.length - 3}` : ''}
            </p>
          ) : (
            <p className="text-sm text-slate-400">Nenhum investidor confirmado ainda.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
