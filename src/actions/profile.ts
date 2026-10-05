'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth/dal';
import {
  accountSchema,
  investorProfileSchema,
  professionalProfileSchema,
  startupProfileSchema,
} from '@/lib/validations/profile';
import {
  errorState,
  formValues,
  successState,
  validationError,
  type ActionState,
} from '@/lib/action-state';

const NOT_LOGGED = 'Faça login para editar o perfil.';

function pick(formData: FormData, fields: string[]) {
  return Object.fromEntries(fields.map((field) => [field, formData.get(field)]));
}

export async function updateAccount(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return errorState(NOT_LOGGED);

  const values = formValues(formData, ['name']);
  const parsed = accountSchema.safeParse(pick(formData, ['name']));
  if (!parsed.success) return validationError(parsed.error, values);

  await prisma.user.update({ where: { id: user.id }, data: { name: parsed.data.name } });
  revalidatePath('/', 'layout');
  return successState('Dados da conta atualizados.');
}

const STARTUP_FIELDS = ['name', 'pitch', 'description', 'website', 'city', 'stage', 'nicheId'];

export async function updateStartupProfile(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return errorState(NOT_LOGGED);
  if (!user.startup) return errorState('Esta conta não possui perfil de startup.');

  const values = formValues(formData, STARTUP_FIELDS);
  const parsed = startupProfileSchema.safeParse(pick(formData, STARTUP_FIELDS));
  if (!parsed.success) return validationError(parsed.error, values);

  const { nicheId, ...rest } = parsed.data;
  const niche = nicheId
    ? await prisma.niche.findUnique({ where: { id: nicheId }, select: { id: true } })
    : null;

  await prisma.startupProfile.update({
    where: { id: user.startup.id },
    data: {
      ...rest,
      pitch: rest.pitch ?? null,
      description: rest.description ?? null,
      website: rest.website ?? null,
      city: rest.city ?? null,
      nicheId: niche?.id ?? null,
    },
  });

  revalidatePath('/', 'layout');
  return successState('Perfil da startup atualizado.');
}

const INVESTOR_FIELDS = ['company', 'thesis', 'ticketMin', 'ticketMax', 'linkedin'];

export async function updateInvestorProfile(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return errorState(NOT_LOGGED);
  if (!user.investor) return errorState('Esta conta não possui perfil de investidor.');

  const values = formValues(formData, INVESTOR_FIELDS);
  const parsed = investorProfileSchema.safeParse(pick(formData, INVESTOR_FIELDS));
  if (!parsed.success) return validationError(parsed.error, values);

  await prisma.investorProfile.update({
    where: { id: user.investor.id },
    data: {
      company: parsed.data.company ?? null,
      thesis: parsed.data.thesis ?? null,
      ticketMin: parsed.data.ticketMin ?? null,
      ticketMax: parsed.data.ticketMax ?? null,
      linkedin: parsed.data.linkedin ?? null,
    },
  });

  revalidatePath('/', 'layout');
  return successState('Perfil de investidor atualizado.');
}

const PROFESSIONAL_FIELDS = [
  'headline',
  'bio',
  'skills',
  'linkedin',
  'portfolio',
  'availableForFreelance',
];

export async function updateProfessionalProfile(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return errorState(NOT_LOGGED);
  if (!user.professional) return errorState('Esta conta não possui perfil profissional.');

  const values = formValues(formData, PROFESSIONAL_FIELDS);
  const parsed = professionalProfileSchema.safeParse(pick(formData, PROFESSIONAL_FIELDS));
  if (!parsed.success) return validationError(parsed.error, values);

  await prisma.professionalProfile.update({
    where: { id: user.professional.id },
    data: {
      headline: parsed.data.headline ?? null,
      bio: parsed.data.bio ?? null,
      skills: parsed.data.skills ?? null,
      linkedin: parsed.data.linkedin ?? null,
      portfolio: parsed.data.portfolio ?? null,
      availableForFreelance: parsed.data.availableForFreelance,
    },
  });

  revalidatePath('/', 'layout');
  return successState('Perfil profissional atualizado.');
}
