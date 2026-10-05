import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { listNiches } from '@/lib/data/niches';
import { turnstileSiteKey } from '@/lib/turnstile';
import { RegisterForm } from './register-form';

export const metadata: Metadata = { title: 'Criar conta' };

export default async function RegisterPage() {
  const niches = await listNiches();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Criar conta</CardTitle>
        <CardDescription>
          Escolha seu perfil para personalizar a experiência. O plano gratuito já dá acesso a
          eventos e vagas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RegisterForm niches={niches} turnstileSiteKey={turnstileSiteKey()} />
        <p className="text-center text-sm text-slate-600">
          Já tem conta?{' '}
          <Link href="/login" className="font-medium text-brand-600 hover:underline">
            Entrar
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
