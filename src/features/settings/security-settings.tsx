import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
export function SecuritySettings() {
  const [values, setValues] = useState({ current: '', next: '', confirm: '' }),
    [message, setMessage] = useState(''),
    [invalid, setInvalid] = useState(false);
  return (
    <section className="account-security">
      <h2 className="subsection-title">Güvenlik</h2>
      <p className="field-hint">
        Şifre formunu kontrol edebilirsiniz. Canlı hesap şifresi değiştirilmez ve girdiğiniz şifre
        saklanmaz.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const error = !values.current
            ? 'Mevcut şifrenizi girin.'
            : values.next.length < 8
              ? 'Yeni şifre en az 8 karakter olmalıdır.'
              : values.current === values.next
                ? 'Yeni şifre mevcut şifreden farklı olmalıdır.'
                : values.next !== values.confirm
                  ? 'Yeni şifreler eşleşmiyor.'
                  : '';
          setInvalid(!!error);
          setMessage(
            error || 'Şifre alanları kontrol edildi. Canlı hesabınıza değişiklik uygulanmadı.',
          );
          if (!error) setValues({ current: '', next: '', confirm: '' });
        }}
        noValidate
      >
        <div className="form-grid">
          {(
            [
              ['current', 'Mevcut şifre', 'current-password'],
              ['next', 'Yeni şifre', 'new-password'],
              ['confirm', 'Yeni şifre tekrar', 'new-password'],
            ] as const
          ).map(([key, label, autoComplete]) => (
            <div className="form-field" key={key}>
              <Label htmlFor={`security-${key}`}>{label} *</Label>
              <Input
                id={`security-${key}`}
                type="password"
                autoComplete={autoComplete}
                placeholder={label}
                value={values[key]}
                onChange={(e) => setValues({ ...values, [key]: e.target.value })}
              />
            </div>
          ))}
        </div>
        {message && (
          <p
            role={invalid ? 'alert' : 'status'}
            className={invalid ? 'field-error mt-4' : 'field-hint mt-4'}
          >
            {message}
          </p>
        )}
        <Button type="submit" className="mt-5">
          Şifre alanlarını kontrol et
        </Button>
      </form>
      <h2 className="subsection-title">Cihaz ve görünüm</h2>
      <p className="field-hint">
        Çalışma alanı bu tarayıcıda açık. Canlı oturum yönetimi bağlı değildir.
      </p>
      <Button asChild variant="outline">
        <Link to="/login">Giriş ekranını aç</Link>
      </Button>
    </section>
  );
}
