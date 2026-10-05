// Proxy (antigo middleware): verificação OTIMISTA da sessão para redirecionar cedo.
// A verificação definitiva acontece na DAL (src/lib/auth/dal.ts) dentro de cada página/action.
import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE } from '@/lib/auth/constants';
import { verifySessionToken } from '@/lib/auth/token';

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token, process.env.SESSION_SECRET);

  const isProtected = pathname === '/app' || pathname.startsWith('/app/');
  const isAuthPage = pathname === '/login' || pathname === '/cadastro';

  if (isProtected && !session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', `${pathname}${search}`);
    const response = NextResponse.redirect(loginUrl);
    // Cookie inválido/expirado: remove para não ficar em loop.
    if (token) response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  if (isAuthPage && session) {
    return NextResponse.redirect(new URL('/app', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/app/:path*', '/login', '/cadastro'],
};
