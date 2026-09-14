import {
  forwardRef,
  useId,
  useState,
  type ComponentProps,
  type ComponentType,
  type Ref,
} from 'react';
import PhoneNumberInput, { type Country, type Value } from 'react-phone-number-input/max';
import labels from 'react-phone-number-input/locale/tr.json';
import { parsePhone } from '@/lib/validation';
import { Button } from './button';
import { BaseInput } from './base-input';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { getCountryCallingCode } from 'react-phone-number-input';

type Props = Omit<ComponentProps<'input'>, 'onChange'> & {
  onValueChange?: (value: string) => void;
};
// The package forwards its ref to the native input; its declaration still describes the old class.
const InternationalPhoneInput = PhoneNumberInput as unknown as ComponentType<
  Omit<ComponentProps<typeof PhoneNumberInput>, 'ref'> & { ref?: Ref<HTMLInputElement> }
>;
type CountrySelectProps = {
  value?: Country;
  onChange: (value?: Country) => void;
  options: { value?: Country; label: string; divider?: boolean }[];
  disabled?: boolean;
  readOnly?: boolean;
};
const PhoneTextInput = forwardRef<HTMLInputElement, ComponentProps<'input'>>((props, ref) => (
  <BaseInput {...props} ref={ref} />
));
PhoneTextInput.displayName = 'PhoneTextInput';
function CountrySelect({ value, onChange, options, disabled, readOnly }: CountrySelectProps) {
  const [open, setOpen] = useState(false);
  const current = options.find((option) => option.value === value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="phone-country"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || readOnly}
          aria-label={`Ülke kodu: ${current?.label || 'Uluslararası'}`}
        >
          <span>
            {value || 'INT'}
            <small>{value ? `+${getCountryCallingCode(value)}` : '+'}</small>
          </span>
          <ChevronsUpDown size={12} aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="country-popover p-0">
        <Command>
          <CommandInput placeholder="Ülke veya telefon kodu ara" />
          <CommandList>
            <CommandEmpty>Ülke bulunamadı.</CommandEmpty>
            <CommandGroup>
              {options
                .filter((option) => !option.divider)
                .map((option) => (
                  <CommandItem
                    key={option.value || 'international'}
                    value={`${option.label} ${option.value || ''} ${option.value ? getCountryCallingCode(option.value) : ''}`}
                    onSelect={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                  >
                    <span className="flex-1">{option.label}</span>
                    <span>{option.value ? `+${getCountryCallingCode(option.value)}` : '+'}</span>
                    {option.value === value && <Check className="size-4" />}
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
/** Country-aware editing with a value API, suitable for both controlled and native forms. */
export function PhoneInput({
  value: controlled,
  defaultValue,
  onValueChange,
  ref,
  ...props
}: Props) {
  const [local, setLocal] = useState(String(defaultValue ?? ''));
  const value = String(controlled ?? local);
  const id = useId();
  const change = (value: string) => {
    setLocal(value);
    onValueChange?.(value);
  };
  const number = parsePhone(value);
  // Retain an existing redacted record until the user replaces it; never invent its digits.
  if (/[•*]/.test(value))
    return (
      <BaseInput
        {...props}
        ref={ref}
        type="tel"
        value={value}
        onChange={(event) => change(event.target.value)}
      />
    );
  return (
    <div className="phone-control">
      <InternationalPhoneInput
        {...props}
        ref={ref}
        className="phone-input-wrap"
        value={(number?.number || value || undefined) as Value | undefined}
        onChange={(next: Value | undefined) => change(next || '')}
        defaultCountry="TR"
        international
        countryCallingCodeEditable={false}
        smartCaret={false}
        labels={labels}
        countrySelectComponent={CountrySelect}
        inputComponent={PhoneTextInput}
        autoComplete={props.autoComplete || 'tel'}
        inputMode="tel"
        placeholder={props.placeholder || 'Telefon numarasını girin'}
        aria-describedby={[props['aria-describedby'], id].filter(Boolean).join(' ')}
      />
      <span className="phone-format-hint" id={id}>
        {number
          ? number.formatInternational()
          : 'Ülke kodunu seçin veya + ülke koduyla yapıştırın.'}
      </span>
    </div>
  );
}
