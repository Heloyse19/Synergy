import { describe, expect, it } from 'vitest';
import { inState, isUf, ofState, ufFromCity, UFS } from './states';

describe('states', () => {
  it('lista as 27 unidades da federação', () => {
    expect(UFS).toHaveLength(27);
    expect(isUf('PR')).toBe(true);
    expect(isUf('pr')).toBe(false);
    expect(isUf('XX')).toBe(false);
    expect(isUf(null)).toBe(false);
  });

  it('usa a preposição certa para cada estado', () => {
    expect(ofState('PR')).toBe('do Paraná');
    expect(ofState('BA')).toBe('da Bahia');
    expect(ofState('SP')).toBe('de São Paulo');
    expect(inState('PR')).toBe('no Paraná');
    expect(inState('PB')).toBe('na Paraíba');
    expect(inState('MG')).toBe('em Minas Gerais');
  });

  it('extrai a UF dos formatos comuns do campo cidade', () => {
    expect(ufFromCity('Curitiba/PR')).toBe('PR');
    expect(ufFromCity('Londrina - pr')).toBe('PR');
    expect(ufFromCity('Recife, PE')).toBe('PE');
    expect(ufFromCity('Campo Grande MS')).toBe('MS');
    expect(ufFromCity('Ji-Paraná/RO ')).toBe('RO');
    expect(ufFromCity('SP')).toBe('SP');
  });

  it('devolve null quando a cidade não informa a UF', () => {
    expect(ufFromCity('São Paulo')).toBeNull();
    expect(ufFromCity('Belo Horizonte')).toBeNull();
    expect(ufFromCity('Lisboa/PT')).toBeNull();
    expect(ufFromCity('')).toBeNull();
    expect(ufFromCity(null)).toBeNull();
  });
});
