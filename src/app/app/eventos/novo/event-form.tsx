'use client';

import { useActionState } from 'react';
import { createEvent } from '@/actions/events';
import { initialActionState } from '@/lib/action-state';
import { eventOriginLabels, eventTypeLabels, toOptions } from '@/lib/labels';
import { Field } from '@/components/ui/field';
import { FormMessage } from '@/components/ui/form-message';
import { Checkbox, Input, Select, Textarea } from '@/components/ui/input';
import { SubmitButton } from '@/components/ui/submit-button';

export function EventForm() {
  const [state, action] = useActionState(createEvent, initialActionState);
  const v = state.values ?? {};
  const e = state.fieldErrors ?? {};

  return (
    <form data-testid="event-create-form" action={action} className="space-y-5" noValidate>
      <FormMessage state={state} />

      <Field label="Título" htmlFor="title" error={e.title} required>
        <Input data-testid="event-title" id="title" name="title" defaultValue={v.title} required />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tipo" htmlFor="type" error={e.type} required>
          <Select
            data-testid="event-type"
            id="type"
            name="type"
            defaultValue={v.type ?? 'HACKATHON'}
          >
            {toOptions(eventTypeLabels).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Origem" htmlFor="origin" error={e.origin} required>
          <Select
            data-testid="event-origin"
            id="origin"
            name="origin"
            defaultValue={v.origin ?? 'INTERNAL'}
          >
            {toOptions(eventOriginLabels).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Início"
          htmlFor="startsAt"
          error={e.startsAt}
          hint="Horário de Brasília."
          required
        >
          <Input
            data-testid="event-starts-at"
            id="startsAt"
            name="startsAt"
            type="datetime-local"
            defaultValue={v.startsAt}
            required
          />
        </Field>
        <Field label="Término (opcional)" htmlFor="endsAt" error={e.endsAt}>
          <Input
            data-testid="event-ends-at"
            id="endsAt"
            name="endsAt"
            type="datetime-local"
            defaultValue={v.endsAt}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <Field
          label="Local"
          htmlFor="location"
          error={e.location}
          hint="Endereço ou nome do espaço."
        >
          <Input
            data-testid="event-location"
            id="location"
            name="location"
            defaultValue={v.location}
          />
        </Field>
        <label className="flex h-10 items-center gap-2 text-sm text-slate-700">
          <Checkbox
            data-testid="event-is-online"
            name="isOnline"
            defaultChecked={v.isOnline === 'on'}
          />
          Evento online
        </label>
      </div>

      <Field label="Link externo (opcional)" htmlFor="externalUrl" error={e.externalUrl}>
        <Input
          data-testid="event-external-url"
          id="externalUrl"
          name="externalUrl"
          type="url"
          placeholder="https://"
          defaultValue={v.externalUrl}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Capacidade (opcional)"
          htmlFor="capacity"
          error={e.capacity}
          hint="Deixe vazio para ilimitado."
        >
          <Input
            data-testid="event-capacity"
            id="capacity"
            name="capacity"
            type="number"
            min={1}
            defaultValue={v.capacity}
          />
        </Field>
        <Field
          label="Prioridade Premium até (opcional)"
          htmlFor="priorityUntil"
          error={e.priorityUntil}
          hint="Até esta data só contas Premium se inscrevem."
        >
          <Input
            data-testid="event-priority-until"
            id="priorityUntil"
            name="priorityUntil"
            type="datetime-local"
            defaultValue={v.priorityUntil}
          />
        </Field>
      </div>

      <Field label="Descrição" htmlFor="description" error={e.description} required>
        <Textarea
          data-testid="event-description"
          id="description"
          name="description"
          rows={8}
          defaultValue={v.description}
          required
        />
      </Field>

      <SubmitButton data-testid="event-submit" pendingText="Publicando...">
        Publicar evento
      </SubmitButton>
    </form>
  );
}
