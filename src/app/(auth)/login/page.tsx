import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { turnstileSiteKey } from '@/lib/turnstile';
import { safeInternalPath } from '@/lib/utils';
import { DemoAccounts } from '../demo-accounts';
import { LoginForm } from './login-form';

export const metadata: Metadata = { title: 'Entrar' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Entrar</CardTitle>
        <CardDescription>
          Acesse seu painel para acompanhar eventos, vagas e a comunidade.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <LoginForm next={safeInternalPath(next)} turnstileSiteKey={turnstileSiteKey()} />
        <p className="text-center text-sm text-slate-600">
          Ainda não tem conta?{' '}
          <Link href="/cadastro" className="font-medium text-brand-600 hover:underline">
            Criar conta gratuita
          </Link>
        </p>
        <DemoAccounts />
      </CardContent>
    </Card>
  );
}
