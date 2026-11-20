'use server';

import { revalidatePath } from 'next/cache';
import { after } from 'next/server';
import { getCurrentUser } from '@/lib/auth/dal';
import { errorState, successState, type ActionState } from '@/lib/action-state';
import { limiters } from '@/lib/rate-limit';
import { ofState } from '@/lib/tenders/states';
import { enqueueTenderSync } from '@/lib/tenders/sync';
import { tenderSyncSchema } from '@/lib/validations/tenders';

/**
 * Inicia, em segundo plano, a sincronização das licitações abertas de um estado com o PNCP.
 * A action retorna em seguida; o progresso fica em `TenderSync` e aparece na página de licitações.
 */
export async function requestTenderSync(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return errorState('Faça login para atualizar as licitações.');
  if (user.role !== 'STARTUP' && user.role !== 'ADMIN') {
    return errorState('Apenas contas de startup podem atualizar as licitações.');
  }

  const parsed = tenderSyncSchema.safeParse({ uf: formData.get('uf') });
  if (!parsed.success) return errorState('Escolha um estado válido.');
  const { uf } = parsed.data;
  const state = ofState(uf);

  // Administradores podem sincronizar vários estados em sequência (ex.: preparar uma demonstração).
  if (user.role !== 'ADMIN') {
    const limit = limiters.tenderSync.check(user.id);
    if (!limit.allowed) {
      const minutes = Math.ceil(limit.retryAfterMs / 60_000);
      return errorState(
        `Você já pediu várias atualizações. Tente novamente em ${minutes} minuto${minutes === 1 ? '' : 's'}.`,
      );
    }
  }

  const result = await enqueueTenderSync(uf);
  if (result.status === 'fresh') {
    return errorState(`As licitações ${state} foram atualizadas há pouco.`);
  }
  if (result.status === 'started') {
    // Mantém a requisição viva até o fim do trabalho em segundo plano.
    after(() => result.done);
  }

  revalidatePath('/app/licitacoes');
  revalidatePath('/app');
  return successState(
    result.status === 'started'
      ? `Buscando as licitações ${state} no PNCP. Isso leva alguns minutos; você pode continuar navegando.`
      : `A busca das licitações ${state} já está em andamento.`,
  );
}
