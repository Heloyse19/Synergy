'use client';

import { useActionState } from 'react';
import {
  updateAccount,
  updateInvestorProfile,
  updateProfessionalProfile,
  updateStartupProfile,
} from '@/actions/profile';
import type { StartupStage } from '@/generated/prisma/enums';
import { initialActionState } from '@/lib/action-state';
import { MAX_INTERESTS } from '@/lib/validations/shared';
import { startupStageLabels, toOptions } from '@/lib/labels';
import { Field } from '@/components/ui/field';
import { FormMessage } from '@/components/ui/form-message';
import { Checkbox, Input, Select, Textarea } from '@/components/ui/input';
import { SubmitButton } from '@/components/ui/submit-button';

export function AccountForm({ name, email }: { name: string; email: string }) {
  const [state, action] = useActionState(updateAccount, initialActionState);
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormMessage state={state} />
      <Field label="Nome" htmlFor="name" error={state.fieldErrors?.name} required>
        <Input id="name" name="name" defaultValue={state.values?.name ?? name} required />
      </Field>
      <Field
        label="E-mail"
        htmlFor="email"
        hint="A troca de e-mail e senha está no backlog do produto."
      >
        <Input id="email" value={email} disabled readOnly />
      </Field>
      <SubmitButton pendingText="Salvando...">Salvar conta</SubmitButton>
    </form>
  );
}

export type StartupFormValues = {
  name: string;
  pitch: string | null;
  description: string | null;
  website: string | null;
  city: string | null;
  stage: StartupStage;
  nicheId: number | null;
};

export function StartupProfileForm({
  profile,
  niches,
}: {
  profile: StartupFormValues;
  niches: Array<{ id: number; name: string }>;
}) {
  const [state, action] = useActionState(updateStartupProfile, initialActionState);
  const v = state.values ?? {};
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormMessage state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome da startup" htmlFor="startup-name" error={e.name} required>
          <Input id="startup-name" name="name" defaultValue={v.name ?? profile.name} required />
        </Field>
        <Field label="Nicho de mercado" htmlFor="nicheId" error={e.nicheId}>
          <Select
            id="nicheId"
            name="nicheId"
            defaultValue={v.nicheId ?? profile.nicheId?.toString() ?? ''}
          >
            <option value="">Selecione...</option>
            {niches.map((niche) => (
              <option key={niche.id} value={niche.id}>
                {niche.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Estágio" htmlFor="stage" error={e.stage} required>
          <Select id="stage" name="stage" defaultValue={v.stage ?? profile.stage}>
            {toOptions(startupStageLabels).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Cidade" htmlFor="city" error={e.city}>
          <Input
            id="city"
            name="city"
            defaultValue={v.city ?? profile.city ?? ''}
            placeholder="Ex.: Curitiba/PR"
          />
        </Field>
      </div>
      <Field label="Site" htmlFor="website" error={e.website}>
        <Input
          id="website"
          name="website"
          type="url"
          placeholder="https://"
          defaultValue={v.website ?? profile.website ?? ''}
        />
      </Field>
      <Field
        label="Pitch em uma frase"
        htmlFor="pitch"
        error={e.pitch}
        hint="Até 280 caracteres. Aparece nas vagas e eventos."
      >
        <Input
          id="pitch"
          name="pitch"
          maxLength={280}
          defaultValue={v.pitch ?? profile.pitch ?? ''}
        />
      </Field>
      <Field label="Descrição" htmlFor="description" error={e.description}>
        <Textarea
          id="description"
          name="description"
          rows={6}
          defaultValue={v.description ?? profile.description ?? ''}
        />
      </Field>
      <SubmitButton pendingText="Salvando...">Salvar perfil da startup</SubmitButton>
    </form>
  );
}

export type InvestorFormValues = {
  company: string | null;
  thesis: string | null;
  ticketMin: number | null;
  ticketMax: number | null;
  linkedin: string | null;
  interestNicheIds: number[];
};

export function InvestorProfileForm({
  profile,
  niches,
}: {
  profile: InvestorFormValues;
  niches: Array<{ id: number; name: string }>;
}) {
  const [state, action] = useActionState(updateInvestorProfile, initialActionState);
  const v = state.values ?? {};
  const e = state.fieldErrors ?? {};
  const selectedIds =
    v.interestNicheIds?.split(',').filter(Boolean) ?? profile.interestNicheIds.map(String);
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormMessage state={state} />
      <Field label="Empresa ou fundo" htmlFor="company" error={e.company}>
        <Input id="company" name="company" defaultValue={v.company ?? profile.company ?? ''} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Ticket mínimo (R$)" htmlFor="ticketMin" error={e.ticketMin}>
          <Input
            id="ticketMin"
            name="ticketMin"
            type="number"
            min={0}
            step={1000}
            defaultValue={v.ticketMin ?? profile.ticketMin ?? ''}
          />
        </Field>
        <Field label="Ticket máximo (R$)" htmlFor="ticketMax" error={e.ticketMax}>
          <Input
            id="ticketMax"
            name="ticketMax"
            type="number"
            min={0}
            step={1000}
            defaultValue={v.ticketMax ?? profile.ticketMax ?? ''}
          />
        </Field>
      </div>
      <Field label="LinkedIn" htmlFor="linkedin" error={e.linkedin}>
        <Input
          id="linkedin"
          name="linkedin"
          type="url"
          placeholder="https://linkedin.com/in/..."
          defaultValue={v.linkedin ?? profile.linkedin ?? ''}
        />
      </Field>
      <Field
        label="Categorias de interesse (opcional)"
        htmlFor="interestNicheIds"
        error={e.interestNicheIds}
        hint={`Ctrl/clique para escolher várias (até ${MAX_INTERESTS})`}
      >
        <Select
          id="interestNicheIds"
          name="interestNicheIds"
          size={4}
          multiple
          className="py-2"
          defaultValue={selectedIds}
        >
          {niches.map((niche) => (
            <option key={niche.id} value={niche.id}>
              {niche.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field
        label="Tese de investimento"
        htmlFor="thesis"
        error={e.thesis}
        hint="Setores, estágios e perfis de startup que interessam."
      >
        <Textarea
          id="thesis"
          name="thesis"
          rows={5}
          defaultValue={v.thesis ?? profile.thesis ?? ''}
        />
      </Field>
      <SubmitButton pendingText="Salvando...">Salvar perfil de investidor</SubmitButton>
    </form>
  );
}

export type ProfessionalFormValues = {
  headline: string | null;
  bio: string | null;
  skills: string | null;
  linkedin: string | null;
  portfolio: string | null;
  availableForFreelance: boolean;
};

export function ProfessionalProfileForm({ profile }: { profile: ProfessionalFormValues }) {
  const [state, action] = useActionState(updateProfessionalProfile, initialActionState);
  const v = state.values ?? {};
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormMessage state={state} />
      <Field label="Título profissional" htmlFor="headline" error={e.headline}>
        <Input
          id="headline"
          name="headline"
          defaultValue={v.headline ?? profile.headline ?? ''}
          placeholder="Ex.: Desenvolvedora full stack"
        />
      </Field>
      <Field
        label="Habilidades"
        htmlFor="skills"
        error={e.skills}
        hint="Separe por vírgula. Ex.: React, Node.js, SQL"
      >
        <Input id="skills" name="skills" defaultValue={v.skills ?? profile.skills ?? ''} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="LinkedIn" htmlFor="linkedin" error={e.linkedin}>
          <Input
            id="linkedin"
            name="linkedin"
            type="url"
            placeholder="https://"
            defaultValue={v.linkedin ?? profile.linkedin ?? ''}
          />
        </Field>
        <Field label="Portfólio / GitHub" htmlFor="portfolio" error={e.portfolio}>
          <Input
            id="portfolio"
            name="portfolio"
            type="url"
            placeholder="https://"
            defaultValue={v.portfolio ?? profile.portfolio ?? ''}
          />
        </Field>
      </div>
      <Field label="Sobre você" htmlFor="bio" error={e.bio}>
        <Textarea id="bio" name="bio" rows={5} defaultValue={v.bio ?? profile.bio ?? ''} />
      </Field>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <Checkbox
          name="availableForFreelance"
          defaultChecked={
            v.availableForFreelance
              ? v.availableForFreelance === 'on'
              : profile.availableForFreelance
          }
        />
        Disponível para projetos freelancer
      </label>
      <SubmitButton pendingText="Salvando...">Salvar perfil profissional</SubmitButton>
    </form>
  );
}
