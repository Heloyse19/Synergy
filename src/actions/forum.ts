'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth/dal';
import { hasPremium } from '@/lib/plan';
import { forumPostSchema, forumReplySchema } from '@/lib/validations/forum';
import {
  errorState,
  formValues,
  successState,
  validationError,
  type ActionState,
} from '@/lib/action-state';

const PREMIUM_ONLY = 'A comunidade é exclusiva do plano Premium.';

export async function createForumPost(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return errorState('Faça login para publicar.');
  if (!hasPremium(user)) return errorState(PREMIUM_ONLY);

  const values = formValues(formData, ['title', 'content']);
  const parsed = forumPostSchema.safeParse({
    title: formData.get('title'),
    content: formData.get('content'),
  });
  if (!parsed.success) return validationError(parsed.error, values);

  const post = await prisma.forumPost.create({
    data: { ...parsed.data, authorId: user.id },
    select: { id: true },
  });

  revalidatePath('/app/comunidade');
  redirect(`/app/comunidade/${post.id}`);
}

export async function createForumReply(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return errorState('Faça login para responder.');
  if (!hasPremium(user)) return errorState(PREMIUM_ONLY);

  const postId = String(formData.get('postId') ?? '');
  const parsed = forumReplySchema.safeParse({ content: formData.get('content') });
  if (!parsed.success) return validationError(parsed.error, formValues(formData, ['content']));

  const post = await prisma.forumPost.findUnique({ where: { id: postId }, select: { id: true } });
  if (!post) return errorState('Publicação não encontrada.');

  await prisma.forumReply.create({
    data: { content: parsed.data.content, postId, authorId: user.id },
  });

  revalidatePath(`/app/comunidade/${postId}`);
  revalidatePath('/app/comunidade');
  return successState('Resposta publicada.');
}

/** Autor ou administrador podem excluir uma publicação (com suas respostas). */
export async function deleteForumPost(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/app/comunidade');

  const postId = String(formData.get('postId') ?? '');
  await prisma.forumPost.deleteMany({
    where: { id: postId, ...(user.role === 'ADMIN' ? {} : { authorId: user.id }) },
  });

  revalidatePath('/app/comunidade');
  redirect('/app/comunidade?excluida=1');
}

export async function deleteForumReply(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/app/comunidade');

  const replyId = String(formData.get('replyId') ?? '');
  const postId = String(formData.get('postId') ?? '');
  await prisma.forumReply.deleteMany({
    where: { id: replyId, ...(user.role === 'ADMIN' ? {} : { authorId: user.id }) },
  });

  revalidatePath(`/app/comunidade/${postId}`);
}
