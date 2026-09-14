import { Button } from '@/components/ui/button';
import { Icon } from './icon';
import { useWorkspace } from '@/app/workspace-provider';
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { navigate } from '@/hooks/use-route';
import { useRef, useState, type ReactNode } from 'react';
import { Person } from './primitives';
export function StudentPicker({
  children,
  mode = 'meeting',
}: {
  children: ReactNode;
  mode?: 'meeting' | 'sale';
}) {
  const [open, setOpen] = useState(false),
    choosing = useRef(false);
  const { state, openModal } = useWorkspace();
  return (
    <Popover
      open={open}
      onOpenChange={(v) => {
        choosing.current = false;
        setOpen(v);
      }}
    >
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        align="start"
        className="student-picker"
        onCloseAutoFocus={(e) => {
          if (choosing.current) e.preventDefault();
        }}
      >
        <Command>
          <CommandInput placeholder="Öğrenci adı veya numarası" />
          <CommandList>
            <CommandEmpty>Öğrenci bulunamadı.</CommandEmpty>
            {state.students.map((s) => (
              <CommandItem
                key={s.id}
                value={`${s.name} ${s.id}`}
                onSelect={() => {
                  choosing.current = true;
                  setOpen(false);
                  if (mode === 'sale') navigate(`admin/sales/${s.id}`);
                  else openModal({ type: 'meeting', id: s.id });
                }}
              >
                <Person student={s} />
              </CommandItem>
            ))}
          </CommandList>
        </Command>
        <Button
          variant="ghost"
          className="student-picker-create"
          onClick={() => {
            choosing.current = true;
            setOpen(false);
            if (mode === 'meeting') openModal({ type: 'student-form', afterCreate: 'meeting' });
            else navigate('admin/students/register');
          }}
        >
          <Icon name="plus" />
          Yeni öğrenci kaydı
        </Button>
      </PopoverContent>
    </Popover>
  );
}
