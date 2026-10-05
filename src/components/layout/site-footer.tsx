import Link from 'next/link';
import { Container } from '@/components/ui/container';

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <Container className="flex flex-col gap-4 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>
          <span className="font-semibold text-slate-700">Synergy</span> · Projeto Integrador TADS ·
          Conectando startups, profissionais e investidores anjo.
        </p>
        <nav className="flex flex-wrap gap-4" aria-label="Rodapé">
          <Link href="/eventos" className="hover:text-slate-900">
            Eventos
          </Link>
          <Link href="/vagas" className="hover:text-slate-900">
            Vagas
          </Link>
          <Link href="/app/premium" className="hover:text-slate-900">
            Premium
          </Link>
          <a
            href="https://github.com/Heloyse19/Synergy"
            className="hover:text-slate-900"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        </nav>
      </Container>
    </footer>
  );
}
