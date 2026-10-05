import { describe, expect, it } from 'vitest';
import { eventSchema } from './events';
import { parseDateTimeLocal } from './shared';

const base = {
  title: 'Hackathon Synergy',
  description: 'Dois dias de imersão para prototipar soluções com mentoria.',
  type: 'HACKATHON',
  origin: 'INTERNAL',
  startsAt: '2026-10-20T19:00',
  endsAt: '2026-10-20T22:00',
  location: 'Curitiba',
  isOnline: undefined,
  externalUrl: '',
  capacity: '60',
  priorityUntil: '2026-10-15T23:59',
};

describe('parseDateTimeLocal', () => {
  it('interpreta o horário como Brasília (UTC-3)', () => {
    const date = parseDateTimeLocal('2026-10-20T19:00');
    expect(date?.toISOString()).toBe('2026-10-20T22:00:00.000Z');
  });

  it('rejeita formatos inválidos', () => {
    expect(parseDateTimeLocal('20/10/2026 19:00')).toBeNull();
    expect(parseDateTimeLocal('')).toBeNull();
  });
});

describe('eventSchema', () => {
  it('aceita um evento válido e converte os campos', () => {
    const result = eventSchema.safeParse(base);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.capacity).toBe(60);
      expect(result.data.isOnline).toBe(false);
      expect(result.data.externalUrl).toBeUndefined();
      expect(result.data.startsAt).toBeInstanceOf(Date);
    }
  });

  it('rejeita término antes do início', () => {
    const result = eventSchema.safeParse({ ...base, endsAt: '2026-10-20T18:00' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.path).toEqual(['endsAt']);
  });

  it('rejeita janela de prioridade depois do início do evento', () => {
    const result = eventSchema.safeParse({ ...base, priorityUntil: '2026-10-21T10:00' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.path).toEqual(['priorityUntil']);
  });

  it('rejeita URL externa inválida', () => {
    expect(eventSchema.safeParse({ ...base, externalUrl: 'meetup' }).success).toBe(false);
  });
});
