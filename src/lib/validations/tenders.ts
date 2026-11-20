import { z } from 'zod';
import { UFS } from '@/lib/tenders/states';

export const tenderSyncSchema = z.object({
  uf: z.enum(UFS, { error: 'Escolha um estado válido' }),
});

export type TenderSyncInput = z.infer<typeof tenderSyncSchema>;
