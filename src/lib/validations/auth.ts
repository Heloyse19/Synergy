import { z } from 'zod';
import { emailSchema, optionalInt, optionalText, positiveIntListSchema } from './shared';

/** Perfis que podem ser escolhidos no cadastro (ADMIN só via seed/banco). */
export const registerRoles = ['STARTUP', 'INVESTOR', 'PROFESSIONAL'] as const;

export const passwordSchema = z
  .string({ error: 'Informe uma senha' })
  .min(8, 'A senha deve ter pelo menos 8 caracteres')
  .max(72, 'A senha deve ter no máximo 72 caracteres');

export const registerSchema = z
  .object({
    name: z
      .string({ error: 'Informe seu nome' })
      .trim()
      .min(2, 'Informe seu nome completo')
      .max(80, 'Máximo de 80 caracteres'),
    email: emailSchema,
    password: passwordSchema,
    role: z.enum(registerRoles, { error: 'Escolha um perfil' }),
    // Campos específicos por perfil
    startupName: optionalText(80),
    nicheId: optionalInt,
    company: optionalText(80),
    headline: optionalText(120),
    // Categorias de interesse do investidor (select múltiplo)
    interestNicheIds: positiveIntListSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === 'STARTUP' && !data.startupName) {
      ctx.addIssue({ code: 'custom', path: ['startupName'], message: 'Informe o nome da startup' });
    }
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string({ error: 'Informe a senha' }).min(1, 'Informe a senha').max(72),
});

export type LoginInput = z.infer<typeof loginSchema>;
