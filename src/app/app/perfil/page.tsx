import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth/dal';
import { listNiches } from '@/lib/data/niches';
import { prisma } from '@/lib/prisma';
import { formatDate } from '@/lib/format';
import { roleLabels } from '@/lib/labels';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { PlanBadge } from '@/components/ui/plan-badge';
import {
  AccountForm,
  InvestorProfileForm,
  ProfessionalProfileForm,
  StartupProfileForm,
} from './profile-forms';

export const metadata: Metadata = { title: 'Meu perfil' };

export default async function ProfilePage() {
  const user = await requireUser('/app/perfil');

  const [startup, investor, professional, niches] = await Promise.all([
    user.startup
      ? prisma.startupProfile.findUnique({
          where: { id: user.startup.id },
          select: {
            name: true,
            pitch: true,
            description: true,
            website: true,
            city: true,
            stage: true,
            nicheId: true,
          },
        })
      : null,
    user.investor
      ? prisma.investorProfile.findUnique({
          where: { id: user.investor.id },
          select: {
            company: true,
            thesis: true,
            ticketMin: true,
            ticketMax: true,
            linkedin: true,
            interests: { select: { nicheId: true } },
          },
        })
      : null,
    user.professional
      ? prisma.professionalProfile.findUnique({
          where: { id: user.professional.id },
          select: {
            headline: true,
            bio: true,
            skills: true,
            linkedin: true,
            portfolio: true,
            availableForFreelance: true,
          },
        })
      : null,
    user.startup || user.investor ? listNiches() : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Conta"
        title="Meu perfil"
        description={`Membro desde ${formatDate(user.createdAt)}.`}
        actions={
          <>
            <Badge variant="brand">{roleLabels[user.role]}</Badge>
            <PlanBadge plan={user.plan} />
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
        <Card className="self-start">
          <CardHeader>
            <CardTitle>Dados da conta</CardTitle>
            <CardDescription>Como você aparece para a comunidade.</CardDescription>
          </CardHeader>
          <CardContent>
            <AccountForm name={user.name} email={user.email} />
          </CardContent>
        </Card>

        {startup ? (
          <Card>
            <CardHeader>
              <CardTitle>Perfil da startup</CardTitle>
              <CardDescription>
                Essas informações aparecem nas suas vagas e inscrições em eventos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StartupProfileForm profile={startup} niches={niches} />
            </CardContent>
          </Card>
        ) : null}

        {investor ? (
          <Card>
            <CardHeader>
              <CardTitle>Perfil de investidor anjo</CardTitle>
              <CardDescription>
                Ajuda as startups a entenderem sua tese antes de abordá-lo em eventos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InvestorProfileForm
                profile={{
                  ...investor,
                  interestNicheIds: investor.interests.map((interest) => interest.nicheId),
                }}
                niches={niches}
              />
            </CardContent>
          </Card>
        ) : null}

        {professional ? (
          <Card>
            <CardHeader>
              <CardTitle>Perfil profissional</CardTitle>
              <CardDescription>
                Mostre suas habilidades para as startups que estão contratando.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProfessionalProfileForm profile={professional} />
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
