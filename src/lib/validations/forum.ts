import { z } from 'zod';

export const forumPostSchema = z.object({
  title: z
    .string({ error: 'Informe o título' })
    .trim()
    .min(3, 'O título deve ter pelo menos 3 caracteres')
    .max(120, 'Máximo de 120 caracteres'),
  content: z
    .string({ error: 'Escreva o conteúdo' })
    .trim()
    .min(10, 'Escreva pelo menos 10 caracteres')
    .max(5000, 'Máximo de 5000 caracteres'),
});

export const forumReplySchema = z.object({
  content: z
    .string({ error: 'Escreva a resposta' })
    .trim()
    .min(2, 'Escreva pelo menos 2 caracteres')
    .max(2000, 'Máximo de 2000 caracteres'),
});
