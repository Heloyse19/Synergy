/** Junta classes CSS ignorando valores falsy. Ex.: cn('btn', isActive && 'btn-active'). */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

/** Converte texto em slug (minúsculas, sem acentos, hifens). */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** Divide uma string "a, b, c" em lista limpa. */
export function splitList(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

/** Garante que um caminho de redirecionamento é interno (evita open redirect). */
export function safeInternalPath(path: string | null | undefined, fallback = '/app'): string {
  if (!path) return fallback;
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('://')) return fallback;
  return path;
}
