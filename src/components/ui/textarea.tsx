import { cn } from '@/lib/utils';
import * as React from 'react';

function Textarea({
  className,
  ref,
  onBlur,
  onChange,
  onInvalid,
  ...props
}: React.ComponentProps<'textarea'>) {
  const innerRef = React.useRef<HTMLTextAreaElement>(null);
  React.useImperativeHandle(ref, () => innerRef.current!, []);
  const errorId = React.useId();
  const [error, setError] = React.useState('');
  const [touched, setTouched] = React.useState(false);
  const validate = (element: HTMLTextAreaElement) => {
    const text = element.value.trim();
    const message =
      props.required && !text
        ? 'Bu alan zorunludur.'
        : text && props.minLength && text.length < props.minLength
          ? `En az ${props.minLength} karakter girin.`
          : props.maxLength && element.value.length > props.maxLength
            ? `En fazla ${props.maxLength} karakter girin.`
            : '';
    element.setCustomValidity(message);
    return message;
  };
  React.useEffect(() => {
    if (innerRef.current) {
      const message = validate(innerRef.current);
      if (touched) setError(message);
    }
  }, [props.value, props.required, props.minLength, props.maxLength, touched]);
  const ownFeedback = props['aria-invalid'] === undefined && !!error;
  return (
    <>
      <textarea
        ref={innerRef}
        data-slot="textarea"
        className={cn(
          'flex field-sizing-content min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:aria-invalid:ring-destructive/40',
          className,
        )}
        {...props}
        placeholder={props.placeholder || 'Açıklamanızı yazın…'}
        aria-invalid={props['aria-invalid'] ?? ownFeedback}
        aria-describedby={
          [props['aria-describedby'], ownFeedback && errorId].filter(Boolean).join(' ') || undefined
        }
        onBlur={(e) => {
          setTouched(true);
          setError(validate(e.currentTarget));
          onBlur?.(e);
        }}
        onChange={(e) => {
          const message = validate(e.currentTarget);
          if (touched) setError(message);
          onChange?.(e);
        }}
        onInvalid={(e) => {
          e.preventDefault();
          setTouched(true);
          setError(validate(e.currentTarget));
          e.currentTarget.form?.querySelector<HTMLElement>(':invalid')?.focus();
          onInvalid?.(e);
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

export { Textarea };
