'use client';

import { useActionState } from 'react';
import { CalendarCheck, CalendarX } from 'lucide-react';
import { toggleAttendance } from '@/actions/events';
import { initialActionState } from '@/lib/action-state';
import { FormMessage } from '@/components/ui/form-message';
import { SubmitButton } from '@/components/ui/submit-button';

type AttendanceFormProps = {
  eventId: string;
  isInvestor: boolean;
  attending: boolean;
  disabledReason?: string;
};

export function AttendanceForm({
  eventId,
  isInvestor,
  attending,
  disabledReason,
}: AttendanceFormProps) {
  const [state, action] = useActionState(toggleAttendance, initialActionState);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="intent" value={attending ? 'leave' : 'join'} />
      <FormMessage state={state} />

      {attending ? (
        <SubmitButton variant="outline" className="w-full" pendingText="Cancelando...">
          <CalendarX className="size-4" aria-hidden />
          {isInvestor ? 'Cancelar presença' : 'Cancelar inscrição'}
        </SubmitButton>
      ) : (
        <SubmitButton
          className="w-full"
          pendingText="Confirmando..."
          disabled={Boolean(disabledReason)}
        >
          <CalendarCheck className="size-4" aria-hidden />
          {isInvestor ? 'Confirmar presença publicamente' : 'Inscrever-se'}
        </SubmitButton>
      )}

      {disabledReason && !attending ? (
        <p className="text-xs text-slate-500">{disabledReason}</p>
      ) : null}
    </form>
  );
}
