import 'server-only';
import { prisma } from '@/lib/prisma';

export async function listTemplates() {
  return prisma.landingPageTemplate.findMany({ orderBy: { id: 'asc' } });
}
