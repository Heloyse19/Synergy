// Sincronização das licitações abertas de um estado: API oficial do PNCP -> tabela `Tender`.
//
// A API não oferece busca por palavra-chave e leva de 5 a 40 segundos por página, então copiamos as
// contratações com propostas abertas para o banco e casamos com os nichos localmente. Uma sincronização
// percorre todas as páginas do estado (dezenas de chamadas, vários minutos) e roda em segundo plano no
// próprio servidor: uma chamada por vez, um estado por vez.
//
// Limitação conhecida: a fila vive na memória do processo, portanto vale para uma instância (como o
// limitador de requisições). O progresso fica em `TenderSync`; se o servidor reiniciar no meio, o sinal
// de vida para de ser atualizado e a sincronização pode ser pedida de novo.
import 'server-only';
import { prisma } from '@/lib/prisma';
import { fetchOpenTendersPage, PncpError, type OpenTendersQuery } from '@/lib/pncp/client';
import { parseTendersPage, type NormalizedTender, type TendersPage } from '@/lib/pncp/normalize';
import type { Uf } from './states';
import { syncAvailability, type SyncAvailability } from './sync-policy';
import { toSearchText } from './text';

/** Considera as licitações que encerram em até um ano (inclui credenciamentos de longa duração). */
const HORIZON_MS = 365 * 24 * 60 * 60 * 1000;
/** Trava de segurança contra paginação infinita: 400 páginas = 20 mil licitações em um estado. */
const MAX_PAGES = 400;
const MAX_ATTEMPTS = 3;
const RETRY_DELAYS_MS = [3_000, 10_000];
/** Pausa entre páginas para não pressionar a API pública. */
const PAGE_DELAY_MS = 500;

type SyncRuntime = {
  /** Encadeia as sincronizações para que rodem uma de cada vez. */
  queue: Promise<void>;
  /** Estados na fila ou em execução neste processo. */
  pending: Set<Uf>;
};

// Guardado em globalThis para sobreviver ao hot reload em desenvolvimento.
const globalRuntime = globalThis as unknown as { __synergyTenderSync?: SyncRuntime };
const runtime: SyncRuntime = (globalRuntime.__synergyTenderSync ??= {
  queue: Promise.resolve(),
  pending: new Set(),
});

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Renova o sinal de vida do estado em execução e dos que aguardam na fila. */
async function touchHeartbeats(): Promise<void> {
  await prisma.tenderSync.updateMany({
    where: { uf: { in: [...runtime.pending] }, status: 'RUNNING' },
    data: { heartbeatAt: new Date() },
  });
}

async function fetchPage(query: OpenTendersQuery): Promise<TendersPage> {
  for (let attempt = 1; ; attempt++) {
    await touchHeartbeats();
    try {
      const page = parseTendersPage(await fetchOpenTendersPage(query));
      if (!page || page.page !== query.page) {
        throw new PncpError('O PNCP retornou dados em um formato inesperado.', true);
      }
      return page;
    } catch (error) {
      const canRetry = error instanceof PncpError && error.retryable && attempt < MAX_ATTEMPTS;
      if (!canRetry) throw error;
      await sleep(RETRY_DELAYS_MS[attempt - 1]);
    }
  }
}

function tenderData(tender: NormalizedTender, seenAt: Date) {
  return { ...tender, searchText: toSearchText(tender.object), lastSeenAt: seenAt };
}

/** Grava as licitações abertas da página e remove as que deixaram de aceitar propostas. */
async function savePage(page: TendersPage, uf: Uf): Promise<number> {
  const seenAt = new Date();
  const open: NormalizedTender[] = [];
  const unavailable: string[] = [];
  for (const result of page.results) {
    // O filtro por UF é do PNCP; conferimos para que cada licitação pertença a um único estado.
    if (result.kind === 'open' && result.tender.uf === uf) open.push(result.tender);
    else if (result.kind === 'unavailable') unavailable.push(result.pncpId);
  }

  await prisma.$transaction([
    ...open.map((tender) => {
      const data = tenderData(tender, seenAt);
      return prisma.tender.upsert({ where: { pncpId: tender.pncpId }, create: data, update: data });
    }),
    prisma.tender.deleteMany({ where: { pncpId: { in: unavailable } } }),
  ]);
  return open.length;
}

async function syncState(uf: Uf): Promise<void> {
  const startedAt = new Date();
  try {
    await prisma.tenderSync.update({
      where: { uf },
      data: { startedAt, heartbeatAt: startedAt, pagesDone: 0, totalPages: null },
    });

    const closingUntil = new Date(startedAt.getTime() + HORIZON_MS);
    let totalPages = 1;
    let saved = 0;
    for (let page = 1; page <= totalPages; page++) {
      const result = await fetchPage({ uf, page, closingUntil });
      totalPages = Math.min(result.totalPages, MAX_PAGES);
      saved += await savePage(result, uf);
      await prisma.tenderSync.update({
        where: { uf },
        data: { heartbeatAt: new Date(), pagesDone: page, totalPages },
      });
      if (page < totalPages) await sleep(PAGE_DELAY_MS);
    }

    // Um estado sem nenhuma licitação aberta é quase certamente uma resposta incompleta do PNCP:
    // melhor manter o que já temos do que apagar tudo.
    if (saved === 0) throw new PncpError('O PNCP não retornou licitações para este estado.', true);

    // Só depois de percorrer todas as páginas sabemos o que deixou de estar aberto.
    const finishedAt = new Date();
    await prisma.tender.deleteMany({ where: { uf, lastSeenAt: { lt: startedAt } } });
    await prisma.tender.deleteMany({ where: { closesAt: { lt: finishedAt } } });
    const tenderCount = await prisma.tender.count({ where: { uf } });
    await prisma.tenderSync.update({
      where: { uf },
      data: {
        status: 'SUCCEEDED',
        completedAt: finishedAt,
        heartbeatAt: finishedAt,
        tenderCount,
        error: null,
      },
    });
  } catch (error) {
    console.error(`[licitações] sincronização de ${uf} falhou`, error);
    const message =
      error instanceof PncpError ? error.message : 'Erro inesperado ao sincronizar com o PNCP.';
    // As licitações já gravadas continuam disponíveis; só o estado da sincronização muda.
    await prisma.tenderSync
      .update({ where: { uf }, data: { status: 'FAILED', error: message } })
      .catch((updateError) => console.error('[licitações] falha ao registrar o erro', updateError));
  }
}

export type EnqueueResult =
  /** `done` resolve quando a sincronização termina (com sucesso ou falha); nunca rejeita. */
  { status: 'started'; done: Promise<void> } | { status: Exclude<SyncAvailability, 'available'> };

/**
 * Coloca a sincronização de um estado na fila, se ela puder rodar agora (ver `syncAvailability`).
 * Retorna imediatamente; o trabalho continua em segundo plano.
 */
export async function enqueueTenderSync(uf: Uf): Promise<EnqueueResult> {
  if (runtime.pending.has(uf)) return { status: 'running' };
  // Reserva o estado antes do primeiro `await` para que dois pedidos simultâneos não passem juntos.
  runtime.pending.add(uf);
  try {
    const now = new Date();
    const current = await prisma.tenderSync.findUnique({
      where: { uf },
      select: { status: true, heartbeatAt: true, completedAt: true },
    });
    const availability = syncAvailability(current, now);
    if (availability !== 'available') {
      runtime.pending.delete(uf);
      return { status: availability };
    }
    const running = {
      status: 'RUNNING' as const,
      startedAt: now,
      heartbeatAt: now,
      pagesDone: 0,
      totalPages: null,
      error: null,
    };
    await prisma.tenderSync.upsert({
      where: { uf },
      create: { uf, ...running },
      update: running,
    });
  } catch (error) {
    runtime.pending.delete(uf);
    throw error;
  }

  const done = runtime.queue.then(() => syncState(uf)).finally(() => runtime.pending.delete(uf));
  runtime.queue = done;
  return { status: 'started', done };
}
