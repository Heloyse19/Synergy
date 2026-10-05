import { z } from 'zod';
import { TIME_ZONE } from '@/lib/format';

/**
 * Campos opcionais de formulário chegam como "" (vazio) ou null (input não renderizado,
 * ex.: campos condicionais por perfil) — ambos significam "não informado".
 */
export const emptyToUndefined = (value: unknown) =>
  value === null || value === undefined || (typeof value === 'string' && value.trim() === '')
    ? undefined
    : value;

export const optionalText = (max: number) =>
  z.preprocess(
    emptyToUndefined,
    z.string().trim().max(max, `Máximo de ${max} caracteres`).optional(),
  );

export const optionalUrl = z.preprocess(
  emptyToUndefined,
  z.url({ error: 'Informe uma URL válida (começando com https://)' }).max(300).optional(),
);

export const optionalInt = z.preprocess(
  (value) => (value === '' || value === null || value === undefined ? undefined : Number(value)),
  z
    .number({ error: 'Informe um número válido' })
    .int('Informe um número inteiro')
    .nonnegative('O valor não pode ser negativo')
    .optional(),
);

/** Checkbox HTML envia "on" quando marcado e nada quando desmarcado. */
export const checkbox = z.preprocess(
  (value) => value === 'on' || value === 'true' || value === true,
  z.boolean(),
);

export const emailSchema = z
  .string({ error: 'Informe o e-mail' })
  .trim()
  .toLowerCase()
  .max(120, 'E-mail muito longo')
  .pipe(z.email({ error: 'E-mail inválido' }));

/**
 * Interpreta o valor de um <input type="datetime-local"> ("2026-10-20T19:00")
 * como horário de Brasília, independentemente do fuso do servidor.
 */
export function parseDateTimeLocal(value: string, timeZone: string = TIME_ZONE): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value.trim());
  if (!match) return null;
  const [, y, mo, d, h, mi, s] = match.map(Number) as number[];
  const asUtc = Date.UTC(y, mo - 1, d, h, mi, s || 0);
  if (Number.isNaN(asUtc)) return null;

  // Descobre o deslocamento do fuso naquele instante e corrige (duas passagens cobrem horário de verão).
  let guess = asUtc;
  for (let i = 0; i < 2; i++) {
    const offset = zoneOffsetMs(new Date(guess), timeZone);
    guess = asUtc - offset;
  }
  return new Date(guess);
}

function zoneOffsetMs(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const zoned = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour'),
    get('minute'),
    get('second'),
  );
  return zoned - date.getTime();
}

export const requiredDateTimeLocal = z
  .string({ error: 'Informe a data e hora' })
  .min(1, 'Informe a data e hora')
  .transform((value, ctx) => {
    const date = parseDateTimeLocal(value);
    if (!date) {
      ctx.addIssue({ code: 'custom', message: 'Data e hora inválidas' });
      return z.NEVER;
    }
    return date;
  });

export const optionalDateTimeLocal = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .transform((value, ctx) => {
      const date = parseDateTimeLocal(value);
      if (!date) {
        ctx.addIssue({ code: 'custom', message: 'Data e hora inválidas' });
        return z.NEVER;
      }
      return date;
    })
    .optional(),
);
