// Unidades da federação usadas nos filtros e na sincronização de licitações.

export const UF_NAMES = {
  AC: 'Acre',
  AL: 'Alagoas',
  AP: 'Amapá',
  AM: 'Amazonas',
  BA: 'Bahia',
  CE: 'Ceará',
  DF: 'Distrito Federal',
  ES: 'Espírito Santo',
  GO: 'Goiás',
  MA: 'Maranhão',
  MT: 'Mato Grosso',
  MS: 'Mato Grosso do Sul',
  MG: 'Minas Gerais',
  PA: 'Pará',
  PB: 'Paraíba',
  PR: 'Paraná',
  PE: 'Pernambuco',
  PI: 'Piauí',
  RJ: 'Rio de Janeiro',
  RN: 'Rio Grande do Norte',
  RS: 'Rio Grande do Sul',
  RO: 'Rondônia',
  RR: 'Roraima',
  SC: 'Santa Catarina',
  SP: 'São Paulo',
  SE: 'Sergipe',
  TO: 'Tocantins',
} as const;

export type Uf = keyof typeof UF_NAMES;

export const UFS = Object.keys(UF_NAMES) as Uf[];

export function isUf(value: unknown): value is Uf {
  return typeof value === 'string' && Object.hasOwn(UF_NAMES, value);
}

/** Estados que pedem artigo ("do Paraná", "da Bahia"); os demais usam só a preposição ("de São Paulo"). */
const UF_ARTICLES: Partial<Record<Uf, 'o' | 'a'>> = {
  AC: 'o',
  AP: 'o',
  AM: 'o',
  BA: 'a',
  CE: 'o',
  DF: 'o',
  ES: 'o',
  MA: 'o',
  PA: 'o',
  PB: 'a',
  PR: 'o',
  PI: 'o',
  RJ: 'o',
  RN: 'o',
  RS: 'o',
  TO: 'o',
};

/** "do Paraná", "da Bahia", "de São Paulo". */
export function ofState(uf: Uf): string {
  const article = UF_ARTICLES[uf];
  return `${article ? `d${article}` : 'de'} ${UF_NAMES[uf]}`;
}

/** "no Paraná", "na Bahia", "em São Paulo". */
export function inState(uf: Uf): string {
  const article = UF_ARTICLES[uf];
  return `${article ? `n${article}` : 'em'} ${UF_NAMES[uf]}`;
}

/**
 * Extrai a UF do campo livre "cidade" do perfil da startup, que segue o formato sugerido no formulário
 * ("Curitiba/PR"). Também aceita "Londrina - PR", "Recife, PE" e "Campo Grande MS".
 */
export function ufFromCity(city: string | null | undefined): Uf | null {
  if (!city) return null;
  const match = /(?:^|[\s/,(-])([A-Za-z]{2})\)?\s*$/.exec(city);
  const uf = match?.[1]?.toUpperCase();
  return isUf(uf) ? uf : null;
}
