'use client';

import { useActionState, useState } from 'react';
import { Plus } from 'lucide-react';
import { createForumPost } from '@/actions/forum';
import { initialActionState } from '@/lib/action-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { FormMessage } from '@/components/ui/form-message';
import { Input, Textarea } from '@/components/ui/input';
import { SubmitButton } from '@/components/ui/submit-button';

export function NewPostForm() {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(createForumPost, initialActionState);

  if (!open && state.status !== 'error') {
    return (
      <Button data-testid="new-post-open" onClick={() => setOpen(true)}>
        <Plus className="size-4" aria-hidden />
        Nova publicação
      </Button>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <form data-testid="new-post-form" action={action} className="space-y-4" noValidate>
          <FormMessage state={state} />
          <Field label="Título" htmlFor="title" error={state.fieldErrors?.title} required>
            <Input
              data-testid="new-post-title"
              id="title"
              name="title"
              defaultValue={state.values?.title}
              placeholder="Ex.: Como vocês estruturaram o contrato social?"
              required
            />
          </Field>
          <Field label="Conteúdo" htmlFor="content" error={state.fieldErrors?.content} required>
            <Textarea
              data-testid="new-post-content"
              id="content"
              name="content"
              rows={6}
              defaultValue={state.values?.content}
              required
            />
          </Field>
          <div className="flex gap-2">
            <SubmitButton data-testid="new-post-submit" pendingText="Publicando...">
              Publicar
            </SubmitButton>
            <Button data-testid="new-post-cancel" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
