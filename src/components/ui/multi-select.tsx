// Multiple-choice filter using the shadcn Dropdown Menu checkbox recipe.
import { Icon } from '@/components/shared/icon';
import { Button } from './button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu';
export function MultiSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="filter-button" data-active={value.length > 0}>
          {label}
          {value.length > 0 && <span className="filter-count">{value.length}</span>}
          <Icon name="chevron-down" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {options.map((o) => (
          <DropdownMenuCheckboxItem
            key={o.value}
            checked={value.includes(o.value)}
            onSelect={(e) => e.preventDefault()}
            onCheckedChange={(checked) =>
              onChange(checked ? [...value, o.value] : value.filter((v) => v !== o.value))
            }
          >
            {o.label}
          </DropdownMenuCheckboxItem>
        ))}
        {value.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onChange([])}>Seçimi temizle</DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
