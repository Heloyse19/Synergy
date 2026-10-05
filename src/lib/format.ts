// Formatação de datas e valores no padrão brasileiro.
export const TIME_ZONE = 'America/Sao_Paulo';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TIME_ZONE,
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TIME_ZONE,
  weekday: 'short',
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const timeFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
});

export function formatDate(date: Date | string): string {
  return dateFormatter.format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return dateTimeFormatter.format(new Date(date));
}

export function formatTime(date: Date | string): string {
  return timeFormatter.format(new Date(date));
}

/** Ex.: "sex., 20 de out. de 2026, 19:00 – 22:00" */
export function formatDateRange(start: Date | string, end?: Date | string | null): string {
  const startDate = new Date(start);
  if (!end) return formatDateTime(startDate);
  const endDate = new Date(end);
  const sameDay = dateFormatter.format(startDate) === dateFormatter.format(endDate);
  return sameDay
    ? `${formatDateTime(startDate)} – ${formatTime(endDate)}`
    : `${formatDateTime(startDate)} – ${formatDateTime(endDate)}`;
}

/** Converte Date para o formato aceito por <input type="datetime-local"> (horário de Brasília). */
export function toDateTimeLocal(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value);
}

/** Ex.: "há 3 dias", "em 2 horas". */
export function formatRelative(date: Date | string, now: Date = new Date()): string {
  const diffMs = new Date(date).getTime() - now.getTime();
  const rtf = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });
  const minutes = Math.round(diffMs / 60_000);
  if (Math.abs(minutes) < 60) return rtf.format(minutes, 'minute');
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return rtf.format(hours, 'hour');
  const days = Math.round(hours / 24);
  if (Math.abs(days) < 30) return rtf.format(days, 'day');
  const months = Math.round(days / 30);
  if (Math.abs(months) < 12) return rtf.format(months, 'month');
  return rtf.format(Math.round(months / 12), 'year');
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
