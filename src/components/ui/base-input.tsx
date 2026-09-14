import { cn } from '@/lib/utils';
import { inputValueError } from '@/lib/validation';
import * as React from 'react';

function BaseInput({
  className,
  type = 'text',
  ref,
  onChange,
  onBlur,
  onInvalid,
  ...props
}: React.ComponentProps<'input'>) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  React.useImperativeHandle(ref, () => inputRef.current!, []);
  const errorId = React.useId();
  const [error, setError] = React.useState('');
  const [touched, setTouched] = React.useState(false);
  const synchronizeValidity = (input: HTMLInputElement) => {
    if (input.disabled || input.readOnly || ['file', 'hidden', 'checkbox', 'radio'].includes(type))
      return '';
    let message = inputValueError(type, input.value, !!props.required);
    if (!message && input.value && props.minLength && input.value.trim().length < props.minLength)
      message = `En az ${props.minLength} karakter girin.`;
    input.setCustomValidity(message);
    if (!message && !input.validity.valid) {
      if (input.validity.rangeUnderflow) message = `En küçük değer: ${input.min}.`;
      else if (input.validity.rangeOverflow) message = `En büyük değer: ${input.max}.`;
      else if (input.validity.stepMismatch) message = 'Geçerli bir sayı aralığı kullanın.';
      else message = 'Bu alandaki değeri kontrol edin.';
    }
    return message;
  };
  React.useEffect(() => {
    if (inputRef.current) {
      const message = synchronizeValidity(inputRef.current);
      if (touched) setError(message);
    }
  }, [
    props.value,
    props.min,
    props.max,
    props.minLength,
    props.required,
    props.disabled,
    type,
    touched,
  ]);
  const ownFeedback = props['aria-invalid'] === undefined && !!error;
  return (
    <>
      <input
        ref={inputRef}
        type={type}
        data-slot="input"
        inputMode={
          type === 'tel' ? 'tel' : type === 'email' ? 'email' : type === 'url' ? 'url' : undefined
        }
        autoComplete={type === 'tel' ? 'tel' : type === 'email' ? 'email' : undefined}
        className={cn(
          'h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30',
          'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
          'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
          className,
        )}
        {...props}
        placeholder={
          props.placeholder ||
          (type === 'email'
            ? 'ad@kurum.com'
            : type === 'url'
              ? 'https://…'
              : type === 'tel'
                ? '05xx xxx xx xx veya + ülke kodu'
                : type === 'number'
                  ? '0'
                  : type === 'password'
                    ? 'Şifrenizi girin'
                    : props['aria-label'] || 'Bilgi girin')
        }
        aria-invalid={props['aria-invalid'] ?? ownFeedback}
        aria-describedby={
          [props['aria-describedby'], ownFeedback && errorId].filter(Boolean).join(' ') || undefined
        }
        onChange={(event) => {
          const message = synchronizeValidity(event.currentTarget);
          if (touched) setError(message);
          onChange?.(event);
        }}
        onBlur={(event) => {
          setTouched(true);
          setError(synchronizeValidity(event.currentTarget));
          onBlur?.(event);
        }}
        onInvalid={(event) => {
          event.preventDefault();
          setTouched(true);
          setError(synchronizeValidity(event.currentTarget));
          const first = event.currentTarget.form?.querySelector<HTMLElement>(':invalid');
          first?.focus();
          onInvalid?.(event);
        }}
      />
      {ownFeedback && (
        <span id={errorId} className="field-error" role="status">
          {error}
        </span>
      )}
    </>
  );
}
export { BaseInput };
