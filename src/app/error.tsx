'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="flex flex-col items-center py-24 text-center">
      <p className="text-sm font-semibold text-red-600">Algo deu errado</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900">
        Não foi possível carregar esta página
      </h1>
      <p className="mt-2 max-w-md text-slate-600">
        Tente novamente em instantes. Se o problema persistir, avise a equipe.
        {error.digest ? (
          <span className="mt-2 block font-mono text-xs text-slate-400">
            Código: {error.digest}
          </span>
        ) : null}
      </p>
      <Button className="mt-6" onClick={() => reset()}>
        Tentar novamente
      </Button>
    </Container>
  );
}
