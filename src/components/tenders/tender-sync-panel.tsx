'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, RefreshCw } from 'lucide-react';
import { requestTenderSync } from '@/actions/tenders';
import { initialActionState } from '@/lib/action-state';
import { ofState, UF_NAMES, type Uf } from '@/lib/tenders/states';
import { Alert } from '@/components/ui/alert';
import { SubmitButton } from '@/components/ui/submit-button';

const REFRESH_INTERVAL_MS = 5000;

export type TenderSyncView =
  /** O estado nunca foi sincronizado. */
  | { kind: 'never' }
  | { kind: 'running'; pagesDone: number; totalPages: number | null }
  /** `updatedLabel` já vem formatado do servidor (ex.: "há 3 horas"). */
  | { kind: 'ready'; tenderCount: number; updatedLabel: string; canRefresh: boolean }
  | { kind: 'failed'; error: string; updatedLabel: string | null };

type TenderSyncPanelProps = { uf: Uf; view: TenderSyncView };

/**
 * Situação da sincronização das licitações de um estado com o PNCP, com o botão que a inicia.
 * Enquanto a sincronização roda no servidor, a página é recarregada a cada poucos segundos.
 */
export function TenderSyncPanel({ uf, view }: TenderSyncPanelProps) {
  const router = useRouter();
  const stateOf = ofState(uf);
  const [state, action] = useActionState(requestTenderSync, initialActionState);
  const running = view.kind === 'running';

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => router.refresh(), REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [running, router]);

  const syncButton = (label: string, variant: 'primary' | 'outline' = 'primary') => (
    <form data-testid="tender-sync-form" action={action} className="shrink-0">
      <input type="hidden" name="uf" value={uf} />
      <SubmitButton
        data-testid="tender-sync-submit"
        variant={variant}
        size="sm"
        pendingText="Iniciando..."
      >
        <RefreshCw className="size-4" aria-hidden />
        {label}
      </SubmitButton>
    </form>
  );

  const percent =
    view.kind === 'running' && view.totalPages
      ? Math.min(100, Math.round((view.pagesDone / view.totalPages) * 100))
      : 0;

  return (
    <div
      data-testid="tender-sync-panel"
      className="space-y-3 rounded-xl border border-slate-200 bg-white p-4"
    >
      {state.status === 'error' && state.message ? (
        <Alert variant="error">{state.message}</Alert>
      ) : null}

      {view.kind === 'never' ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm">
            <p className="font-medium text-slate-900">
              Ainda não buscamos as licitações {stateOf}.
            </p>
            <p className="mt-0.5 text-slate-600">
              A primeira busca percorre todos os editais abertos do estado no PNCP e leva alguns
              minutos.
            </p>
          </div>
          {syncButton(`Buscar licitações ${stateOf}`)}
        </div>
      ) : null}

      {view.kind === 'running' ? (
        <div className="space-y-2 text-sm" role="status">
          <p className="flex items-center gap-2 font-medium text-slate-900">
            <Loader2 className="size-4 animate-spin text-brand-600" aria-hidden />
            Buscando as licitações {stateOf} no PNCP
            {view.totalPages ? (
              <span className="font-normal text-slate-600">
                · página {view.pagesDone} de {view.totalPages}
              </span>
            ) : null}
          </p>
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-slate-100"
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-brand-600 transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="text-slate-600">
            O PNCP responde devagar, então isso leva alguns minutos. As licitações aparecem abaixo
            conforme são importadas; você pode continuar navegando.
          </p>
        </div>
      ) : null}

      {view.kind === 'ready' ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600">
            <span className="font-medium text-slate-900">{UF_NAMES[uf]}</span> ·{' '}
            {view.tenderCount.toLocaleString('pt-BR')} licitações abertas · atualizado{' '}
            {view.updatedLabel}
          </p>
          {view.canRefresh ? syncButton('Atualizar', 'outline') : null}
        </div>
      ) : null}

      {view.kind === 'failed' ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm">
            <p className="font-medium text-red-700">
              A última busca das licitações {stateOf} não terminou: {view.error}
            </p>
            <p className="mt-0.5 text-slate-600">
              {view.updatedLabel
                ? `As licitações abaixo são da atualização concluída ${view.updatedLabel}.`
                : 'As licitações importadas até a falha continuam disponíveis abaixo.'}
            </p>
          </div>
          {syncButton('Tentar novamente')}
        </div>
      ) : null}
    </div>
  );
}
