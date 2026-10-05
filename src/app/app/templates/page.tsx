import type { Metadata } from 'next';
import { Download, ExternalLink, LayoutTemplate } from 'lucide-react';
import { requireUser } from '@/lib/auth/dal';
import { listTemplates } from '@/lib/data/templates';
import { hasPremium } from '@/lib/plan';
import { PremiumGate } from '@/components/premium/premium-gate';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';

export const metadata: Metadata = { title: 'Templates de landing page' };

export default async function TemplatesPage() {
  const user = await requireUser('/app/templates');

  if (!hasPremium(user)) {
    return (
      <div className="space-y-8">
        <PageHeader eyebrow="Premium" title="Templates de landing page" />
        <PremiumGate
          feature="Os templates de landing page"
          description="Páginas prontas (HTML + CSS) para apresentar sua startup a investidores, captar leads e divulgar o pré-lançamento."
        />
      </div>
    );
  }

  const templates = await listTemplates();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Premium"
        title="Templates de landing page"
        description="Baixe, substitua os textos entre colchetes pelos da sua startup e publique em qualquer hospedagem estática."
      />

      {templates.length === 0 ? (
        <EmptyState
          icon={LayoutTemplate}
          title="Nenhum template disponível"
          description="Rode o seed do banco para carregar os templates iniciais."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="flex flex-col">
              <CardContent className="flex flex-1 flex-col gap-3 p-5">
                <div className="flex h-36 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
                  <iframe
                    src={template.fileUrl}
                    title={`Prévia: ${template.name}`}
                    className="pointer-events-none h-full w-full rounded-lg"
                    loading="lazy"
                    sandbox=""
                  />
                </div>
                <Badge variant="brand" className="self-start">
                  {template.category}
                </Badge>
                <h3 className="text-lg font-semibold text-slate-900">{template.name}</h3>
                <p className="flex-1 text-sm text-slate-600">{template.description}</p>
                <div className="flex gap-2 pt-2">
                  <a
                    href={template.fileUrl}
                    download
                    className={buttonVariants({ size: 'sm', className: 'flex-1' })}
                  >
                    <Download className="size-4" aria-hidden />
                    Baixar HTML
                  </a>
                  <a
                    href={template.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={buttonVariants({ variant: 'outline', size: 'sm' })}
                  >
                    <ExternalLink className="size-4" aria-hidden />
                    Abrir
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
