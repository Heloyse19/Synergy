import Link from 'next/link';
import { CalendarX } from 'lucide-react';
import { listEvents, type EventFilter } from '@/lib/data/events';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/ui/empty-state';
import { EventCard } from './event-card';

const filters: Array<{ value: EventFilter; label: string }> = [
  { value: 'upcoming', label: 'Próximos' },
  { value: 'past', label: 'Passados' },
  { value: 'all', label: 'Todos' },
];

export function parseEventFilter(value: string | undefined): EventFilter {
  return value === 'past' || value === 'all' ? value : 'upcoming';
}

/** Lista de eventos com abas de filtro — compartilhada entre /eventos e /app/eventos. */
export async function EventsList({ filter, basePath }: { filter: EventFilter; basePath: string }) {
  const events = await listEvents(filter);

  return (
    <div className="space-y-6">
      <div className="flex gap-2" role="tablist" aria-label="Filtrar eventos">
        {filters.map((item) => (
          <Link
            key={item.value}
            href={item.value === 'upcoming' ? basePath : `${basePath}?filtro=${item.value}`}
            role="tab"
            aria-selected={filter === item.value}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              filter === item.value
                ? 'bg-brand-600 text-white'
                : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50',
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {events.length === 0 ? (
        <EmptyState
          icon={CalendarX}
          title="Nenhum evento por aqui"
          description={
            filter === 'upcoming'
              ? 'Assim que novos hackathons, meetups ou pitch days forem cadastrados, eles aparecem aqui.'
              : 'Não há eventos neste filtro.'
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
