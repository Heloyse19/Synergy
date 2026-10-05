import { describe, expect, it } from 'vitest';
import { signSessionToken, verifySessionToken } from './token';

const secret = 'segredo-de-teste-com-mais-de-32-caracteres-ok';

describe('token de sessão', () => {
  it('assina e verifica o payload', async () => {
    const token = await signSessionToken({ userId: 'user_1', role: 'STARTUP' }, secret);
    const payload = await verifySessionToken(token, secret);
    expect(payload).toEqual({ userId: 'user_1', role: 'STARTUP' });
  });

  it('rejeita segredo diferente, token adulterado e token expirado', async () => {
    const token = await signSessionToken({ userId: 'user_1', role: 'INVESTOR' }, secret);
    expect(
      await verifySessionToken(token, 'outro-segredo-com-mais-de-32-caracteres-aqui'),
    ).toBeNull();
    expect(await verifySessionToken(`${token}x`, secret)).toBeNull();

    const expired = await signSessionToken({ userId: 'user_1', role: 'INVESTOR' }, secret, -1000);
    expect(await verifySessionToken(expired, secret)).toBeNull();
  });

  it('não aceita segredo curto', async () => {
    await expect(signSessionToken({ userId: 'u', role: 'ADMIN' }, 'curto')).rejects.toThrow();
    expect(await verifySessionToken('qualquer', 'curto')).toBeNull();
  });
});
