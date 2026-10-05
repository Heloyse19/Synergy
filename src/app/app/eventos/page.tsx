import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { requireUser } from '@/lib/auth/dal';
import { EventsList, parseEventFilter } from '@/components/events/events-list';
import { buttonVariants } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';

export const metadata: Metadata = { title: 'Eventos' };

export default async function AppEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string }>;
}) {
  const [user, { filtro }] = await Promise.all([requireUser('/app/eventos'), searchParams]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Eventos"
        title="Agenda do ecossistema"
        description={
          user.role === 'INVESTOR'
            ? 'Confirme presença publicamente para que as startups saibam onde encontrar você.'
            : 'Inscreva-se em eventos e veja quais investidores anjo já confirmaram presença.'
        }
        actions={
          user.role === 'ADMIN' ? (
            <Link href="/app/eventos/novo" className={buttonVariants()}>
              <Plus className="size-4" aria-hidden />
              Novo evento
            </Link>
          ) : null
        }
      />
      <EventsList filter={parseEventFilter(filtro)} basePath="/app/eventos" />
    </div>
  );
}
