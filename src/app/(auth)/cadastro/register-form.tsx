'use client';

import { useActionState, useState } from 'react';
import { Briefcase, HandCoins, Rocket } from 'lucide-react';
import { register } from '@/actions/auth';
import { initialActionState } from '@/lib/action-state';
import { roleDescriptions, roleLabels } from '@/lib/labels';
import { MAX_INTERESTS } from '@/lib/validations/shared';
import { registerRoles } from '@/lib/validations/auth';
import { cn } from '@/lib/utils';
import { TurnstileWidget } from '@/components/auth/turnstile-widget';
import { Field } from '@/components/ui/field';
import { FormMessage } from '@/components/ui/form-message';
import { Input, Select } from '@/components/ui/input';
import { SubmitButton } from '@/components/ui/submit-button';

type RegisterRole = (typeof registerRoles)[number];

const roleIcons = { STARTUP: Rocket, INVESTOR: HandCoins, PROFESSIONAL: Briefcase } as const;

type RegisterFormProps = {
  niches: Array<{ id: number; name: string }>;
  turnstileSiteKey: string | null;
};

export function RegisterForm({ niches, turnstileSiteKey }: RegisterFormProps) {
  const [state, action] = useActionState(register, initialActionState);
  const [role, setRole] = useState<RegisterRole>(
    (state.values?.role as RegisterRole | undefined) ?? 'STARTUP',
  );

  return (
    <form action={action} className="space-y-5" noValidate>
      <FormMessage state={state} />

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-slate-700">Quem é você?</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {registerRoles.map((value) => {
            const Icon = roleIcons[value];
            const selected = role === value;
            return (
              <label
                key={value}
                className={cn(
                  'flex cursor-pointer flex-col gap-1 rounded-lg border p-3 text-left transition-colors',
                  selected
                    ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-500/20'
                    : 'border-slate-300 hover:border-slate-400',
                )}
              >
                <input
                  type="radio"
                  name="role"
                  value={value}
                  checked={selected}
                  onChange={() => setRole(value)}
                  className="sr-only"
                />
                <Icon
                  className={cn('size-5', selected ? 'text-brand-600' : 'text-slate-400')}
                  aria-hidden
                />
                <span className="text-sm font-semibold text-slate-900">{roleLabels[value]}</span>
                <span className="text-xs leading-snug text-slate-500">
                  {roleDescriptions[value]}
                </span>
              </label>
            );
          })}
        </div>
        {state.fieldErrors?.role ? (
          <p className="text-xs font-medium text-red-600">{state.fieldErrors.role[0]}</p>
        ) : null}
      </fieldset>

      <Field label="Seu nome" htmlFor="name" error={state.fieldErrors?.name} required>
        <Input
          id="name"
          name="name"
          autoComplete="name"
          defaultValue={state.values?.name}
          required
        />
      </Field>

      <Field label="E-mail" htmlFor="email" error={state.fieldErrors?.email} required>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={state.values?.email}
          aria-invalid={Boolean(state.fieldErrors?.email)}
          required
        />
      </Field>

      <Field
        label="Senha"
        htmlFor="password"
        error={state.fieldErrors?.password}
        hint="Mínimo de 8 caracteres."
        required
      >
        <Input id="password" name="password" type="password" autoComplete="new-password" required />
      </Field>

      {role === 'STARTUP' ? (
        <div className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
          <Field
            label="Nome da startup"
            htmlFor="startupName"
            error={state.fieldErrors?.startupName}
            required
          >
            <Input id="startupName" name="startupName" defaultValue={state.values?.startupName} />
          </Field>
          <Field label="Nicho de mercado" htmlFor="nicheId" error={state.fieldErrors?.nicheId}>
            <Select id="nicheId" name="nicheId" defaultValue={state.values?.nicheId ?? ''}>
              <option value="">Selecione...</option>
              {niches.map((niche) => (
                <option key={niche.id} value={niche.id}>
                  {niche.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      ) : null}

      {role === 'INVESTOR' ? (
        <>
          <Field
            label="Empresa ou fundo (opcional)"
            htmlFor="company"
            error={state.fieldErrors?.company}
            hint="Aparece ao lado do seu nome quando você confirma presença em eventos."
          >
            <Input id="company" name="company" defaultValue={state.values?.company} />
          </Field>
          <Field
            label="Categorias de interesse (opcional)"
            htmlFor="interestNicheIds"
            error={state.fieldErrors?.interestNicheIds}
            hint={`Ctrl/clique para escolher várias (até ${MAX_INTERESTS}). Usamos para destacar startups para você.`}
          >
            <Select
              id="interestNicheIds"
              name="interestNicheIds"
              size={4}
              multiple
              className="py-2"
              defaultValue={state.values?.interestNicheIds?.split(',').filter(Boolean)}
            >
              {niches.map((niche) => (
                <option key={niche.id} value={niche.id}>
                  {niche.name}
                </option>
              ))}
            </Select>
          </Field>
        </>
      ) : null}

      {role === 'PROFESSIONAL' ? (
        <Field
          label="Título profissional (opcional)"
          htmlFor="headline"
          error={state.fieldErrors?.headline}
          hint='Ex.: "Desenvolvedora full stack" ou "Designer de produto".'
        >
          <Input id="headline" name="headline" defaultValue={state.values?.headline} />
        </Field>
      ) : null}

      <TurnstileWidget siteKey={turnstileSiteKey} resetKey={state} />

      <SubmitButton className="w-full" pendingText="Criando conta...">
        Criar conta gratuita
      </SubmitButton>
    </form>
  );
}
