// Assinatura e verificação do token de sessão (JWT HS256 via jose).
// Este módulo é "puro" (sem next/headers) para poder ser usado no proxy e em testes.
import { SignJWT, jwtVerify } from 'jose';
import type { Role } from '@/generated/prisma/enums';
import { MIN_SECRET_LENGTH, SESSION_DURATION_MS } from './constants';

export type SessionPayload = {
  userId: string;
  role: Role;
};

const ROLES: readonly Role[] = ['STARTUP', 'INVESTOR', 'PROFESSIONAL', 'ADMIN'];

export function assertSecret(secret: string | undefined): string {
  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `SESSION_SECRET ausente ou curto demais (mínimo ${MIN_SECRET_LENGTH} caracteres). Gere com: openssl rand -base64 32`,
    );
  }
  return secret;
}

export async function signSessionToken(
  payload: SessionPayload,
  secret: string,
  durationMs: number = SESSION_DURATION_MS,
): Promise<string> {
  const key = new TextEncoder().encode(assertSecret(secret));
  const expiresAt = Math.floor((Date.now() + durationMs) / 1000);
  return new SignJWT({ role: payload.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(key);
}

export async function verifySessionToken(
  token: string | undefined,
  secret: string | undefined,
): Promise<SessionPayload | null> {
  if (!token || !secret || secret.length < MIN_SECRET_LENGTH) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
      algorithms: ['HS256'],
    });
    const role = payload.role;
    if (typeof payload.sub !== 'string' || !ROLES.includes(role as Role)) return null;
    return { userId: payload.sub, role: role as Role };
  } catch {
    return null;
  }
}
