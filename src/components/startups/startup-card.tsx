import Link from 'next/link';
import { MapPin, Sparkles } from 'lucide-react';
import type { StartupListItem } from '@/lib/data/startups';
import { startupStageLabels } from '@/lib/labels';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export function StartupCard({
  startup,
  highlighted,
}: {
  startup: StartupListItem;
  highlighted?: boolean;
}) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="brand">{startupStageLabels[startup.stage]}</Badge>
          {startup.niche ? <Badge variant="outline">{startup.niche.name}</Badge> : null}
          {highlighted ? (
            <Badge variant="success">
              <Sparkles className="size-3" aria-hidden />
              Dar match
            </Badge>
          ) : null}
        </div>

        <div>
          <h3 className="text-lg font-semibold leading-snug text-slate-900">
            <Link href={`/app/startups/${startup.id}`} className="hover:text-brand-700">
              {startup.name}
            </Link>
          </h3>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
            {startup.city ? (
              <span className="flex items-center gap-1.5">
                <MapPin className="size-4 text-slate-400" aria-hidden />
                {startup.city}
              </span>
            ) : null}
          </div>
        </div>

        {startup.pitch ? (
          <p className="line-clamp-3 text-sm text-slate-600">{startup.pitch}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
