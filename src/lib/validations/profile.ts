import { z } from 'zod';
import { StartupStage } from '@/generated/prisma/enums';
import { checkbox, optionalInt, optionalText, optionalUrl, positiveIntListSchema } from './shared';

export const accountSchema = z.object({
  name: z
    .string({ error: 'Informe seu nome' })
    .trim()
    .min(2, 'Informe seu nome completo')
    .max(80, 'Máximo de 80 caracteres'),
});

export const startupProfileSchema = z.object({
  name: z
    .string({ error: 'Informe o nome da startup' })
    .trim()
    .min(2, 'Informe o nome da startup')
    .max(80, 'Máximo de 80 caracteres'),
  pitch: optionalText(280),
  description: optionalText(5000),
  website: optionalUrl,
  city: optionalText(80),
  stage: z.enum(StartupStage, { error: 'Escolha o estágio' }),
  nicheId: optionalInt,
});

export const investorProfileSchema = z
  .object({
    company: optionalText(80),
    thesis: optionalText(5000),
    ticketMin: optionalInt,
    ticketMax: optionalInt,
    linkedin: optionalUrl,
    interestNicheIds: positiveIntListSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.ticketMin !== undefined &&
      data.ticketMax !== undefined &&
      data.ticketMax < data.ticketMin
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['ticketMax'],
        message: 'O ticket máximo deve ser maior que o mínimo',
      });
    }
  });

export const professionalProfileSchema = z.object({
  headline: optionalText(120),
  bio: optionalText(5000),
  skills: optionalText(200),
  linkedin: optionalUrl,
  portfolio: optionalUrl,
  availableForFreelance: checkbox,
});
