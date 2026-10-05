'use client';

import { useActionState } from 'react';
import type { JobType, WorkMode } from '@/generated/prisma/enums';
import { initialActionState, type ActionState } from '@/lib/action-state';
import { jobTypeLabels, toOptions, workModeLabels } from '@/lib/labels';
import { Field } from '@/components/ui/field';
import { FormMessage } from '@/components/ui/form-message';
import { Checkbox, Input, Select, Textarea } from '@/components/ui/input';
import { SubmitButton } from '@/components/ui/submit-button';

export type JobFormValues = {
  title: string;
  description: string;
  type: JobType;
  workMode: WorkMode;
  location: string | null;
  salaryRange: string | null;
  skills: string | null;
  isActive: boolean;
};

type JobFormProps = {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  jobId?: string;
  job?: JobFormValues;
  submitLabel: string;
};

/** Formulário compartilhado para criar e editar vagas. */
export function JobForm({ action, jobId, job, submitLabel }: JobFormProps) {
  const [state, formAction] = useActionState(action, initialActionState);
  const v = state.values ?? {};
  const e = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {jobId ? <input type="hidden" name="jobId" value={jobId} /> : null}
      <FormMessage state={state} />

      <Field label="Título da vaga" htmlFor="title" error={e.title} required>
        <Input
          id="title"
          name="title"
          defaultValue={v.title ?? job?.title}
          placeholder="Ex.: Desenvolvedor(a) Front-end React"
          required
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tipo de contratação" htmlFor="type" error={e.type} required>
          <Select id="type" name="type" defaultValue={v.type ?? job?.type ?? 'CLT'}>
            {toOptions(jobTypeLabels).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Modelo de trabalho" htmlFor="workMode" error={e.workMode} required>
          <Select
            id="workMode"
            name="workMode"
            defaultValue={v.workMode ?? job?.workMode ?? 'REMOTE'}
          >
            {toOptions(workModeLabels).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Localização"
          htmlFor="location"
          error={e.location}
          hint="Cidade/UF ou deixe vazio se remoto."
        >
          <Input id="location" name="location" defaultValue={v.location ?? job?.location ?? ''} />
        </Field>
        <Field
          label="Faixa salarial"
          htmlFor="salaryRange"
          error={e.salaryRange}
          hint='Ex.: "R$ 4.000 – R$ 6.000" ou "A combinar".'
        >
          <Input
            id="salaryRange"
            name="salaryRange"
            defaultValue={v.salaryRange ?? job?.salaryRange ?? ''}
          />
        </Field>
      </div>

      <Field
        label="Habilidades desejadas"
        htmlFor="skills"
        error={e.skills}
        hint="Separe por vírgula. Ex.: React, TypeScript, Figma"
      >
        <Input id="skills" name="skills" defaultValue={v.skills ?? job?.skills ?? ''} />
      </Field>

      <Field
        label="Descrição"
        htmlFor="description"
        error={e.description}
        hint="Responsabilidades, requisitos, benefícios e como se candidatar."
        required
      >
        <Textarea
          id="description"
          name="description"
          rows={10}
          defaultValue={v.description ?? job?.description}
          required
        />
      </Field>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <Checkbox
          name="isActive"
          defaultChecked={v.isActive ? v.isActive === 'on' : (job?.isActive ?? true)}
        />
        Vaga ativa (visível no mural)
      </label>

      <SubmitButton pendingText="Salvando...">{submitLabel}</SubmitButton>
    </form>
  );
}
