import Link from 'next/link';
import { Lock } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

/** Tela de bloqueio exibida a contas gratuitas em recursos exclusivos do Premium. */
export function PremiumGate({ feature, description }: { feature: string; description: string }) {
  return (
    <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-white">
      <CardContent className="flex flex-col items-center gap-4 px-6 py-14 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-amber-400 text-slate-950">
          <Lock className="size-6" aria-hidden />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">
            {feature} é exclusivo do plano Premium
          </h2>
          <p className="mx-auto max-w-lg text-slate-600">{description}</p>
        </div>
        <Link href="/app/premium" className={buttonVariants({ variant: 'premium', size: 'lg' })}>
          Conhecer o plano Premium
        </Link>
      </CardContent>
    </Card>
  );
}
