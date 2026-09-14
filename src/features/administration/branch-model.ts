import { z } from 'zod';
import { emailSchema, phoneSchema } from '../../lib/validation.ts';

export const branchSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1, 'Şube adı zorunludur.'),
  address: z.string().trim().min(1, 'Adres zorunludur.'),
  email: emailSchema,
  phone: phoneSchema,
  monthlyPayment: z.number().min(0, 'Aylık ödeme negatif olamaz.'),
  paymentDay: z.number().int().min(1).max(31),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'CLOSED']),
  isActive: z.boolean(),
  description: z.string(),
  website: z.union([z.literal(''), z.url('Geçerli bir web adresi girin.')]),
  paymentCurrency: z.enum(['TRY', 'USD', 'EUR']),
  paymentDetails: z.string(),
  settings: z.object({
    currency: z.enum(['TRY', 'USD', 'EUR', 'GBP']),
    language: z.enum(['tr', 'en']),
  }),
});
export type BranchDraft = z.infer<typeof branchSchema>;
export const branchStatusLabels = {
  ACTIVE: 'Aktif',
  INACTIVE: 'Pasif',
  SUSPENDED: 'Askıya alındı',
  CLOSED: 'Kapalı',
};
export function branchDraft(row?: string[]): BranchDraft {
  let saved: Partial<BranchDraft> = {};
  try {
    saved = JSON.parse(row?.[8] || '{}');
  } catch {
    /* Legacy row, no structured fields. */
  }
  return {
    id: row?.[5] || '',
    name: row?.[0] || '',
    address: '',
    email: row?.[7] || '',
    phone: row?.[6] || '',
    monthlyPayment: 0,
    paymentDay: 1,
    status: row?.[4] === 'Pasif' ? 'INACTIVE' : 'ACTIVE',
    isActive: true,
    description: '',
    website: '',
    paymentCurrency: 'TRY',
    paymentDetails: '',
    settings: { currency: 'TRY', language: 'tr' },
    ...saved,
  };
}
export function branchToRow(draft: BranchDraft, previous?: string[]) {
  return [
    draft.name,
    draft.address,
    previous?.[2] || '0',
    previous?.[3] || '',
    branchStatusLabels[draft.status],
    draft.id,
    draft.phone,
    draft.email,
    JSON.stringify(draft),
  ];
}
