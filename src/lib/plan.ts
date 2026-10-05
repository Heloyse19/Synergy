// Regras de negócio do plano Premium e da prioridade de inscrição em eventos.
// Módulo puro (sem banco) para facilitar testes unitários.
import type { Plan, Role } from '@/generated/prisma/enums';

export type PlanUser = { plan: Plan; role: Role };

export const PREMIUM_FEATURES = [
  {
    title: 'Comunidade de suporte',
    description: 'Fórum exclusivo para trocar experiências e pedir ajuda a outras startups.',
    href: '/app/comunidade',
  },
  {
    title: 'Roadmap burocrático',
    description:
      'Checklist guiado de formalização, tributos, marca e captação, com progresso salvo.',
    href: '/app/roadmap',
  },
  {
    title: 'Templates de landing page',
    description: 'Páginas prontas para apresentar a startup a investidores e captar leads.',
    href: '/app/templates',
  },
  {
    title: 'Prioridade em eventos',
    description: 'Inscrição antecipada em hackathons e pitch days com janela exclusiva.',
    href: '/eventos',
  },
] as const;

/** Administradores sempre têm acesso aos recursos premium. */
export function hasPremium(user: PlanUser): boolean {
  return user.plan === 'PREMIUM' || user.role === 'ADMIN';
}

export type RegistrationDenialReason = 'past' | 'already_registered' | 'priority_window' | 'full';

export type RegistrationCheck =
  { allowed: true } | { allowed: false; reason: RegistrationDenialReason };

export type RegistrationInput = {
  event: { startsAt: Date; priorityUntil: Date | null; capacity: number | null };
  attendeeCount: number;
  user: PlanUser;
  alreadyRegistered: boolean;
  now?: Date;
};

/**
 * Decide se o usuário pode se inscrever/confirmar presença.
 * - Investidores anjo sempre podem confirmar presença (é o sinal público que atrai as startups).
 * - Durante a janela de prioridade (priorityUntil), só contas Premium se inscrevem.
 * - Respeita a capacidade do evento, quando definida.
 */
export function canRegisterForEvent(input: RegistrationInput): RegistrationCheck {
  const now = input.now ?? new Date();
  const { event, user } = input;

  if (input.alreadyRegistered) return { allowed: false, reason: 'already_registered' };
  if (event.startsAt.getTime() < now.getTime()) return { allowed: false, reason: 'past' };
  if (user.role === 'INVESTOR' || user.role === 'ADMIN') return { allowed: true };

  if (event.priorityUntil && now.getTime() < event.priorityUntil.getTime() && !hasPremium(user)) {
    return { allowed: false, reason: 'priority_window' };
  }
  if (event.capacity !== null && input.attendeeCount >= event.capacity) {
    return { allowed: false, reason: 'full' };
  }
  return { allowed: true };
}

export const registrationDenialMessages: Record<RegistrationDenialReason, string> = {
  past: 'Este evento já aconteceu.',
  already_registered: 'Você já está inscrito neste evento.',
  priority_window: 'Inscrições abertas apenas para contas Premium neste momento.',
  full: 'As vagas deste evento estão esgotadas.',
};

/** Indica se a janela de prioridade Premium ainda está ativa. */
export function isPriorityWindowOpen(priorityUntil: Date | null, now: Date = new Date()): boolean {
  return priorityUntil !== null && now.getTime() < priorityUntil.getTime();
}
