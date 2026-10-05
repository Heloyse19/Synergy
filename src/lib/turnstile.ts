import 'server-only';

/** Turnstile só é exigido quando as duas chaves estão configuradas. */
export function isTurnstileEnabled(): boolean {
  return Boolean(process.env.TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY);
}

export function turnstileSiteKey(): string | null {
  return isTurnstileEnabled() ? (process.env.TURNSTILE_SITE_KEY ?? null) : null;
}

/**
 * Valida o token do widget Turnstile no servidor.
 * Docs: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */
export async function verifyTurnstileToken(
  token: FormDataEntryValue | null,
  remoteIp?: string | null,
): Promise<boolean> {
  if (!isTurnstileEnabled()) return true;
  if (typeof token !== 'string' || !token) return false;

  const body = new URLSearchParams({
    secret: process.env.TURNSTILE_SECRET_KEY as string,
    response: token,
  });
  if (remoteIp) body.set('remoteip', remoteIp);

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: AbortSignal.timeout(5000),
    });
    const data = (await response.json()) as { success?: boolean };
    return data.success === true;
  } catch (error) {
    console.error('Falha ao validar Turnstile', error);
    return false;
  }
}
