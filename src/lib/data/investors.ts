import 'server-only';
import { prisma } from '@/lib/prisma';

/** Nichos que o investidor acompanha (para destacar startups e filtrar por "Dar match"). */
export async function listInvestorInterestNicheIds(investorProfileId: string): Promise<number[]> {
  const interests = await prisma.investorInterest.findMany({
    where: { investorId: investorProfileId },
    select: { nicheId: true },
  });
  return interests.map((interest) => interest.nicheId);
}
