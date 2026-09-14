import type { AccessState } from './access-state-model';
export const stateGroups = [
  'Tümü',
  'Giriş ve oturum',
  'Hesap ve kurum',
  'Bağlantı ve içerik',
] as const;
export function statePresentation(key: AccessState) {
  const group = [
    'unauthorized',
    'forbidden',
    'session-expired',
    'wrong-role',
    'unverified',
    'reset-expired',
  ].includes(key)
    ? 'Giriş ve oturum'
    : ['offline', 'maintenance', 'error', 'not-found'].includes(key)
      ? 'Bağlantı ve içerik'
      : 'Hesap ve kurum';
  const codes: Partial<Record<AccessState, string>> = {
    unauthorized: '401',
    forbidden: '403',
    'not-found': '404',
    error: '500',
    maintenance: '503',
  };
  return {
    group,
    code: codes[key],
    tone: ['error', 'offline', 'forbidden', 'deleted'].includes(key)
      ? 'rose'
      : ['pending', 'unverified', 'maintenance', 'session-expired'].includes(key)
        ? 'amber'
        : 'sage',
  };
}
