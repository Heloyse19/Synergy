import Link from 'next/link';
import type { ReactNode } from 'react';
import { Building2, MapPin, Wallet } from 'lucide-react';
import type { JobListItem } from '@/lib/data/jobs';
import { formatRelative } from '@/lib/format';
import { jobTypeLabels, workModeLabels } from '@/lib/labels';
import { splitList } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export function JobCard({ job, actions }: { job: JobListItem; actions?: ReactNode }) {
  const skills = splitList(job.skills);

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={job.type === 'FREELANCE' ? 'warning' : 'brand'}>
              {jobTypeLabels[job.type]}
            </Badge>
            <Badge variant="outline">{workModeLabels[job.workMode]}</Badge>
            {!job.isActive ? <Badge variant="danger">Inativa</Badge> : null}
          </div>
          <span className="text-xs text-slate-400">{formatRelative(job.createdAt)}</span>
        </div>

        <div>
          <h3 className="text-lg font-semibold leading-snug text-slate-900">
            <Link href={`/vagas/${job.id}`} className="hover:text-brand-700">
              {job.title}
            </Link>
          </h3>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
            <Building2 className="size-4 text-slate-400" aria-hidden />
            {job.startup.name}
            {job.startup.niche ? (
              <span className="text-slate-400">· {job.startup.niche.name}</span>
            ) : null}
          </p>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
          {job.location || job.startup.city ? (
            <span className="flex items-center gap-1.5">
              <MapPin className="size-4 text-slate-400" aria-hidden />
              {job.location ?? job.startup.city}
            </span>
          ) : null}
          {job.salaryRange ? (
            <span className="flex items-center gap-1.5">
              <Wallet className="size-4 text-slate-400" aria-hidden />
              {job.salaryRange}
            </span>
          ) : null}
        </div>

        {skills.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5" aria-label="Habilidades">
            {skills.slice(0, 5).map((skill) => (
              <li
                key={skill}
                className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
              >
                {skill}
              </li>
            ))}
            {skills.length > 5 ? (
              <li className="px-1 text-xs text-slate-400">+{skills.length - 5}</li>
            ) : null}
          </ul>
        ) : null}

        {actions ? (
          <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">{actions}</div>
        ) : null}
      </CardContent>
    </Card>
  );
}
