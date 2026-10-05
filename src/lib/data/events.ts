import 'server-only';
import { prisma } from '@/lib/prisma';

/** Campos exibidos nos cards/listas de eventos, com investidores confirmados e total de inscritos. */
const eventListSelect = {
  id: true,
  title: true,
  type: true,
  origin: true,
  startsAt: true,
  endsAt: true,
  location: true,
  isOnline: true,
  capacity: true,
  priorityUntil: true,
  attendances: {
    where: { user: { role: 'INVESTOR' as const } },
    select: {
      user: { select: { id: true, name: true, investor: { select: { company: true } } } },
    },
  },
  _count: { select: { attendances: true } },
} as const;

export type EventFilter = 'upcoming' | 'past' | 'all';

export async function listEvents(filter: EventFilter = 'upcoming', limit?: number) {
  const now = new Date();
  return prisma.event.findMany({
    where:
      filter === 'upcoming'
        ? { startsAt: { gte: now } }
        : filter === 'past'
          ? { startsAt: { lt: now } }
          : {},
    orderBy: { startsAt: filter === 'past' ? 'desc' : 'asc' },
    take: limit,
    select: eventListSelect,
  });
}

export type EventListItem = Awaited<ReturnType<typeof listEvents>>[number];

export async function getEventById(id: string) {
  return prisma.event.findUnique({
    where: { id },
    include: {
      organizer: { select: { id: true, name: true } },
      attendances: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              role: true,
              investor: { select: { company: true } },
              startup: { select: { name: true } },
              professional: { select: { headline: true } },
            },
          },
        },
      },
    },
  });
}

export type EventDetail = NonNullable<Awaited<ReturnType<typeof getEventById>>>;

/** Eventos em que o usuário confirmou presença (para o painel). */
export async function listUserEvents(userId: string, limit = 5) {
  return prisma.eventAttendance.findMany({
    where: { userId, event: { startsAt: { gte: new Date() } } },
    orderBy: { event: { startsAt: 'asc' } },
    take: limit,
    select: { event: { select: { id: true, title: true, startsAt: true, type: true } } },
  });
}
