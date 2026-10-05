import { z } from 'zod';
import { EventOrigin, EventType } from '@/generated/prisma/enums';
import {
  checkbox,
  optionalDateTimeLocal,
  optionalInt,
  optionalText,
  optionalUrl,
  requiredDateTimeLocal,
} from './shared';

export const eventSchema = z
  .object({
    title: z
      .string({ error: 'Informe o título' })
      .trim()
      .min(3, 'O título deve ter pelo menos 3 caracteres')
      .max(120, 'Máximo de 120 caracteres'),
    description: z
      .string({ error: 'Descreva o evento' })
      .trim()
      .min(20, 'Descreva o evento com pelo menos 20 caracteres')
      .max(5000, 'Máximo de 5000 caracteres'),
    type: z.enum(EventType, { error: 'Escolha o tipo do evento' }),
    origin: z.enum(EventOrigin, { error: 'Escolha a origem do evento' }),
    startsAt: requiredDateTimeLocal,
    endsAt: optionalDateTimeLocal,
    location: optionalText(160),
    isOnline: checkbox,
    externalUrl: optionalUrl,
    capacity: optionalInt,
    priorityUntil: optionalDateTimeLocal,
  })
  .superRefine((data, ctx) => {
    if (data.endsAt && data.endsAt.getTime() < data.startsAt.getTime()) {
      ctx.addIssue({
        code: 'custom',
        path: ['endsAt'],
        message: 'O término deve ser depois do início',
      });
    }
    if (data.priorityUntil && data.priorityUntil.getTime() > data.startsAt.getTime()) {
      ctx.addIssue({
        code: 'custom',
        path: ['priorityUntil'],
        message: 'A janela de prioridade deve terminar antes do início do evento',
      });
    }
  });

export type EventInput = z.infer<typeof eventSchema>;
