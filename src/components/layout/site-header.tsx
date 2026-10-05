import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/dal';
import { buttonVariants } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { MobileNav } from './mobile-nav';
import { UserMenu } from './user-menu';

export const publicLinks = [
  { href: '/eventos', label: 'Eventos' },
  { href: '/vagas', label: 'Vagas' },
  { href: '/app/comunidade', label: 'Comunidade' },
  { href: '/app/premium', label: 'Premium' },
];

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <span className="flex size-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Sparkles className="size-4" aria-hidden />
          </span>
          Synergy
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Principal">
          {publicLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <UserMenu user={user} />
          ) : (
            <>
              <Link href="/login" className={buttonVariants({ variant: 'ghost' })}>
                Entrar
              </Link>
              <Link href="/cadastro" className={buttonVariants()}>
                Criar conta
              </Link>
            </>
          )}
        </div>

        <MobileNav links={publicLinks} user={user ? { name: user.name } : null} />
      </Container>
    </header>
  );
}
