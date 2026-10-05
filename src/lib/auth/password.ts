import bcrypt from 'bcryptjs';

const COST = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, COST);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** Hash fixo usado para igualar o tempo de resposta quando o e-mail não existe (evita enumeração). */
export const DUMMY_HASH = '$2b$12$owaK/6aOnmLMCbg9FOdkCOLUqUcbNxwzgcUPbidxdMf8TCpalDL7O';
