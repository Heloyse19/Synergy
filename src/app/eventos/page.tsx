import type { Metadata } from 'next';
import { EventsList, parseEventFilter } from '@/components/events/events-list';
import { Container } from '@/components/ui/container';
import { PageHeader } from '@/components/ui/page-header';

export const metadata: Metadata = { title: 'Eventos' };
export const dynamic = 'force-dynamic';

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string }>;
}) {
  const { filtro } = await searchParams;

  return (
    <Container className="space-y-8 py-10">
      <PageHeader
        eyebrow="Agenda"
        title="Eventos do ecossistema"
        description="Hackathons, meetups, pitch days e workshops. Veja em quais eventos os investidores anjo já confirmaram presença."
      />
      <EventsList filter={parseEventFilter(filtro)} basePath="/eventos" />
    </Container>
  );
}
