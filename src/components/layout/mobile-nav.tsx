'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { logout } from '@/actions/auth';
import { Button, buttonVariants } from '@/components/ui/button';

type MobileNavProps = {
  links: Array<{ href: string; label: string }>;
  user: { name: string } | null;
};

export function MobileNav({ links, user }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="sm"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? 'Fechar menu' : 'Abrir menu'}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
      </Button>

      {open ? (
        <div
          id="mobile-menu"
          className="absolute inset-x-0 top-16 border-b border-slate-200 bg-white p-4 shadow-lg"
        >
          <nav className="flex flex-col gap-1" aria-label="Menu móvel">
            {user ? (
              <Link
                href="/app"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50"
              >
                Painel
              </Link>
            ) : null}
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-3 flex flex-col gap-2 border-t border-slate-200 pt-3">
            {user ? (
              <>
                <Link
                  href="/app/perfil"
                  onClick={() => setOpen(false)}
                  className={buttonVariants({ variant: 'outline', className: 'w-full' })}
                >
                  Meu perfil ({user.name})
                </Link>
                <form action={logout}>
                  <Button type="submit" variant="ghost" className="w-full">
                    Sair
                  </Button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className={buttonVariants({ variant: 'outline', className: 'w-full' })}
                >
                  Entrar
                </Link>
                <Link
                  href="/cadastro"
                  onClick={() => setOpen(false)}
                  className={buttonVariants({ className: 'w-full' })}
                >
                  Criar conta
                </Link>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
