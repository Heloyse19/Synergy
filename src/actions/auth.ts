'use server';

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { createSession, deleteSession } from '@/lib/auth/session';
import { DUMMY_HASH, hashPassword, verifyPassword } from '@/lib/auth/password';
import { loginSchema, registerSchema } from '@/lib/validations/auth';
import { errorState, formValues, validationError, type ActionState } from '@/lib/action-state';
import { limiters } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/request';
import { verifyTurnstileToken } from '@/lib/turnstile';
import { safeInternalPath } from '@/lib/utils';

const REGISTER_FIELDS = ['name', 'email', 'role', 'startupName', 'nicheId', 'company', 'headline'];

export async function register(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const values = formValues(formData, REGISTER_FIELDS);
  const ip = await getClientIp();

  if (!limiters.register.check(`register:${ip}`).allowed) {
    return errorState('Muitas tentativas de cadastro. Tente novamente mais tarde.', values);
  }

  if (!(await verifyTurnstileToken(formData.get('cf-turnstile-response'), ip))) {
    return errorState(
      'Não conseguimos confirmar que você é humano. Recarregue a página e tente de novo.',
      values,
    );
  }

  const parsed = registerSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    role: formData.get('role'),
    startupName: formData.get('startupName'),
    nicheId: formData.get('nicheId'),
    company: formData.get('company'),
    headline: formData.get('headline'),
  });
  if (!parsed.success) return validationError(parsed.error, values);

  const data = parsed.data;

  const existing = await prisma.user.findUnique({
    where: { email: data.email },
    select: { id: true },
  });
  if (existing) {
    return {
      status: 'error',
      message: 'Já existe uma conta com este e-mail. Faça login ou use outro e-mail.',
      fieldErrors: { email: ['E-mail já cadastrado'] },
      values,
    };
  }

  // Garante que o nicho informado existe (evita erro de chave estrangeira).
  let nicheId: number | undefined;
  if (data.nicheId) {
    const niche = await prisma.niche.findUnique({
      where: { id: data.nicheId },
      select: { id: true },
    });
    nicheId = niche?.id;
  }

  const passwordHash = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role,
      startup:
        data.role === 'STARTUP'
          ? { create: { name: data.startupName as string, nicheId } }
          : undefined,
      investor: data.role === 'INVESTOR' ? { create: { company: data.company } } : undefined,
      professional:
        data.role === 'PROFESSIONAL' ? { create: { headline: data.headline } } : undefined,
    },
    select: { id: true, role: true },
  });

  await createSession(user.id, user.role);
  redirect('/app?bem-vindo=1');
}

export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const values = formValues(formData, ['email']);
  const nextPath = safeInternalPath(formData.get('next')?.toString());
  const ip = await getClientIp();

  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) return validationError(parsed.error, values);

  const limitKey = `login:${ip}:${parsed.data.email}`;
  const limit = limiters.login.check(limitKey);
  if (!limit.allowed) {
    const minutes = Math.max(1, Math.ceil(limit.retryAfterMs / 60_000));
    return errorState(
      `Muitas tentativas de login. Aguarde ${minutes} min e tente novamente.`,
      values,
    );
  }

  if (!(await verifyTurnstileToken(formData.get('cf-turnstile-response'), ip))) {
    return errorState(
      'Não conseguimos confirmar que você é humano. Recarregue a página e tente de novo.',
      values,
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, role: true, passwordHash: true },
  });

  // Compara sempre (mesmo sem usuário) para não revelar quais e-mails existem pelo tempo de resposta.
  const passwordOk = await verifyPassword(parsed.data.password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !passwordOk) {
    return errorState('E-mail ou senha inválidos.', values);
  }

  limiters.login.reset(limitKey);
  await createSession(user.id, user.role);
  redirect(nextPath);
}

export async function logout(): Promise<void> {
  await deleteSession();
  redirect('/');
}
