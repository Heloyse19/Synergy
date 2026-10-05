// Data Access Layer de autenticação/autorização.
// Toda página ou action protegida deve passar por aqui (não confie só no proxy.ts).
import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import type { Role } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { hasPremium } from '@/lib/plan';
import { readSession } from './session';

/** Sessão da requisição atual (memoizada por requisição com React cache). */
export const verifySession = cache(async () => readSession());

/** Usuário logado com os campos seguros para a UI (nunca expõe passwordHash). */
export const getCurrentUser = cache(async () => {
  const session = await verifySession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      plan: true,
      planActivatedAt: true,
      createdAt: true,
      startup: {
        select: { id: true, name: true, stage: true, nicheId: true, city: true },
      },
      investor: { select: { id: true, company: true } },
      professional: { select: { id: true, headline: true } },
    },
  });

  return user;
});

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

/** Exige usuário logado; redireciona para o login preservando o destino. */
export async function requireUser(nextPath = '/app'): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  return user;
}

/** Exige um dos perfis informados (ADMIN sempre passa). */
export async function requireRole(roles: Role[], nextPath = '/app'): Promise<CurrentUser> {
  const user = await requireUser(nextPath);
  if (user.role !== 'ADMIN' && !roles.includes(user.role)) {
    redirect('/app?erro=sem-permissao');
  }
  return user;
}

/** Exige plano Premium; caso contrário leva à página de upgrade. */
export async function requirePremium(nextPath = '/app'): Promise<CurrentUser> {
  const user = await requireUser(nextPath);
  if (!hasPremium(user)) redirect('/app/premium?bloqueado=1');
  return user;
}
