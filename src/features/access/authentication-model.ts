/** Mirrors jamaster-web types/auth.validation.ts at the pinned source revision. */
export function passwordIssue(password: string, reset: boolean) {
  if (password.length < 6) return 'Şifre en az 6 karakter olmalıdır.';
  if (reset && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password))
    return 'Şifre büyük harf, küçük harf ve rakam içermelidir.';
  return null;
}
