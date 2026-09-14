import { z } from 'zod';
export const contractSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(3, 'Sözleşme adı en az 3 karakter olmalıdır.'),
  description: z.string().trim().min(5, 'Açıklama en az 5 karakter olmalıdır.'),
  content: z.string().trim().min(10, 'Sözleşme metni en az 10 karakter olmalıdır.'),
  showBranchInfo: z.boolean(),
  showUserInfo: z.boolean(),
  updatedAt: z.string().optional(),
});
export type ContractTemplate = z.infer<typeof contractSchema>;
export const blankContract: ContractTemplate = {
  id: '',
  name: '',
  description: '',
  content: '',
  showBranchInfo: true,
  showUserInfo: true,
};
export function contractTemplates(settings: Record<string, string>): ContractTemplate[] {
  try {
    const value = JSON.parse(settings['contract-templates-v4'] || '[]');
    return Array.isArray(value) ? value.filter((v) => contractSchema.safeParse(v).success) : [];
  } catch {
    return [];
  }
}
