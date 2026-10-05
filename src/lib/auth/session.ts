import 'server-only';
import { cookies } from 'next/headers';
import type { Role } from '@/generated/prisma/enums';
import { SESSION_COOKIE, SESSION_DURATION_MS } from './constants';
import { assertSecret, signSessionToken, verifySessionToken } from './token';

function secret() {
  return assertSecret(process.env.SESSION_SECRET);
}

/** Cria o cookie de sessão (HttpOnly, SameSite=Lax, Secure em produção). */
export async function createSession(userId: string, role: Role): Promise<void> {
  const token = await signSessionToken({ userId, role }, secret());
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(Date.now() + SESSION_DURATION_MS),
  });
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/** Lê e valida o cookie de sessão da requisição atual. */
export async function readSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return verifySessionToken(token, process.env.SESSION_SECRET);
}
