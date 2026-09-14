import { useId, useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { Button } from './button';
import { Icon } from '@/components/shared/icon';
import { prepareProfileImage } from '@/lib/profile-image';
export function ProfileImageInput({
  value,
  onChange,
  label = 'Profil fotoğrafı',
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  id?: string;
}) {
  const generated = useId(),
    input = useRef<HTMLInputElement>(null),
    version = useRef(0);
  const [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const fieldId = id || generated;
  return (
    <div className="profile-image-control">
      <Avatar className="upload-avatar">
        <AvatarImage src={value || undefined} alt={label} />
        <AvatarFallback>
          <Icon name="user" />
        </AvatarFallback>
      </Avatar>
      <div>
        <label className="upload-label" htmlFor={fieldId}>
          {label}
        </label>
        <p className="field-hint">JPG, PNG, WebP · en fazla 5 MB</p>
        <input
          ref={input}
          id={fieldId}
          className="sr-only"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={busy}
          aria-describedby={`${fieldId}-error`}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const current = ++version.current;
            setBusy(true);
            setError('');
            try {
              const result = await prepareProfileImage(file);
              if (current === version.current) onChange(result);
            } catch (error) {
              setError(error instanceof Error ? error.message : 'Fotoğraf yüklenemedi.');
            } finally {
              if (current === version.current) setBusy(false);
              if (input.current) input.current.value = '';
            }
          }}
        />
        <div className="upload-actions">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => input.current?.click()}
          >
            {busy ? 'Hazırlanıyor…' : value ? 'Fotoğrafı değiştir' : 'Fotoğraf seç'}
          </Button>
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => {
                version.current++;
                onChange('');
                setError('');
              }}
            >
              Kaldır
            </Button>
          )}
        </div>
        <p id={`${fieldId}-error`} className="field-error" role="status">
          {error}
        </p>
      </div>
    </div>
  );
}
