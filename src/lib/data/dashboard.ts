import 'server-only';
import { prisma } from '@/lib/prisma';

/** Números exibidos nos cards do painel. */
export async function getDashboardStats() {
  const now = new Date();
  const [upcomingEvents, activeJobs, startups, investors, forumPosts] = await Promise.all([
    prisma.event.count({ where: { startsAt: { gte: now } } }),
    prisma.jobPosting.count({ where: { isActive: true } }),
    prisma.startupProfile.count(),
    prisma.investorProfile.count(),
    prisma.forumPost.count(),
  ]);
  return { upcomingEvents, activeJobs, startups, investors, forumPosts };
}
