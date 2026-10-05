import type { ActionState } from '@/lib/action-state';
import { Alert } from './alert';

/** Exibe a mensagem geral retornada por uma Server Action (erro ou sucesso). */
export function FormMessage({ state }: { state: ActionState }) {
  if (state.status === 'idle' || !state.message) return null;
  return <Alert variant={state.status === 'error' ? 'error' : 'success'}>{state.message}</Alert>;
}
