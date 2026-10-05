import type { Metadata } from 'next';
import { requireRole } from '@/lib/auth/dal';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { EventForm } from './event-form';

export const metadata: Metadata = { title: 'Novo evento' };

export default async function NewEventPage() {
  await requireRole(['ADMIN'], '/app/eventos/novo');

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Administração"
        title="Novo evento"
        description="Cadastre um evento interno ou divulgue um evento externo para o ecossistema."
      />
      <Card className="max-w-3xl">
        <CardContent className="p-6">
          <EventForm />
        </CardContent>
      </Card>
    </div>
  );
}
