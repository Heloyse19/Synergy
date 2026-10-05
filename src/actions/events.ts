'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth/dal';
import { canRegisterForEvent, registrationDenialMessages } from '@/lib/plan';
import { eventSchema } from '@/lib/validations/events';
import {
  errorState,
  formValues,
  successState,
  validationError,
  type ActionState,
} from '@/lib/action-state';

/** Inscreve/cancela a presença do usuário logado em um evento. */
export async function toggleAttendance(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return errorState('Faça login para participar de eventos.');

  const eventId = String(formData.get('eventId') ?? '');
  const intent = formData.get('intent') === 'leave' ? 'leave' : 'join';

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      startsAt: true,
      priorityUntil: true,
      capacity: true,
      _count: { select: { attendances: true } },
    },
  });
  if (!event) return errorState('Evento não encontrado.');

  const existing = await prisma.eventAttendance.findUnique({
    where: { eventId_userId: { eventId, userId: user.id } },
    select: { id: true },
  });

  if (intent === 'leave') {
    if (existing) await prisma.eventAttendance.delete({ where: { id: existing.id } });
    revalidatePath(`/eventos/${eventId}`);
    revalidatePath('/eventos');
    return successState(user.role === 'INVESTOR' ? 'Presença cancelada.' : 'Inscrição cancelada.');
  }

  const check = canRegisterForEvent({
    event,
    attendeeCount: event._count.attendances,
    user,
    alreadyRegistered: Boolean(existing),
  });
  if (!check.allowed) return errorState(registrationDenialMessages[check.reason]);

  await prisma.eventAttendance.create({ data: { eventId, userId: user.id } });
  revalidatePath(`/eventos/${eventId}`);
  revalidatePath('/eventos');
  return successState(
    user.role === 'INVESTOR'
      ? 'Presença confirmada! Ela aparece publicamente para as startups.'
      : 'Inscrição confirmada!',
  );
}

const EVENT_FIELDS = [
  'title',
  'description',
  'type',
  'origin',
  'startsAt',
  'endsAt',
  'location',
  'isOnline',
  'externalUrl',
  'capacity',
  'priorityUntil',
];

/** Criação de eventos (somente administradores). */
export async function createEvent(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN')
    return errorState('Apenas administradores podem criar eventos.');

  const values = formValues(formData, EVENT_FIELDS);
  const parsed = eventSchema.safeParse(
    Object.fromEntries(EVENT_FIELDS.map((f) => [f, formData.get(f)])),
  );
  if (!parsed.success) return validationError(parsed.error, values);

  const event = await prisma.event.create({
    data: { ...parsed.data, organizerId: user.id },
    select: { id: true },
  });

  revalidatePath('/eventos');
  revalidatePath('/app/eventos');
  redirect(`/eventos/${event.id}`);
}

/** Exclusão de eventos (somente administradores). */
export async function deleteEvent(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') redirect('/app?erro=sem-permissao');

  const eventId = String(formData.get('eventId') ?? '');
  await prisma.event.deleteMany({ where: { id: eventId } });

  revalidatePath('/eventos');
  redirect('/app/eventos');
}
