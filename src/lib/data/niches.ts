import 'server-only';
import { prisma } from '@/lib/prisma';

export async function listNiches() {
  return prisma.niche.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } });
}
