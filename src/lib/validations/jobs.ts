import { z } from 'zod';
import { JobType, WorkMode } from '@/generated/prisma/enums';
import { checkbox, optionalText } from './shared';

export const jobSchema = z.object({
  title: z
    .string({ error: 'Informe o título da vaga' })
    .trim()
    .min(3, 'O título deve ter pelo menos 3 caracteres')
    .max(100, 'Máximo de 100 caracteres'),
  description: z
    .string({ error: 'Descreva a vaga' })
    .trim()
    .min(20, 'Descreva a vaga com pelo menos 20 caracteres')
    .max(5000, 'Máximo de 5000 caracteres'),
  type: z.enum(JobType, { error: 'Escolha o tipo de contratação' }),
  workMode: z.enum(WorkMode, { error: 'Escolha o modelo de trabalho' }),
  location: optionalText(100),
  salaryRange: optionalText(60),
  skills: optionalText(200),
  isActive: checkbox,
});

export type JobInput = z.infer<typeof jobSchema>;
