import { describe, expect, it } from 'vitest';
import { parsePncpDate, parseTender, parseTendersPage, pncpTenderUrl } from './normalize';

// Formato real de um item de GET /v1/contratacoes/proposta (campos não usados foram omitidos).
const raw = {
  numeroControlePNCP: '78200482000110-1-000010/2026',
  objetoCompra: '  Registro de Preços para aquisição de\n software de gestão hospitalar. ',
  orgaoEntidade: { cnpj: '78200482000110', razaoSocial: 'MUNICIPIO DE SARANDI' },
  unidadeOrgao: {
    ufSigla: 'PR',
    municipioNome: 'Sarandi',
    nomeUnidade: 'MPR-PREFEITURA MUNICIPAL DE SARANDI',
  },
  modalidadeId: 6,
  modalidadeNome: 'Pregão - Eletrônico',
  numeroCompra: '90003',
  valorTotalEstimado: 1672457.32,
  srp: true,
  dataAberturaProposta: '2026-11-09T08:00:00',
  dataEncerramentoProposta: '2026-11-27T09:00:00',
  dataPublicacaoPncp: '2026-02-02T07:23:51',
  linkSistemaOrigem: 'https://cnetmobile.estaleiro.serpro.gov.br/comprasnet-web/public/landing',
  situacaoCompraId: 1,
  situacaoCompraNome: 'Divulgada no PNCP',
};

describe('parseTender', () => {
  it('normaliza uma contratação aberta', () => {
    const result = parseTender(raw);
    expect(result).toEqual({
      kind: 'open',
      tender: {
        pncpId: '78200482000110-1-000010/2026',
        object: 'Registro de Preços para aquisição de software de gestão hospitalar.',
        agencyName: 'MUNICIPIO DE SARANDI',
        agencyCnpj: '78200482000110',
        unitName: 'MPR-PREFEITURA MUNICIPAL DE SARANDI',
        city: 'Sarandi',
        uf: 'PR',
        modalityId: 6,
        modalityName: 'Pregão - Eletrônico',
        number: '90003',
        estimatedValue: 1672457.32,
        isPriceRegistration: true,
        // Horário de Brasília (UTC-3) convertido para UTC.
        opensAt: new Date('2026-11-09T11:00:00Z'),
        closesAt: new Date('2026-11-27T12:00:00Z'),
        publishedAt: new Date('2026-02-02T10:23:51Z'),
        sourceUrl: 'https://cnetmobile.estaleiro.serpro.gov.br/comprasnet-web/public/landing',
      },
    });
  });

  it('trata valor zero como não informado e campos opcionais ausentes', () => {
    const result = parseTender({
      ...raw,
      valorTotalEstimado: 0,
      numeroCompra: null,
      linkSistemaOrigem: null,
      dataAberturaProposta: null,
      srp: null,
    });
    expect(result.kind).toBe('open');
    if (result.kind !== 'open') return;
    expect(result.tender).toMatchObject({
      estimatedValue: null,
      number: null,
      sourceUrl: null,
      opensAt: null,
      isPriceRegistration: false,
    });
  });

  it('só aceita links http(s) vindos do PNCP', () => {
    for (const link of ['javascript:alert(1)', 'ftp://exemplo.gov.br/edital', 'não é url']) {
      const result = parseTender({ ...raw, linkSistemaOrigem: link });
      expect(result.kind === 'open' && result.tender.sourceUrl, link).toBeNull();
    }
  });

  it('marca como indisponível o que não aceita propostas', () => {
    const unavailable = { kind: 'unavailable', pncpId: raw.numeroControlePNCP };
    expect(parseTender({ ...raw, situacaoCompraId: 2 })).toEqual(unavailable);
    expect(parseTender({ ...raw, situacaoCompraId: 4 })).toEqual(unavailable);
    expect(parseTender({ ...raw, modalidadeId: 9, modalidadeNome: 'Inexigibilidade' })).toEqual(
      unavailable,
    );
    expect(parseTender({ ...raw, modalidadeId: 1, modalidadeNome: 'Leilão - Eletrônico' })).toEqual(
      unavailable,
    );
    expect(
      parseTender({ ...raw, modalidadeId: 14, modalidadeNome: 'Inaplicabilidade da Licitação' }),
    ).toEqual(unavailable);
  });

  it('rejeita registros fora do formato esperado', () => {
    const invalid = { kind: 'invalid' };
    expect(parseTender(null)).toEqual(invalid);
    expect(parseTender({ ...raw, numeroControlePNCP: '123' })).toEqual(invalid);
    expect(parseTender({ ...raw, objetoCompra: '   ' })).toEqual(invalid);
    expect(parseTender({ ...raw, dataEncerramentoProposta: null })).toEqual(invalid);
    expect(parseTender({ ...raw, unidadeOrgao: { ufSigla: 'XX' } })).toEqual(invalid);
    expect(parseTender({ ...raw, valorTotalEstimado: 'mil' })).toEqual(invalid);
  });

  it('limita textos ao tamanho das colunas', () => {
    const result = parseTender({
      ...raw,
      objetoCompra: 'a'.repeat(9000),
      orgaoEntidade: { razaoSocial: 'b'.repeat(400) },
    });
    expect(result.kind).toBe('open');
    if (result.kind !== 'open') return;
    expect(result.tender.object).toHaveLength(5000);
    expect(result.tender.agencyName).toHaveLength(191);
  });
});

describe('parseTendersPage', () => {
  it('lê a paginação e classifica cada registro', () => {
    const page = parseTendersPage({
      data: [raw, { ...raw, situacaoCompraId: 3 }, { foo: 'bar' }],
      totalRegistros: 2886,
      totalPaginas: 58,
      numeroPagina: 2,
      paginasRestantes: 56,
      empty: false,
    });
    expect(page).toMatchObject({ page: 2, totalPages: 58, totalRecords: 2886 });
    expect(page?.results.map((result) => result.kind)).toEqual(['open', 'unavailable', 'invalid']);
  });

  it('devolve null quando o envelope não é o esperado', () => {
    expect(parseTendersPage({ message: 'erro', status: 500 })).toBeNull();
    expect(parseTendersPage('<html>')).toBeNull();
  });
});

describe('parsePncpDate', () => {
  it('interpreta datas sem fuso como horário de Brasília', () => {
    expect(parsePncpDate('2026-11-27T09:00:00')).toEqual(new Date('2026-11-27T12:00:00Z'));
    expect(parsePncpDate('2026-11-18T21:48:28.617135')).toEqual(new Date('2026-11-19T00:48:28Z'));
  });

  it('respeita o fuso quando ele vem na data', () => {
    expect(parsePncpDate('2026-11-27T09:00:00Z')).toEqual(new Date('2026-11-27T09:00:00Z'));
    expect(parsePncpDate('2026-11-27T09:00:00-03:00')).toEqual(new Date('2026-11-27T12:00:00Z'));
  });

  it('devolve null para valores inválidos', () => {
    expect(parsePncpDate('27/11/2026')).toBeNull();
    expect(parsePncpDate('')).toBeNull();
    expect(parsePncpDate(undefined)).toBeNull();
  });
});

describe('pncpTenderUrl', () => {
  it('monta o link oficial da contratação', () => {
    expect(pncpTenderUrl('78200482000110-1-000010/2026')).toBe(
      'https://pncp.gov.br/app/editais/78200482000110/2026/10',
    );
    expect(pncpTenderUrl('invalido')).toBeNull();
  });
});
