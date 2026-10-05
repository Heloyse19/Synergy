import { z } from 'zod';

/**
 * Estado padrão retornado pelas Server Actions de formulário (usado com useActionState).
 * - fieldErrors: erros por campo (vindos do Zod) para exibir abaixo de cada input.
 * - values: valores enviados, para repopular o formulário após um erro.
 */
export type ActionState = {
  status: 'idle' | 'error' | 'success';
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: Record<string, string>;
};

export const initialActionState: ActionState = { status: 'idle' };

/** Extrai os campos de texto de um FormData para repopular formulários. */
export function formValues(formData: FormData, keys: string[]): Record<string, string> {
  const values: Record<string, string> = {};
  for (const key of keys) {
    const value = formData.get(key);
    if (typeof value === 'string') values[key] = value;
  }
  return values;
}

/** Monta um ActionState de erro de validação a partir de um ZodError. */
export function validationError(
  error: z.ZodError,
  values?: Record<string, string>,
  message = 'Revise os campos destacados.',
): ActionState {
  const { fieldErrors } = z.flattenError(error);
  return { status: 'error', message, fieldErrors, values };
}

export function errorState(message: string, values?: Record<string, string>): ActionState {
  return { status: 'error', message, values };
}

export function successState(message?: string): ActionState {
  return { status: 'success', message };
}
