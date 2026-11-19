// Cliente da API oficial de consultas do PNCP (Portal Nacional de Contratações Públicas).
// Documentação: https://pncp.gov.br/api/consulta/swagger-ui/index.html
//
// Usamos apenas o endpoint documentado de contratações com recebimento de propostas em aberto. Ele não
// tem filtro por palavra-chave, por isso as licitações são copiadas para o banco (src/lib/tenders/sync.ts)
// e a busca por nicho acontece localmente. A busca textual do portal (/api/search) não é uma API pública:
// ela derruba conexões de clientes automatizados e não deve ser usada.
import { TIME_ZONE } from '@/lib/format';
import type { Uf } from '@/lib/tenders/states';

const BASE_URL = 'https://pncp.gov.br/api/consulta/v1';
const DEFAULT_USER_AGENT = 'tenders-sync/1.0';

/** O PNCP costuma levar de 5 a 40 segundos por página. */
const REQUEST_TIMEOUT_MS = 60_000;

/** Maior tamanho de página aceito pelo endpoint. */
export const PNCP_PAGE_SIZE = 50;

export class PncpError extends Error {
  constructor(
    message: string,
    /** Falhas transitórias (rede, tempo esgotado, HTTP 5xx/429) podem ser tentadas de novo. */
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = 'PncpError';
  }
}

export type OpenTendersQuery = {
  uf: Uf;
  page: number;
  /** Traz as contratações cujo recebimento de propostas termina até esta data. */
  closingUntil: Date;
};

/** Data no formato AAAAMMDD exigido pela API, no horário de Brasília. */
function formatApiDate(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(date)
    .replaceAll('-', '');
}

export function buildOpenTendersUrl(query: OpenTendersQuery): string {
  const params = new URLSearchParams({
    dataFinal: formatApiDate(query.closingUntil),
    uf: query.uf,
    pagina: String(query.page),
    tamanhoPagina: String(PNCP_PAGE_SIZE),
  });
  return `${BASE_URL}/contratacoes/proposta?${params}`;
}

/**
 * Busca uma página de contratações com propostas abertas em um estado.
 * Faz uma única tentativa; quem chama decide se repete (ver `retryable`).
 * O retorno é o JSON bruto: valide com `parseTendersPage` antes de usar.
 */
export async function fetchOpenTendersPage(
  query: OpenTendersQuery,
  fetchImpl: typeof fetch = fetch,
): Promise<unknown> {
  let response: Response;
  try {
    response = await fetchImpl(buildOpenTendersUrl(query), {
      headers: {
        Accept: 'application/json',
        'User-Agent': process.env.PNCP_USER_AGENT || DEFAULT_USER_AGENT,
      },
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === 'TimeoutError';
    throw new PncpError(
      timedOut ? 'O PNCP demorou demais para responder.' : 'Não foi possível conectar ao PNCP.',
      true,
    );
  }

  // 204: nenhuma contratação para os filtros informados.
  if (response.status === 204) {
    return { data: [], totalRegistros: 0, totalPaginas: 0, numeroPagina: query.page };
  }
  if (response.status === 429 || response.status >= 500) {
    throw new PncpError(`O PNCP está indisponível no momento (HTTP ${response.status}).`, true);
  }
  if (!response.ok) {
    throw new PncpError(`O PNCP recusou a consulta (HTTP ${response.status}).`, false);
  }

  try {
    return await response.json();
  } catch {
    throw new PncpError('O PNCP retornou uma resposta ilegível.', true);
  }
}
