import type { Metadata } from 'next';
import { CheckCircle2, Circle, ExternalLink } from 'lucide-react';
import { toggleRoadmapStep } from '@/actions/roadmap';
import { requireUser } from '@/lib/auth/dal';
import { getCompletedStepIds, groupStepsByPhase, listRoadmapSteps } from '@/lib/data/roadmap';
import { hasPremium } from '@/lib/plan';
import { cn } from '@/lib/utils';
import { PremiumGate } from '@/components/premium/premium-gate';
import { Alert } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';

export const metadata: Metadata = { title: 'Roadmap burocrático' };

export default async function RoadmapPage() {
  const user = await requireUser('/app/roadmap');

  if (!hasPremium(user)) {
    return (
      <div className="space-y-8">
        <PageHeader eyebrow="Premium" title="Roadmap burocrático" />
        <PremiumGate
          feature="O roadmap burocrático"
          description="Um checklist guiado de formalização, tributos, propriedade intelectual e captação, com o progresso da sua startup salvo."
        />
      </div>
    );
  }

  const steps = await listRoadmapSteps();
  const completed = user.startup ? await getCompletedStepIds(user.startup.id) : new Set<number>();
  const phases = groupStepsByPhase(steps);
  const total = steps.length;
  const done = steps.filter((step) => completed.has(step.id)).length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Premium"
        title="Roadmap burocrático"
        description="Passo a passo para formalizar a startup e se preparar para captar recursos. Marque o que já foi concluído."
      />

      {!user.startup ? (
        <Alert variant="info">
          O progresso é salvo apenas para contas de startup. Você está visualizando o roadmap em
          modo leitura.
        </Alert>
      ) : null}

      <Card>
        <CardContent className="space-y-3 p-6">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-slate-900">Progresso geral</span>
            <span className="text-slate-600">
              {done} de {total} passos · {percent}%
            </span>
          </div>
          <div
            className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100"
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <ol className="space-y-6">
        {phases.map((phase, index) => {
          const phaseDone = phase.steps.filter((step) => completed.has(step.id)).length;
          return (
            <li key={phase.phase}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <span className="flex size-7 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                      {index + 1}
                    </span>
                    {phase.phase}
                  </CardTitle>
                  <CardDescription>
                    {phaseDone} de {phase.steps.length} concluído{phaseDone === 1 ? '' : 's'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="divide-y divide-slate-100">
                    {phase.steps.map((step) => {
                      const isDone = completed.has(step.id);
                      return (
                        <li key={step.id} className="flex gap-3 py-3">
                          {user.startup ? (
                            <form action={toggleRoadmapStep}>
                              <input type="hidden" name="stepId" value={step.id} />
                              <button
                                type="submit"
                                className="mt-0.5 rounded-full text-slate-400 hover:text-emerald-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                                aria-pressed={isDone}
                                aria-label={
                                  isDone ? `Desmarcar: ${step.title}` : `Concluir: ${step.title}`
                                }
                              >
                                {isDone ? (
                                  <CheckCircle2 className="size-5 text-emerald-600" aria-hidden />
                                ) : (
                                  <Circle className="size-5" aria-hidden />
                                )}
                              </button>
                            </form>
                          ) : (
                            <Circle className="mt-0.5 size-5 text-slate-300" aria-hidden />
                          )}
                          <div className="min-w-0 flex-1">
                            <p
                              className={cn(
                                'font-medium text-slate-900',
                                isDone && 'text-slate-500 line-through',
                              )}
                            >
                              {step.title}
                            </p>
                            <p className="mt-0.5 text-sm text-slate-600">{step.description}</p>
                            {step.resourceUrl ? (
                              <a
                                href={step.resourceUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline"
                              >
                                Saiba mais
                                <ExternalLink className="size-3" aria-hidden />
                              </a>
                            ) : null}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
