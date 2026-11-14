'use client';

import Link from 'next/link';
import { Eye, EyeOff, Pencil, Trash2 } from 'lucide-react';
import { deleteJob, toggleJobActive } from '@/actions/jobs';
import { Button, buttonVariants } from '@/components/ui/button';

/** Botões de gestão exibidos à startup dona da vaga (e a administradores). */
export function JobManageActions({ jobId, isActive }: { jobId: string; isActive: boolean }) {
  return (
    <>
      <Link
        href={`/app/vagas/${jobId}/editar`}
        data-testid={`job-edit-link-${jobId}`}
        className={buttonVariants({ variant: 'outline', size: 'sm' })}
      >
        <Pencil className="size-4" aria-hidden />
        Editar
      </Link>
      <form data-testid={`job-toggle-form-${jobId}`} action={toggleJobActive}>
        <input type="hidden" name="jobId" value={jobId} />
        <Button data-testid={`job-toggle-button-${jobId}`} type="submit" variant="ghost" size="sm">
          {isActive ? (
            <EyeOff className="size-4" aria-hidden />
          ) : (
            <Eye className="size-4" aria-hidden />
          )}
          {isActive ? 'Desativar' : 'Ativar'}
        </Button>
      </form>
      <form
        data-testid={`job-delete-form-${jobId}`}
        action={deleteJob}
        onSubmit={(event) => {
          if (!window.confirm('Excluir esta vaga? Esta ação não pode ser desfeita.'))
            event.preventDefault();
        }}
      >
        <input type="hidden" name="jobId" value={jobId} />
        <Button
          data-testid={`job-delete-button-${jobId}`}
          type="submit"
          variant="ghost"
          size="sm"
          className="text-red-600 hover:bg-red-50"
        >
          <Trash2 className="size-4" aria-hidden />
          Excluir
        </Button>
      </form>
    </>
  );
}
