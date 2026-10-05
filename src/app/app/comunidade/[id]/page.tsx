import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { deleteForumPost, deleteForumReply } from '@/actions/forum';
import { requirePremium } from '@/lib/auth/dal';
import { getForumPostById } from '@/lib/data/forum';
import { formatDateTime } from '@/lib/format';
import { roleLabels } from '@/lib/labels';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SubmitButton } from '@/components/ui/submit-button';
import { ReplyForm } from './reply-form';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const post = await getForumPostById(id);
  return { title: post?.title ?? 'Comunidade' };
}

export default async function CommunityPostPage({ params }: Props) {
  const { id } = await params;
  const user = await requirePremium(`/app/comunidade/${id}`);
  const post = await getForumPostById(id);
  if (!post) notFound();

  const canDeletePost = user.role === 'ADMIN' || post.author.id === user.id;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/app/comunidade"
        className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Voltar para a comunidade
      </Link>

      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex items-start gap-4">
            <Avatar name={post.author.name} />
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-slate-900">{post.title}</h1>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="font-medium text-slate-700">
                  {post.author.startup?.name ?? post.author.name}
                </span>
                <Badge variant="default">{roleLabels[post.author.role]}</Badge>
                <span>· {formatDateTime(post.createdAt)}</span>
              </p>
            </div>
          </div>
          <div className="prose-plain text-slate-700">{post.content}</div>
          {canDeletePost ? (
            <form action={deleteForumPost} className="border-t border-slate-100 pt-3">
              <input type="hidden" name="postId" value={post.id} />
              <SubmitButton
                variant="ghost"
                size="sm"
                className="text-red-600 hover:bg-red-50"
                pendingText="Excluindo..."
              >
                <Trash2 className="size-4" aria-hidden />
                Excluir publicação
              </SubmitButton>
            </form>
          ) : null}
        </CardContent>
      </Card>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">
          {post.replies.length} resposta{post.replies.length === 1 ? '' : 's'}
        </h2>
        {post.replies.map((reply) => {
          const canDelete = user.role === 'ADMIN' || reply.author.id === user.id;
          return (
            <Card key={reply.id}>
              <CardContent className="flex gap-4 p-5">
                <Avatar name={reply.author.name} className="size-8 bg-slate-500 text-xs" />
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-medium text-slate-700">
                      {reply.author.startup?.name ?? reply.author.name}
                    </span>
                    <Badge variant="default">{roleLabels[reply.author.role]}</Badge>
                    <span>· {formatDateTime(reply.createdAt)}</span>
                  </p>
                  <div className="prose-plain text-sm text-slate-700">{reply.content}</div>
                  {canDelete ? (
                    <form action={deleteForumReply}>
                      <input type="hidden" name="replyId" value={reply.id} />
                      <input type="hidden" name="postId" value={post.id} />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-red-600 hover:bg-red-50"
                      >
                        Excluir
                      </Button>
                    </form>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          );
        })}

        <Card>
          <CardContent className="p-6">
            <ReplyForm postId={post.id} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
