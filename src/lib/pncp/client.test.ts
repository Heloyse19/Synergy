import { describe, expect, it } from 'vitest';
import { buildOpenTendersUrl, fetchOpenTendersPage, PncpError } from './client';

const query = { uf: 'PR', page: 3, closingUntil: new Date('2027-01-01T02:00:00Z') } as const;

/** Substituto do `fetch` que devolve sempre a mesma resposta (ou lança o erro informado). */
function fakeFetch(result: Response | Error): typeof fetch {
  return async () => {
    if (result instanceof Error) throw result;
    return result;
  };
}

async function failure(fetchImpl: typeof fetch): Promise<PncpError> {
  try {
    await fetchOpenTendersPage(query, fetchImpl);
  } catch (error) {
    if (error instanceof PncpError) return error;
    throw error;
  }
  throw new Error('a chamada deveria ter falhado');
}

describe('buildOpenTendersUrl', () => {
  it('usa o endpoint oficial com a data no horário de Brasília', () => {
    // 02:00 UTC de 1º de janeiro ainda é 31 de dezembro em Brasília.
    expect(buildOpenTendersUrl(query)).toBe(
      'https://pncp.gov.br/api/consulta/v1/contratacoes/proposta?dataFinal=20261231&uf=PR&pagina=3&tamanhoPagina=50',
    );
  });
});

describe('fetchOpenTendersPage', () => {
  it('devolve o JSON da página', async () => {
    const body = { data: [], totalRegistros: 0, totalPaginas: 0, numeroPagina: 3 };
    await expect(fetchOpenTendersPage(query, fakeFetch(Response.json(body)))).resolves.toEqual(
      body,
    );
  });

  it('trata 204 como página vazia', async () => {
    const page = await fetchOpenTendersPage(query, fakeFetch(new Response(null, { status: 204 })));
    expect(page).toEqual({ data: [], totalRegistros: 0, totalPaginas: 0, numeroPagina: 3 });
  });

  it('marca falhas transitórias como repetíveis', async () => {
    expect((await failure(fakeFetch(new Response('erro', { status: 500 })))).retryable).toBe(true);
    expect((await failure(fakeFetch(new Response('', { status: 429 })))).retryable).toBe(true);
    expect((await failure(fakeFetch(new TypeError('fetch failed')))).retryable).toBe(true);
    expect((await failure(fakeFetch(new Response('<html>', { status: 200 })))).retryable).toBe(
      true,
    );
  });

  it('não repete quando o PNCP recusa os parâmetros', async () => {
    const error = await failure(fakeFetch(new Response('{}', { status: 422 })));
    expect(error.retryable).toBe(false);
    expect(error.message).toContain('422');
  });

  it('informa quando o tempo de resposta esgota', async () => {
    const timeout = new DOMException('The operation timed out', 'TimeoutError');
    expect((await failure(fakeFetch(timeout))).message).toContain('demorou');
  });
});
