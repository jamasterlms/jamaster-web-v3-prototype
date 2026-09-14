import { validIBAN } from './settings-model.ts';

export const bankCurrencies = ['TRY', 'USD', 'EUR', 'GBP'] as const;
export type BankAccount = {
  id: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  iban: string;
  currency: string;
  isDefault: boolean;
  isActive: boolean;
};
export function blankBankAccount(): BankAccount {
  return {
    id: '',
    bankName: '',
    accountHolder: '',
    accountNumber: '',
    iban: '',
    currency: '',
    isDefault: false,
    isActive: true,
  };
}
export function readBankAccounts(settings: Record<string, string>): BankAccount[] {
  if (settings.bankAccounts) {
    try {
      const accounts: unknown = JSON.parse(settings.bankAccounts);
      if (Array.isArray(accounts))
        return accounts.filter(
          (v): v is BankAccount =>
            !!v &&
            typeof v.id === 'string' &&
            ['bankName', 'accountHolder', 'accountNumber', 'iban', 'currency'].every(
              (key) => typeof v[key] === 'string',
            ) &&
            typeof v.isActive === 'boolean' &&
            typeof v.isDefault === 'boolean',
        );
    } catch {
      /* Preserve old settings when a stored migration is unreadable. */
    }
  }
  if (!settings.bank && !settings.accountNumber && !settings.iban) return [];
  return [
    {
      id: 'legacy-bank-account',
      bankName: settings.bank || '',
      accountHolder: settings.accountHolder || '',
      accountNumber: settings.accountNumber || '',
      iban: settings.iban || '',
      currency: settings.bankCurrency || 'TRY',
      isDefault: settings['bank:Varsayılan hesap'] === 'true',
      isActive: settings['bank:Hesap aktif'] !== 'false',
    },
  ];
}
export function bankErrors(account: BankAccount, previous?: BankAccount) {
  const errors: Partial<Record<keyof BankAccount, string>> = {};
  if (account.bankName.trim().length < 2) errors.bankName = 'Banka adı en az 2 karakter olmalıdır.';
  if (account.accountHolder.trim().length < 2)
    errors.accountHolder = 'Hesap sahibi en az 2 karakter olmalıdır.';
  if (account.accountNumber.trim().length < 5)
    errors.accountNumber = 'Hesap numarası en az 5 karakter olmalıdır.';
  if (!bankCurrencies.includes(account.currency as (typeof bankCurrencies)[number]))
    errors.currency = 'Para birimi seçin.';
  if (account.iban && account.iban !== previous?.iban && !validIBAN(account.iban))
    errors.iban = 'Geçerli bir IBAN girin.';
  return errors;
}
export function saveBankAccount(accounts: BankAccount[], draft: BankAccount) {
  const account = {
    ...draft,
    bankName: draft.bankName.trim(),
    accountHolder: draft.accountHolder.trim(),
    accountNumber: draft.accountNumber.trim(),
    iban: draft.iban.replace(/\s/g, '').toUpperCase(),
  };
  const next = accounts
    .filter((a) => a.id !== account.id)
    .map((a) => (account.isDefault ? { ...a, isDefault: false } : a));
  const index = accounts.findIndex((a) => a.id === account.id);
  next.splice(index < 0 ? next.length : index, 0, account);
  return next;
}
