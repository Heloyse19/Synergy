import { describe, expect, it } from 'vitest';
import {
  isSyncRunning,
  syncAvailability,
  SYNC_HEARTBEAT_TIMEOUT_MS,
  SYNC_MIN_INTERVAL_MS,
  type TenderSyncSnapshot,
} from './sync-policy';

const now = new Date('2026-11-18T12:00:00Z');
const ago = (ms: number) => new Date(now.getTime() - ms);

function sync(overrides: Partial<TenderSyncSnapshot>): TenderSyncSnapshot {
  return { status: 'SUCCEEDED', heartbeatAt: now, completedAt: now, ...overrides };
}

describe('syncAvailability', () => {
  it('permite a primeira sincronização de um estado', () => {
    expect(syncAvailability(null, now)).toBe('available');
  });

  it('não inicia outra enquanto uma está em andamento', () => {
    const running = sync({ status: 'RUNNING', heartbeatAt: ago(30_000), completedAt: null });
    expect(isSyncRunning(running, now)).toBe(true);
    expect(syncAvailability(running, now)).toBe('running');
  });

  it('libera uma execução interrompida (sem sinal de vida)', () => {
    const stalled = sync({
      status: 'RUNNING',
      heartbeatAt: ago(SYNC_HEARTBEAT_TIMEOUT_MS + 1000),
      completedAt: null,
    });
    expect(isSyncRunning(stalled, now)).toBe(false);
    expect(syncAvailability(stalled, now)).toBe('available');
  });

  it('respeita o intervalo mínimo após uma sincronização completa', () => {
    expect(syncAvailability(sync({ completedAt: ago(60_000) }), now)).toBe('fresh');
    expect(syncAvailability(sync({ completedAt: ago(SYNC_MIN_INTERVAL_MS + 1000) }), now)).toBe(
      'available',
    );
  });

  it('permite repetir após uma falha, mesmo com dados recentes', () => {
    expect(syncAvailability(sync({ status: 'FAILED', completedAt: ago(60_000) }), now)).toBe(
      'available',
    );
  });
});
