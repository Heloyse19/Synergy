import { Crown } from 'lucide-react';
import type { Plan } from '@/generated/prisma/enums';
import { planLabels } from '@/lib/labels';
import { Badge } from './badge';

export function PlanBadge({ plan }: { plan: Plan }) {
  if (plan === 'PREMIUM') {
    return (
      <Badge variant="premium">
        <Crown className="size-3" aria-hidden />
        {planLabels.PREMIUM}
      </Badge>
    );
  }
  return <Badge variant="outline">{planLabels.FREE}</Badge>;
}
