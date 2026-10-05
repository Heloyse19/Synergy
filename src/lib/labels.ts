// Rótulos em português para os enums do banco. Mantém a UI consistente em todas as telas.
import type {
  EventOrigin,
  EventType,
  JobType,
  Plan,
  Role,
  StartupStage,
  WorkMode,
} from '@/generated/prisma/enums';

export const roleLabels: Record<Role, string> = {
  STARTUP: 'Startup',
  INVESTOR: 'Investidor anjo',
  PROFESSIONAL: 'Profissional',
  ADMIN: 'Administrador',
};

export const roleDescriptions: Record<Exclude<Role, 'ADMIN'>, string> = {
  STARTUP: 'Divulgue vagas, participe de eventos e acesse o roadmap burocrático.',
  INVESTOR: 'Sinalize presença em eventos e descubra startups por nicho.',
  PROFESSIONAL: 'Encontre vagas fixas e oportunidades freelancer em startups.',
};

export const planLabels: Record<Plan, string> = {
  FREE: 'Gratuito',
  PREMIUM: 'Premium',
};

export const startupStageLabels: Record<StartupStage, string> = {
  IDEA: 'Ideação',
  VALIDATION: 'Validação',
  MVP: 'MVP',
  TRACTION: 'Tração',
  SCALE: 'Escala',
};

export const eventTypeLabels: Record<EventType, string> = {
  HACKATHON: 'Hackathon',
  MEETUP: 'Meetup',
  PITCH_DAY: 'Pitch day',
  WORKSHOP: 'Workshop',
  DEMO_DAY: 'Demo day',
  OTHER: 'Outro',
};

export const eventOriginLabels: Record<EventOrigin, string> = {
  INTERNAL: 'Evento interno',
  EXTERNAL: 'Evento externo',
};

export const jobTypeLabels: Record<JobType, string> = {
  CLT: 'CLT',
  PJ: 'PJ',
  FREELANCE: 'Freelancer',
  INTERNSHIP: 'Estágio',
};

export const workModeLabels: Record<WorkMode, string> = {
  REMOTE: 'Remoto',
  HYBRID: 'Híbrido',
  ONSITE: 'Presencial',
};

/** Transforma um mapa de rótulos em opções para <select>. */
export function toOptions<T extends string>(labels: Record<T, string>) {
  return (Object.keys(labels) as T[]).map((value) => ({ value, label: labels[value] }));
}
