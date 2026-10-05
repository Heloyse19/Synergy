'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth/dal';

/**
 * SIMULAÇÃO de upgrade: não há cobrança. A integração com um gateway de pagamento
 * (Stripe, Mercado Pago, Asaas...) está no backlog — ver docs/roadmap-do-produto.md.
 */
export async function activatePremium(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/app/premium');

  await prisma.user.update({
    where: { id: user.id },
    data: { plan: 'PREMIUM', planActivatedAt: new Date() },
  });

  revalidatePath('/', 'layout');
  redirect('/app/premium?ativado=1');
}

export async function cancelPremium(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/app/premium');

  await prisma.user.update({
    where: { id: user.id },
    data: { plan: 'FREE', planActivatedAt: null },
  });

  revalidatePath('/', 'layout');
  redirect('/app/premium?cancelado=1');
}
