import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { Container } from '@/components/ui/container';

export default function NotFound() {
  return (
    <Container className="flex flex-col items-center py-24 text-center">
      <p className="text-sm font-semibold text-brand-600">404</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900">Página não encontrada</h1>
      <p className="mt-2 max-w-md text-slate-600">
        O endereço pode estar errado ou o conteúdo foi removido.
      </p>
      <Link href="/" className={buttonVariants({ className: 'mt-6' })}>
        Voltar ao início
      </Link>
    </Container>
  );
}
