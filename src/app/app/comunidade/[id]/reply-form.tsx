'use client';

import { useActionState, useEffect, useRef } from 'react';
import { createForumReply } from '@/actions/forum';
import { initialActionState } from '@/lib/action-state';
import { Field } from '@/components/ui/field';
import { FormMessage } from '@/components/ui/form-message';
import { Textarea } from '@/components/ui/input';
import { SubmitButton } from '@/components/ui/submit-button';

export function ReplyForm({ postId }: { postId: string }) {
  const [state, action] = useActionState(createForumReply, initialActionState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === 'success') formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-3" noValidate>
      <input type="hidden" name="postId" value={postId} />
      <FormMessage state={state} />
      <Field label="Sua resposta" htmlFor="content" error={state.fieldErrors?.content}>
        <Textarea
          id="content"
          name="content"
          rows={4}
          defaultValue={state.status === 'error' ? state.values?.content : ''}
          required
        />
      </Field>
      <SubmitButton pendingText="Enviando...">Responder</SubmitButton>
    </form>
  );
}
