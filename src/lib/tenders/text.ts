// Normalização de texto para casar o objeto das licitações com termos de busca.
// Módulo puro (sem banco) para facilitar testes unitários.
//
// O objeto de cada licitação é gravado também em `Tender.searchText`: palavras em minúsculas, sem acentos,
// com o plural reduzido, sem preposições e artigos, e um espaço em cada ponta
// (" aquisicao software gestao hospitalar "). Assim uma busca por palavra inteira vira um LIKE simples no
// banco (`% gestao hospitalar %`) e o mesmo teste pode ser repetido em memória com `includesTerm`.
//
// Atenção: ao mudar estas regras, as licitações já gravadas só passam a segui-las quando o estado for
// sincronizado de novo (o `searchText` é recalculado a cada sincronização).

/**
 * Palavras de ligação ignoradas na comparação, para que "gestão da frota", "gestão de frotas" e
 * "gestão, monitoramento e controle da frota" casem com os termos "gestão de frota" e "controle de frota".
 */
const STOPWORDS = new Set([
  'a',
  'ao',
  'aos',
  'as',
  'com',
  'da',
  'das',
  'de',
  'do',
  'dos',
  'e',
  'em',
  'na',
  'nas',
  'no',
  'nos',
  'o',
  'os',
  'ou',
  'para',
  'pela',
  'pelo',
  'por',
  'um',
  'uma',
]);

/**
 * Reduz os plurais mais comuns do português para que "soluções" case com "solução" e "softwares" com
 * "software". Não é um stemmer completo: basta que singular e plural cheguem à mesma forma.
 */
export function stemToken(token: string): string {
  if (token.length <= 3) return token;
  if (token.endsWith('oes') || token.endsWith('aes')) return `${token.slice(0, -3)}ao`;
  if (token.length > 4 && token.endsWith('ais')) return `${token.slice(0, -3)}al`;
  if (token.length > 4 && token.endsWith('eis')) return `${token.slice(0, -3)}el`;
  if (token.endsWith('ns')) return `${token.slice(0, -2)}m`;
  // "softwares", "hardwares": o singular termina em "e", então só o "s" sai.
  if (token.endsWith('wares')) return token.slice(0, -1);
  if (token.endsWith('ores') || token.endsWith('ares')) return token.slice(0, -2);
  if (token.endsWith('s') && !token.endsWith('ss')) return token.slice(0, -1);
  return token;
}

/** Quebra o texto em palavras normalizadas (minúsculas, sem acentos, plural reduzido, sem ligações). */
export function tokenize(text: string): string[] {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map(stemToken)
    .filter((token) => token !== '' && !STOPWORDS.has(token));
}

/** Texto pesquisável gravado no banco: palavras normalizadas com um espaço em cada ponta. */
export function toSearchText(text: string): string {
  const tokens = tokenize(text);
  return tokens.length > 0 ? ` ${tokens.join(' ')} ` : ' ';
}

/** Termo (palavra ou expressão) no mesmo formato do texto pesquisável, sem os espaços das pontas. */
export function toSearchTerm(term: string): string {
  return tokenize(term).join(' ');
}

/** Verifica se o termo aparece como palavra(s) inteira(s) no texto pesquisável. */
export function includesTerm(searchText: string, searchTerm: string): boolean {
  return searchTerm !== '' && searchText.includes(` ${searchTerm} `);
}
