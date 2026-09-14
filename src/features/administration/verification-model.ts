import { z } from 'zod';
const schema = z.object({
  id: z.string().min(1),
  type: z.enum(['SALE_CREATE', 'MEETING_CREATE', 'INSTALLMENT_PAYMENT']),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
  requester: z.string().min(1),
  createdAt: z.string().refine((v) => Number.isFinite(Date.parse(v))),
  description: z.string(),
  note: z.string().optional(),
  decidedAt: z.string().optional(),
});
export type VerificationRequest = z.infer<typeof schema>;
export function verificationRequests(settings: Record<string, string>): VerificationRequest[] {
  try {
    const value = JSON.parse(settings['verification-requests-v4'] || '[]');
    return Array.isArray(value) ? value.filter((v) => schema.safeParse(v).success) : [];
  } catch {
    return [];
  }
}
export function decisionIssue(
  request: VerificationRequest,
  status: 'APPROVED' | 'REJECTED',
  note: string,
) {
  if (request.status !== 'PENDING') return 'Bu talep için daha önce karar verilmiş.';
  if (status === 'REJECTED' && !note.trim()) return 'Ret gerekçesini yazın.';
  if (note.length > 1500) return 'İnceleme notu en fazla 1500 karakter olabilir.';
  return null;
}
