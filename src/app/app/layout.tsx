import { requireUser } from '@/lib/auth/dal';
import { AppNav, type AppNavItem } from '@/components/layout/app-nav';
import { Container } from '@/components/ui/container';

/** Área logada (/app/*). O proxy já redireciona anônimos, mas a DAL garante a verificação definitiva. */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  const items: AppNavItem[] = [
    { href: '/app', label: 'Painel', exact: true },
    { href: '/app/comunidade', label: 'Comunidade' },
    { href: '/app/eventos', label: 'Eventos' },
    { href: '/app/startups', label: 'Explorar startups' },
    { href: '/app/vagas', label: user.role === 'STARTUP' ? 'Minhas vagas' : 'Vagas' },
    { href: '/app/premium', label: 'Premium' },
    { href: '/app/perfil', label: 'Perfil' },
  ];

  return (
    <>
      <div className="border-b border-slate-200 bg-white">
        <Container>
          <AppNav items={items} />
        </Container>
      </div>
      <Container className="py-8">{children}</Container>
    </>
  );
}
