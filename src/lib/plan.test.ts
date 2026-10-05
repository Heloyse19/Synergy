import { describe, expect, it } from 'vitest';
import { canRegisterForEvent, hasPremium, isPriorityWindowOpen } from './plan';

const now = new Date('2026-10-10T12:00:00Z');
const futureEvent = {
  startsAt: new Date('2026-10-24T12:00:00Z'),
  priorityUntil: new Date('2026-10-17T12:00:00Z'),
  capacity: 2,
};

describe('hasPremium', () => {
  it('libera contas Premium e administradores', () => {
    expect(hasPremium({ plan: 'PREMIUM', role: 'STARTUP' })).toBe(true);
    expect(hasPremium({ plan: 'FREE', role: 'ADMIN' })).toBe(true);
  });

  it('bloqueia contas gratuitas', () => {
    expect(hasPremium({ plan: 'FREE', role: 'STARTUP' })).toBe(false);
    expect(hasPremium({ plan: 'FREE', role: 'INVESTOR' })).toBe(false);
  });
});

describe('canRegisterForEvent', () => {
  const base = { event: futureEvent, attendeeCount: 0, alreadyRegistered: false, now };

  it('bloqueia conta gratuita durante a janela de prioridade', () => {
    const result = canRegisterForEvent({ ...base, user: { plan: 'FREE', role: 'STARTUP' } });
    expect(result).toEqual({ allowed: false, reason: 'priority_window' });
  });

  it('permite conta Premium durante a janela de prioridade', () => {
    const result = canRegisterForEvent({ ...base, user: { plan: 'PREMIUM', role: 'STARTUP' } });
    expect(result).toEqual({ allowed: true });
  });

  it('permite conta gratuita após a janela de prioridade', () => {
    const result = canRegisterForEvent({
      ...base,
      now: new Date('2026-10-18T12:00:00Z'),
      user: { plan: 'FREE', role: 'PROFESSIONAL' },
    });
    expect(result).toEqual({ allowed: true });
  });

  it('investidor sempre pode confirmar presença, mesmo com evento lotado', () => {
    const result = canRegisterForEvent({
      ...base,
      attendeeCount: 2,
      user: { plan: 'FREE', role: 'INVESTOR' },
    });
    expect(result).toEqual({ allowed: true });
  });

  it('respeita a capacidade do evento', () => {
    const result = canRegisterForEvent({
      ...base,
      now: new Date('2026-10-18T12:00:00Z'),
      attendeeCount: 2,
      user: { plan: 'PREMIUM', role: 'STARTUP' },
    });
    expect(result).toEqual({ allowed: false, reason: 'full' });
  });

  it('não permite inscrição duplicada nem em evento passado', () => {
    expect(
      canRegisterForEvent({
        ...base,
        alreadyRegistered: true,
        user: { plan: 'PREMIUM', role: 'STARTUP' },
      }),
    ).toEqual({ allowed: false, reason: 'already_registered' });
    expect(
      canRegisterForEvent({
        ...base,
        now: new Date('2026-11-01T12:00:00Z'),
        user: { plan: 'PREMIUM', role: 'STARTUP' },
      }),
    ).toEqual({ allowed: false, reason: 'past' });
  });
});

describe('isPriorityWindowOpen', () => {
  it('considera a janela aberta apenas antes de priorityUntil', () => {
    expect(isPriorityWindowOpen(futureEvent.priorityUntil, now)).toBe(true);
    expect(isPriorityWindowOpen(futureEvent.priorityUntil, new Date('2026-10-18T00:00:00Z'))).toBe(
      false,
    );
    expect(isPriorityWindowOpen(null, now)).toBe(false);
  });
});
