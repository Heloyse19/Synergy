import 'server-only';
import { headers } from 'next/headers';

/** IP do cliente (atrás da Cloudflare vem em CF-Connecting-IP; senão X-Forwarded-For). */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get('cf-connecting-ip') ??
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    h.get('x-real-ip') ??
    'unknown'
  );
}
