import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check, Crown, Minus } from 'lucide-react';
import { activatePremium, cancelPremium } from '@/actions/plan';
import { requireUser } from '@/lib/auth/dal';
import { formatDate } from '@/lib/format';
import { PREMIUM_FEATURES, hasPremium } from '@/lib/plan';
import { Alert } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { SubmitButton } from '@/components/ui/submit-button';

export const metadata: Metadata = { title: 'Premium' };

const comparison = [
  { feature: 'Cadastro e perfil por nicho', free: true, premium: true },
  { feature: 'Eventos com investidores confirmados', free: true, premium: true },
  { feature: 'Mural de vagas (publicar e candidatar-se)', free: true, premium: true },
  { feature: 'Comunidade de suporte entre startups', free: false, premium: true },
  { feature: 'Roadmap burocrático com progresso', free: false, premium: true },
  { feature: 'Templates de landing page para captação', free: false, premium: true },
  { feature: 'Prioridade de inscrição em eventos', free: false, premium: true },
];

export default async function PremiumPage({
  searchParams,
}: {
  searchParams: Promise<{ bloqueado?: string; ativado?: string; cancelado?: string }>;
}) {
  const [user, params] = await Promise.all([requireUser('/app/premium'), searchParams]);
  const premium = hasPremium(user);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Plano"
        title="Synergy Premium"
        description="Ferramentas para organizar a burocracia da startup e se conectar com investidores com mais confiança."
      />

      {params.bloqueado ? (
        <Alert variant="warning" title="Recurso exclusivo do Premium">
          A comunidade de suporte, o roadmap burocrático e os templates são liberados apenas para
          contas Premium.
        </Alert>
      ) : null}
      {params.ativado ? (
        <Alert variant="success" title="Premium ativado!">
          Todos os recursos exclusivos já estão liberados na sua conta.
        </Alert>
      ) : null}
      {params.cancelado ? (
        <Alert variant="info">Sua conta voltou para o plano gratuito.</Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Comparativo de planos</CardTitle>
            <CardDescription>O que muda entre a conta gratuita e a Premium.</CardDescription>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs tracking-wide text-slate-500 uppercase">
                  <th className="py-2 pr-4 font-medium">Recurso</th>
                  <th className="py-2 pr-4 text-center font-medium">Gratuito</th>
                  <th className="py-2 text-center font-medium">Premium</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row) => (
                  <tr key={row.feature} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 pr-4 text-slate-700">{row.feature}</td>
                    <td className="py-3 pr-4 text-center">
                      {row.free ? (
                        <Check className="mx-auto size-4 text-emerald-600" aria-label="Incluído" />
                      ) : (
                        <Minus
                          className="mx-auto size-4 text-slate-300"
                          aria-label="Não incluído"
                        />
                      )}
                    </td>
                    <td className="py-3 text-center">
                      <Check className="mx-auto size-4 text-emerald-600" aria-label="Incluído" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card
          className={
            premium ? 'border-amber-300 bg-amber-50/40' : 'border-slate-900 bg-slate-900 text-white'
          }
        >
          <CardHeader>
            <div className="flex items-center gap-2">
              <Crown
                className={premium ? 'size-5 text-amber-500' : 'size-5 text-amber-400'}
                aria-hidden
              />
              <CardTitle className={premium ? '' : 'text-white'}>
                {premium ? 'Seu plano Premium está ativo' : 'Ative o Premium'}
              </CardTitle>
            </div>
            <CardDescription className={premium ? '' : 'text-slate-300'}>
              {premium && user.planActivatedAt
                ? `Ativo desde ${formatDate(user.planActivatedAt)}.`
                : 'Liberação imediata de todos os recursos exclusivos.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!premium ? (
              <>
                <p className="text-3xl font-bold">
                  R$ 49<span className="text-base font-normal text-slate-300">/mês</span>
                </p>
                <form action={activatePremium}>
                  <SubmitButton
                    variant="premium"
                    size="lg"
                    className="w-full"
                    pendingText="Ativando..."
                  >
                    Ativar Premium
                  </SubmitButton>
                </form>
                <p className="text-xs text-slate-400">
                  MVP: a ativação é simulada (sem cobrança). A integração com gateway de pagamento
                  está no backlog.
                </p>
              </>
            ) : (
              <>
                <ul className="space-y-2 text-sm">
                  {PREMIUM_FEATURES.map((feature) => (
                    <li key={feature.href}>
                      <Link
                        href={feature.href}
                        className="flex items-center justify-between rounded-lg border border-amber-200 bg-white px-3 py-2 hover:border-amber-400"
                      >
                        <span className="font-medium text-slate-800">{feature.title}</span>
                        <ArrowRight className="size-4 text-amber-600" aria-hidden />
                      </Link>
                    </li>
                  ))}
                </ul>
                {user.role !== 'ADMIN' ? (
                  <form action={cancelPremium}>
                    <SubmitButton
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      pendingText="Cancelando..."
                    >
                      Voltar para o plano gratuito
                    </SubmitButton>
                  </form>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <section className="grid gap-4 sm:grid-cols-2">
        {PREMIUM_FEATURES.map((feature) => (
          <Card key={feature.title}>
            <CardContent className="p-6">
              <h3 className="font-semibold text-slate-900">{feature.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
