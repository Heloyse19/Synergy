import { describe, expect, it } from 'vitest';
import { hasStartupFilters, parseStartupFilters } from './startup-filters';

describe('parseStartupFilters', () => {
  it('extrai a busca em minúsculas de espaços extras, limitada a 80 caracteres', () => {
    const filters = parseStartupFilters({ q: '  nexa pay  ' });
    expect(filters.q).toBe('nexa pay');
  });

  it('trunca a busca em 80 caracteres', () => {
    const filters = parseStartupFilters({ q: 'a'.repeat(100) });
    expect(filters.q).toHaveLength(80);
  });

  it('retorna busca vazia como undefined', () => {
    expect(parseStartupFilters({ q: '   ' }).q).toBeUndefined();
    expect(parseStartupFilters({}).q).toBeUndefined();
  });

  it('extrai a categoria quando é um id numérico positivo', () => {
    expect(parseStartupFilters({ categoria: '3' }).nicheId).toBe(3);
  });

  it('ignora categoria inválida (não numérica, negativa ou zero)', () => {
    expect(parseStartupFilters({ categoria: 'abc' }).nicheId).toBeUndefined();
    expect(parseStartupFilters({ categoria: '-1' }).nicheId).toBeUndefined();
    expect(parseStartupFilters({ categoria: '0' }).nicheId).toBeUndefined();
    expect(parseStartupFilters({ categoria: '1.5' }).nicheId).toBeUndefined();
  });

  it('extrai o estágio quando é um valor válido do enum', () => {
    expect(parseStartupFilters({ estagio: 'MVP' }).stage).toBe('MVP');
    expect(parseStartupFilters({ estagio: 'IDEA' }).stage).toBe('IDEA');
  });

  it('ignora estágio inválido (valor desconhecido ou diferente em maiúsculas e minúsculas)', () => {
    expect(parseStartupFilters({ estagio: 'mvp' }).stage).toBeUndefined();
    expect(parseStartupFilters({ estagio: 'garbage' }).stage).toBeUndefined();
  });

  it('retorna filtros vazios quando não há params', () => {
    expect(parseStartupFilters({})).toEqual({});
  });

  it('ativa o filtro Dar match apenas com minhas=1', () => {
    expect(parseStartupFilters({ minhas: '1' })).toEqual({ mine: true });
    expect(parseStartupFilters({ minhas: '0' })).toEqual({});
    expect(parseStartupFilters({ minhas: '' })).toEqual({});
  });

  it('reconhece filtros combinados', () => {
    const filters = parseStartupFilters({ q: 'nexa', categoria: '4', estagio: 'MVP', minhas: '1' });
    expect(filters).toEqual({ q: 'nexa', nicheId: 4, stage: 'MVP', mine: true });
    expect(hasStartupFilters(filters)).toBe(true);
  });
});

describe('hasStartupFilters', () => {
  it('reconhece presença de busca, categoria ou estágio', () => {
    expect(hasStartupFilters({ q: 'nexa' })).toBe(true);
    expect(hasStartupFilters({ nicheId: 2 })).toBe(true);
    expect(hasStartupFilters({ stage: 'MVP' })).toBe(true);
  });

  it('retorna falso sem filtros aplicados', () => {
    expect(hasStartupFilters({})).toBe(false);
  });
});
