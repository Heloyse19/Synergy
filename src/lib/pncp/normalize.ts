// Converte a resposta da API oficial de consultas do PNCP no formato gravado em `Tender`.
// Módulo puro (sem rede nem banco): os dados externos são validados aqui antes de chegar ao banco.
// Documentação da API: https://pncp.gov.br/api/consulta/swagger-ui/index.html
import { z } from 'zod';
import { isUf, type Uf } from '@/lib/tenders/states';
import { tokenize } from '@/lib/tenders/text';
import { parseDateTimeLocal } from '@/lib/validations/shared';

/** Número de controle PNCP de uma contratação: CNPJ-1-SEQUENCIAL/ANO. */
const PNCP_ID = /^(\d{14})-1-(\d{6})\/(\d{4})$/;

/** Situação "Divulgada no PNCP". As demais (revogada, anulada, suspensa) não aceitam propostas. */
const SITUATION_PUBLISHED = 1;

const MAX_OBJECT_LENGTH = 5000;
const MAX_VARCHAR_LENGTH = 191;
const MAX_URL_LENGTH = 500;
const MAX_ESTIMATED_VALUE = 1e15;

const rawTenderSchema = z.object({
  numeroControlePNCP: z.string(),
  objetoCompra: z.string().nullish(),
  orgaoEntidade: z.object({ razaoSocial: z.string().nullish() }).nullish(),
  unidadeOrgao: z
    .object({
      ufSigla: z.string().nullish(),
      municipioNome: z.string().nullish(),
      nomeUnidade: z.string().nullish(),
    })
    .nullish(),
  modalidadeId: z.number().int().nullish(),
  modalidadeNome: z.string().nullish(),
  numeroCompra: z.string().nullish(),
  valorTotalEstimado: z.number().nullish(),
  srp: z.boolean().nullish(),
  dataAberturaProposta: z.string().nullish(),
  dataEncerramentoProposta: z.string().nullish(),
  dataPublicacaoPncp: z.string().nullish(),
  linkSistemaOrigem: z.string().nullish(),
  situacaoCompraId: z.number().int().nullish(),
});

const pageSchema = z.object({
  data: z.array(z.unknown()),
  totalRegistros: z.number().int().nonnegative(),
  totalPaginas: z.number().int().nonnegative(),
  numeroPagina: z.number().int().positive(),
});

export type NormalizedTender = {
  pncpId: string;
  object: string;
  agencyName: string;
  agencyCnpj: string;
  unitName: string | null;
  city: string | null;
  uf: Uf;
  modalityId: number;
  modalityName: string;
  number: string | null;
  estimatedValue: number | null;
  isPriceRegistration: boolean;
  opensAt: Date | null;
  closesAt: Date;
  publishedAt: Date;
  sourceUrl: string | null;
};

export type TenderParseResult =
  /** Aceita propostas: deve ser gravada/atualizada. */
  | { kind: 'open'; tender: NormalizedTender }
  /** Identificada, mas não é uma oportunidade (revogada, suspensa, leilão...): deve sair do banco. */
  | { kind: 'unavailable'; pncpId: string }
  /** Registro fora do formato esperado: é ignorado. */
  | { kind: 'invalid' };

export type TendersPage = {
  page: number;
  totalPages: number;
  totalRecords: number;
  results: TenderParseResult[];
};

function cleanText(
  value: string | null | undefined,
  maxLength = MAX_VARCHAR_LENGTH,
): string | null {
  const text = value?.replace(/\s+/g, ' ').trim();
  return text ? text.slice(0, maxLength) : null;
}

/**
 * Datas do PNCP vêm sem fuso ("2026-11-27T09:00:00") e representam o horário de Brasília.
 * Quando houver fuso explícito, ele é respeitado.
 */
export function parsePncpDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const text = value.trim();
  if (/(?:Z|[+-]\d{2}:\d{2})$/i.test(text)) {
    const date = new Date(text);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return parseDateTimeLocal(text.replace(/\.\d+$/, ''));
}

/** Só links http(s) são aceitos: o valor vem de terceiros e vira um `href` na interface. */
function safeExternalUrl(value: string | null | undefined): string | null {
  const text = value?.trim();
  if (!text || text.length > MAX_URL_LENGTH) return null;
  try {
    const url = new URL(text);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
  } catch {
    return null;
  }
}

const NON_COMPETITIVE_MODALITIES = new Set(['leilao', 'inexigibilidade', 'inaplicabilidade']);

/**
 * Leilão é venda de bens públicos; inexigibilidade e inaplicabilidade da licitação são contratações
 * diretas de um fornecedor já escolhido. Nenhuma é uma disputa em que a startup possa entrar. O teste é
 * pela primeira palavra do nome para não depender dos códigos da tabela de domínio do PNCP.
 */
function isOpportunityModality(modalityName: string): boolean {
  const [first] = tokenize(modalityName);
  return !NON_COMPETITIVE_MODALITIES.has(first);
}

/** Página oficial da contratação no portal do PNCP. */
export function pncpTenderUrl(pncpId: string): string | null {
  const match = PNCP_ID.exec(pncpId);
  if (!match) return null;
  const [, cnpj, sequence, year] = match;
  return `https://pncp.gov.br/app/editais/${cnpj}/${year}/${Number(sequence)}`;
}

export function parseTender(raw: unknown): TenderParseResult {
  const parsed = rawTenderSchema.safeParse(raw);
  if (!parsed.success) return { kind: 'invalid' };
  const data = parsed.data;

  const idMatch = PNCP_ID.exec(data.numeroControlePNCP);
  if (!idMatch) return { kind: 'invalid' };
  const pncpId = data.numeroControlePNCP;

  const modalityName = cleanText(data.modalidadeNome);
  if (data.situacaoCompraId !== SITUATION_PUBLISHED) return { kind: 'unavailable', pncpId };
  if (modalityName && !isOpportunityModality(modalityName)) return { kind: 'unavailable', pncpId };

  const object = cleanText(data.objetoCompra, MAX_OBJECT_LENGTH);
  const unitName = cleanText(data.unidadeOrgao?.nomeUnidade);
  const agencyName = cleanText(data.orgaoEntidade?.razaoSocial) ?? unitName;
  const uf = data.unidadeOrgao?.ufSigla?.trim().toUpperCase();
  const closesAt = parsePncpDate(data.dataEncerramentoProposta);
  const publishedAt = parsePncpDate(data.dataPublicacaoPncp);
  if (
    !object ||
    !agencyName ||
    !isUf(uf) ||
    !closesAt ||
    !publishedAt ||
    !modalityName ||
    data.modalidadeId == null
  ) {
    return { kind: 'invalid' };
  }

  // Zero costuma indicar orçamento sigiloso ou não informado, não uma contratação gratuita.
  const value = data.valorTotalEstimado;
  const estimatedValue =
    typeof value === 'number' && Number.isFinite(value) && value > 0 && value < MAX_ESTIMATED_VALUE
      ? Math.round(value * 100) / 100
      : null;

  return {
    kind: 'open',
    tender: {
      pncpId,
      object,
      agencyName,
      agencyCnpj: idMatch[1],
      unitName,
      city: cleanText(data.unidadeOrgao?.municipioNome),
      uf,
      modalityId: data.modalidadeId,
      modalityName,
      number: cleanText(data.numeroCompra),
      estimatedValue,
      isPriceRegistration: data.srp === true,
      opensAt: parsePncpDate(data.dataAberturaProposta),
      closesAt,
      publishedAt,
      sourceUrl: safeExternalUrl(data.linkSistemaOrigem),
    },
  };
}

/** Valida o envelope de paginação e normaliza cada registro. Devolve `null` se o envelope for inválido. */
export function parseTendersPage(payload: unknown): TendersPage | null {
  const parsed = pageSchema.safeParse(payload);
  if (!parsed.success) return null;
  return {
    page: parsed.data.numeroPagina,
    totalPages: parsed.data.totalPaginas,
    totalRecords: parsed.data.totalRegistros,
    results: parsed.data.data.map(parseTender),
  };
}
