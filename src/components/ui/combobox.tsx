import { useState } from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { Button } from './button';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './command';
import { normalize } from '@/lib/format';
export function CreatableCombobox({
  id,
  value,
  onValueChange,
  options,
  placeholder = 'Seçin veya ekleyin',
  invalid = false,
}: {
  id: string;
  value: string;
  onValueChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  invalid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const choices = [...new Set([...options, value].filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'tr'),
  );
  const choose = (next: string) => {
    onValueChange(next);
    setOpen(false);
    setQuery('');
  };
  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery('');
      }}
    >
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={invalid}
          className="creatable-trigger"
        >
          <span>{value || placeholder}</span>
          <ChevronsUpDown aria-hidden="true" className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="creatable-popover p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Ara veya yeni bir değer yaz…"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>Eşleşen kayıt bulunamadı.</CommandEmpty>
            <CommandGroup>
              {value && (
                <CommandItem value="Belirtilmedi" onSelect={() => choose('')}>
                  Seçimi kaldır
                </CommandItem>
              )}
              {choices.map((option) => (
                <CommandItem key={option} value={option} onSelect={() => choose(option)}>
                  <span className="flex-1">{option}</span>
                  {value === option && <Check className="size-4" />}
                </CommandItem>
              ))}
              {query.trim() &&
                !choices.some((option) => normalize(option) === normalize(query.trim())) && (
                  <CommandItem value={query} onSelect={() => choose(query.trim())}>
                    <Plus className="size-4" />“{query.trim()}” ekle
                  </CommandItem>
                )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
