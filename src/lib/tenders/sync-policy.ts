// Regras de quando uma sincronização de licitações pode ser iniciada.
// Módulo puro (sem banco) para facilitar testes unitários.
import type { TenderSyncStatus } from '@/generated/prisma/enums';

/** Intervalo mínimo entre sincronizações completas do mesmo estado. */
export const SYNC_MIN_INTERVAL_MS = 3 * 60 * 60 * 1000;

/**
 * A sincronização registra um "sinal de vida" antes de cada chamada ao PNCP (que espera até 60 s).
 * Sem sinal por este tempo, a execução foi interrompida (ex.: o servidor reiniciou) e pode recomeçar.
 */
export const SYNC_HEARTBEAT_TIMEOUT_MS = 3 * 60 * 1000;

export type TenderSyncSnapshot = {
  status: TenderSyncStatus;
  heartbeatAt: Date;
  completedAt: Date | null;
};

export type SyncAvailability =
  /** Pode iniciar agora. */
  | 'available'
  /** Já existe uma sincronização em andamento para o estado. */
  | 'running'
  /** Os dados foram atualizados há pouco; não há motivo para consultar o PNCP de novo. */
  | 'fresh';

export function isSyncRunning(sync: TenderSyncSnapshot | null, now: Date = new Date()): boolean {
  return (
    sync?.status === 'RUNNING' &&
    now.getTime() - sync.heartbeatAt.getTime() < SYNC_HEARTBEAT_TIMEOUT_MS
  );
}

export function syncAvailability(
  sync: TenderSyncSnapshot | null,
  now: Date = new Date(),
): SyncAvailability {
  if (!sync) return 'available';
  if (isSyncRunning(sync, now)) return 'running';
  // Uma falha (ou execução interrompida) pode ser repetida mesmo que exista uma sincronização recente.
  if (
    sync.status === 'SUCCEEDED' &&
    sync.completedAt &&
    now.getTime() - sync.completedAt.getTime() < SYNC_MIN_INTERVAL_MS
  ) {
    return 'fresh';
  }
  return 'available';
}
