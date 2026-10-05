'use client';

import { useActionState } from 'react';
import { login } from '@/actions/auth';
import { initialActionState } from '@/lib/action-state';
import { TurnstileWidget } from '@/components/auth/turnstile-widget';
import { Field } from '@/components/ui/field';
import { FormMessage } from '@/components/ui/form-message';
import { Input } from '@/components/ui/input';
import { SubmitButton } from '@/components/ui/submit-button';

export function LoginForm({
  next,
  turnstileSiteKey,
}: {
  next: string;
  turnstileSiteKey: string | null;
}) {
  const [state, action] = useActionState(login, initialActionState);

  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="next" value={next} />
      <FormMessage state={state} />

      <Field label="E-mail" htmlFor="email" error={state.fieldErrors?.email} required>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="voce@exemplo.com"
          defaultValue={state.values?.email}
          aria-invalid={Boolean(state.fieldErrors?.email)}
          required
        />
      </Field>

      <Field label="Senha" htmlFor="password" error={state.fieldErrors?.password} required>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={Boolean(state.fieldErrors?.password)}
          required
        />
      </Field>

      <TurnstileWidget siteKey={turnstileSiteKey} resetKey={state} />

      <SubmitButton className="w-full" pendingText="Entrando...">
        Entrar
      </SubmitButton>
    </form>
  );
}
