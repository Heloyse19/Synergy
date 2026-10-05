import type { Metadata } from 'next';
import Link from 'next/link';
import { MessageSquare, MessagesSquare } from 'lucide-react';
import { requireUser } from '@/lib/auth/dal';
import { listForumPosts } from '@/lib/data/forum';
import { formatRelative } from '@/lib/format';
import { roleLabels } from '@/lib/labels';
import { hasPremium } from '@/lib/plan';
import { PremiumGate } from '@/components/premium/premium-gate';
import { Alert } from '@/components/ui/alert';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { NewPostForm } from './new-post-form';

export const metadata: Metadata = { title: 'Comunidade' };

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ excluida?: string }>;
}) {
  const [user, params] = await Promise.all([requireUser('/app/comunidade'), searchParams]);

  if (!hasPremium(user)) {
    return (
      <div className="space-y-8">
        <PageHeader eyebrow="Comunidade" title="Fórum de suporte entre startups" />
        <PremiumGate
          feature="A comunidade"
          description="Troque experiências, tire dúvidas sobre burocracia e captação e receba apoio de outras startups registradas."
        />
      </div>
    );
  }

  const posts = await listForumPosts();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Comunidade"
        title="Fórum de suporte entre startups"
        description="Um espaço de apoio mútuo: compartilhe aprendizados, peça ajuda e responda a outras startups."
        actions={<NewPostForm />}
      />
      {params.excluida ? <Alert variant="success">Publicação excluída.</Alert> : null}

      {posts.length === 0 ? (
        <EmptyState
          icon={MessagesSquare}
          title="Ainda não há publicações"
          description="Seja a primeira pessoa a abrir uma conversa com a comunidade."
        />
      ) : (
        <ul className="space-y-3">
          {posts.map((post) => (
            <li key={post.id}>
              <Card className="transition-colors hover:border-brand-300">
                <CardContent className="flex gap-4 p-5">
                  <Avatar name={post.author.name} />
                  <div className="min-w-0 flex-1 space-y-1">
                    <Link
                      href={`/app/comunidade/${post.id}`}
                      className="block text-lg font-semibold text-slate-900 hover:text-brand-700"
                    >
                      {post.title}
                    </Link>
                    <p className="line-clamp-2 text-sm text-slate-600">{post.content}</p>
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-500">
                      <span className="font-medium text-slate-700">
                        {post.author.startup?.name ?? post.author.name}
                      </span>
                      <Badge variant="default">{roleLabels[post.author.role]}</Badge>
                      <span>· {formatRelative(post.createdAt)}</span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="size-3.5" aria-hidden />
                        {post._count.replies} resposta{post._count.replies === 1 ? '' : 's'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
