import { describe, expect, it } from 'vitest';
import { cn, safeInternalPath, slugify, splitList } from './utils';

describe('utils', () => {
  it('cn ignora valores falsy', () => {
    expect(cn('a', false, null, undefined, 'b')).toBe('a b');
  });

  it('slugify remove acentos e espaços', () => {
    expect(slugify('E-commerce e Retailtech')).toBe('e-commerce-e-retailtech');
    expect(slugify('  Saúde & Bem-estar ')).toBe('saude-bem-estar');
  });

  it('splitList limpa listas separadas por vírgula', () => {
    expect(splitList(' React, Node.js ,, SQL ')).toEqual(['React', 'Node.js', 'SQL']);
    expect(splitList(null)).toEqual([]);
  });

  it('safeInternalPath evita open redirect', () => {
    expect(safeInternalPath('/app/eventos')).toBe('/app/eventos');
    expect(safeInternalPath('//evil.com')).toBe('/app');
    expect(safeInternalPath('https://evil.com')).toBe('/app');
    expect(safeInternalPath(undefined, '/x')).toBe('/x');
  });
});
