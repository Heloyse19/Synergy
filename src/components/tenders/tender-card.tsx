import { Building2, CalendarClock, ExternalLink, MapPin, Wallet } from 'lucide-react';
import type { TenderListItem } from '@/lib/data/tenders';
import { formatCurrency, formatDateTime, formatRelative } from '@/lib/format';
import { pncpTenderUrl } from '@/lib/pncp/normalize';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const CLOSING_SOON_MS = 3 * 24 * 60 * 60 * 1000;
const MAX_TERMS = 6;

/** Licitação aberta com o motivo da aderência ao nicho (quando houver) e os links oficiais. */
export function TenderCard({ tender, now }: { tender: TenderListItem; now: Date }) {
  const pncpUrl = pncpTenderUrl(tender.pncpId);
  const closingSoon = tender.closesAt.getTime() - now.getTime() < CLOSING_SOON_MS;
  const showUnit = tender.unitName && tender.unitName !== tender.agencyName;

  return (
    <Card data-testid={`tender-card-${tender.id}`} className="transition-shadow hover:shadow-md">
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {tender.match ? (
              <Badge variant={tender.match.strength === 'strong' ? 'success' : 'default'}>
                {tender.match.strength === 'strong' ? 'Alta aderência' : 'Possível aderência'}
              </Badge>
            ) : null}
            <Badge variant="brand">{tender.modalityName}</Badge>
            {tender.isPriceRegistration ? (
              <Badge variant="outline">Registro de preços</Badge>
            ) : null}
          </div>
          <span
            className={cn('text-xs font-medium', closingSoon ? 'text-amber-700' : 'text-slate-500')}
          >
            Encerra {formatRelative(tender.closesAt, now)}
          </span>
        </div>

        <div>
          <h3 className="line-clamp-4 text-base leading-snug font-semibold text-slate-900">
            {tender.object}
          </h3>
          <p className="mt-2 flex items-start gap-1.5 text-sm text-slate-600">
            <Building2 className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden />
            <span>
              {tender.agencyName}
              {showUnit ? <span className="text-slate-400"> · {tender.unitName}</span> : null}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
          <span className="flex items-center gap-1.5">
            <MapPin className="size-4 text-slate-400" aria-hidden />
            {tender.city ? `${tender.city}/${tender.uf}` : tender.uf}
          </span>
          <span className="flex items-center gap-1.5">
            <Wallet className="size-4 text-slate-400" aria-hidden />
            {tender.estimatedValue !== null
              ? `${formatCurrency(tender.estimatedValue)} (estimado)`
              : 'Valor não informado'}
          </span>
          <span className="flex items-center gap-1.5">
            <CalendarClock className="size-4 text-slate-400" aria-hidden />
            Propostas até {formatDateTime(tender.closesAt)}
          </span>
        </div>

        {tender.match ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-slate-500">Termos encontrados:</span>
            <ul
              className="flex flex-wrap gap-1.5"
              aria-label="Termos do nicho encontrados no objeto"
            >
              {tender.match.terms.slice(0, MAX_TERMS).map((term) => (
                <li
                  key={term}
                  className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                >
                  {term}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          {pncpUrl ? (
            <a
              href={pncpUrl}
              data-testid={`tender-pncp-link-${tender.id}`}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              Ver edital no PNCP
              <ExternalLink className="size-3.5" aria-hidden />
            </a>
          ) : null}
          {tender.sourceUrl ? (
            <a
              href={tender.sourceUrl}
              data-testid={`tender-source-link-${tender.id}`}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ variant: 'ghost', size: 'sm' })}
            >
              Sistema de envio de propostas
              <ExternalLink className="size-3.5" aria-hidden />
            </a>
          ) : null}
          <span className="ml-auto text-xs text-slate-400">
            {tender.number ? `Nº ${tender.number} · ` : ''}
            {tender.pncpId}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
