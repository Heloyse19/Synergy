import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type FieldProps = {
  label: string;
  htmlFor: string;
  children: ReactNode;
  error?: string[] | string;
  hint?: string;
  required?: boolean;
  className?: string;
};

/** Agrupa rótulo, controle, dica e mensagens de erro de um campo de formulário. */
export function Field({ label, htmlFor, children, error, hint, required, className }: FieldProps) {
  const errors = Array.isArray(error) ? error : error ? [error] : [];
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="ml-0.5 text-red-600">*</span> : null}
      </label>
      {children}
      {hint && errors.length === 0 ? <p className="text-xs text-slate-500">{hint}</p> : null}
      {errors.map((message) => (
        <p key={message} className="text-xs font-medium text-red-600" role="alert">
          {message}
        </p>
      ))}
    </div>
  );
}
