import type { ComponentProps } from 'react';
import { BaseInput } from './base-input';
import { PhoneInput } from './phone-input';
export function Input({
  onValueChange,
  onChange,
  ...props
}: ComponentProps<'input'> & { onValueChange?: (value: string) => void }) {
  return props.type === 'tel' ? (
    <PhoneInput {...props} onValueChange={onValueChange} />
  ) : (
    <BaseInput
      {...props}
      onChange={(event) => {
        onChange?.(event);
        onValueChange?.(event.target.value);
      }}
    />
  );
}
