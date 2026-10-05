'use client';

import { useEffect, useRef } from 'react';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';

/**
 * Widget Cloudflare Turnstile. Injeta o campo oculto "cf-turnstile-response" no formulário.
 * Recebe `resetKey` para gerar um novo token após uma tentativa com erro (tokens são de uso único).
 */
export function TurnstileWidget({
  siteKey,
  resetKey,
}: {
  siteKey: string | null;
  resetKey: unknown;
}) {
  const ref = useRef<TurnstileInstance | null>(null);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    ref.current?.reset();
  }, [resetKey]);

  if (!siteKey) return null;

  return <Turnstile ref={ref} siteKey={siteKey} options={{ language: 'pt-br', theme: 'light' }} />;
}
