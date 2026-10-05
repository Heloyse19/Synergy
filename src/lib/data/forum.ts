import 'server-only';
import { prisma } from '@/lib/prisma';

const authorSelect = {
  id: true,
  name: true,
  role: true,
  startup: { select: { name: true } },
} as const;

export async function listForumPosts(limit = 50) {
  return prisma.forumPost.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      title: true,
      content: true,
      createdAt: true,
      author: { select: authorSelect },
      _count: { select: { replies: true } },
    },
  });
}

export type ForumPostListItem = Awaited<ReturnType<typeof listForumPosts>>[number];

export async function getForumPostById(id: string) {
  return prisma.forumPost.findUnique({
    where: { id },
    include: {
      author: { select: authorSelect },
      replies: {
        orderBy: { createdAt: 'asc' },
        include: { author: { select: authorSelect } },
      },
    },
  });
}

export type ForumPostDetail = NonNullable<Awaited<ReturnType<typeof getForumPostById>>>;
