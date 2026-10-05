import { describe, expect, it } from 'vitest';
import { loginSchema, registerSchema } from './auth';

const valid = {
  name: 'Ana Lima',
  email: '  Ana@Exemplo.COM ',
  password: 'senha-forte-123',
  role: 'INVESTOR',
  startupName: '',
  nicheId: '',
  company: 'Anjos do Sul',
  headline: '',
};

describe('registerSchema', () => {
  it('normaliza o e-mail e aceita dados válidos', () => {
    const result = registerSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('ana@exemplo.com');
      expect(result.data.startupName).toBeUndefined();
      expect(result.data.nicheId).toBeUndefined();
    }
  });

  it('exige nome da startup quando o perfil é STARTUP', () => {
    const result = registerSchema.safeParse({ ...valid, role: 'STARTUP' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === 'startupName')).toBe(true);
    }
  });

  it('rejeita senha curta, e-mail inválido e perfil ADMIN', () => {
    expect(registerSchema.safeParse({ ...valid, password: '1234567' }).success).toBe(false);
    expect(registerSchema.safeParse({ ...valid, email: 'nao-e-email' }).success).toBe(false);
    expect(registerSchema.safeParse({ ...valid, role: 'ADMIN' }).success).toBe(false);
  });

  it('aceita campos condicionais ausentes (null) quando o perfil não os exibe', () => {
    const result = registerSchema.safeParse({
      ...valid,
      role: 'PROFESSIONAL',
      startupName: null,
      nicheId: null,
      company: null,
      headline: 'QA',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.headline).toBe('QA');
  });

  it('converte nicheId numérico vindo do formulário', () => {
    const result = registerSchema.safeParse({
      ...valid,
      role: 'STARTUP',
      startupName: 'Nexa',
      nicheId: '3',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.nicheId).toBe(3);
  });
});

describe('loginSchema', () => {
  it('exige e-mail e senha', () => {
    expect(loginSchema.safeParse({ email: 'a@b.co', password: 'x' }).success).toBe(true);
    expect(loginSchema.safeParse({ email: 'a@b.co', password: '' }).success).toBe(false);
    expect(loginSchema.safeParse({ email: null, password: 'x' }).success).toBe(false);
  });
});
