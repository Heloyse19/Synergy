import { describe, expect, it } from 'vitest';
import { includesTerm, stemToken, toSearchTerm, toSearchText, tokenize } from './text';

describe('stemToken', () => {
  it('leva singular e plural à mesma forma', () => {
    const pairs = [
      ['soluções', 'solução'],
      ['softwares', 'software'],
      ['sistemas', 'sistema'],
      ['hospitais', 'hospital'],
      ['painéis', 'painel'],
      ['nuvens', 'nuvem'],
      ['computadores', 'computador'],
      ['escolares', 'escolar'],
      ['licenças', 'licença'],
    ];
    for (const [plural, singular] of pairs) {
      expect(tokenize(plural), plural).toEqual(tokenize(singular));
    }
  });

  it('não altera siglas e palavras curtas', () => {
    expect(stemToken('sus')).toBe('sus');
    expect(stemToken('gps')).toBe('gps');
    expect(stemToken('erp')).toBe('erp');
  });
});

describe('toSearchText', () => {
  it('normaliza acentos, caixa, pontuação e palavras de ligação, com espaço nas pontas', () => {
    expect(toSearchText('Aquisição de SOFTWARES p/ a Gestão Hospitalar.')).toBe(
      ' aquisicao software p gestao hospitalar ',
    );
  });

  it('devolve um espaço para texto sem palavras', () => {
    expect(toSearchText(' -- ')).toBe(' ');
  });
});

describe('includesTerm', () => {
  const text = toSearchText('Contratação de sistemas de gestão hospitalar e prontuário eletrônico');

  it('encontra expressões inteiras, mesmo com plural ou acento diferentes', () => {
    expect(includesTerm(text, toSearchTerm('sistema de gestão'))).toBe(true);
    expect(includesTerm(text, toSearchTerm('Prontuários Eletrônicos'))).toBe(true);
  });

  it('ignora preposições e artigos entre as palavras', () => {
    const fleet = toSearchText('Solução para gestão, monitoramento e controle da frota municipal');
    expect(includesTerm(fleet, toSearchTerm('controle de frota'))).toBe(true);
    expect(includesTerm(fleet, toSearchTerm('gestão de frota'))).toBe(false);
    expect(
      includesTerm(toSearchText('ensino à distância'), toSearchTerm('ensino a distância')),
    ).toBe(true);
  });

  it('não casa pedaços de palavra', () => {
    expect(includesTerm(text, toSearchTerm('hospital'))).toBe(false);
    expect(includesTerm(text, toSearchTerm('gest'))).toBe(false);
  });

  it('ignora termo vazio', () => {
    expect(includesTerm(text, toSearchTerm('  '))).toBe(false);
  });
});
