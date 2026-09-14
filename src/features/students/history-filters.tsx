import { useQueryFilter } from '@/hooks/use-query-filter';
import { emptyHistoryFilter, readHistoryFilter, type HistoryFilter } from './history-model';
import { SearchField } from '@/components/shared/feature-primitives';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { DateRangeFilter } from '@/components/forms/date-range-filter';

export function useHistoryFilter(name: string, fields: readonly string[]) {
  return useQueryFilter(name, emptyHistoryFilter, {
    keys: ['search', 'sort', 'order', 'startDate', 'endDate'],
    read: (p) => readHistoryFilter(p, fields),
    write: (p, v) => {
      Object.entries(v).forEach(([k, val]) => p.set(k, val));
      p.delete('page');
    },
  });
}
export function HistoryFilters({
  filter,
  onChange,
  fields,
  placeholder,
}: {
  filter: HistoryFilter;
  onChange: (value: HistoryFilter) => void;
  fields: [string, string][];
  placeholder: string;
}) {
  return (
    <>
      <SearchField
        value={filter.search}
        onChange={(search) => onChange({ ...filter, search })}
        placeholder={placeholder}
      />
      <Select
        value={`${filter.sort}:${filter.order}`}
        onValueChange={(v) => {
          const [sort, order] = v.split(':');
          onChange({ ...filter, sort, order: order as 'asc' | 'desc' });
        }}
      >
        <SelectTrigger aria-label="Geçmiş sıralaması">
          <SelectValue placeholder="Sıralama seçin" />
        </SelectTrigger>
        <SelectContent>
          {fields.flatMap(([key, label]) =>
            (['desc', 'asc'] as const).map((order) => (
              <SelectItem key={`${key}:${order}`} value={`${key}:${order}`}>
                {label}:{' '}
                {key === 'status'
                  ? order === 'asc'
                    ? 'A–Z'
                    : 'Z–A'
                  : order === 'asc'
                    ? 'en eski'
                    : 'en yeni'}
              </SelectItem>
            )),
          )}
        </SelectContent>
      </Select>
      <DateRangeFilter
        from={filter.startDate}
        to={filter.endDate}
        onChange={({ from, to }) => onChange({ ...filter, startDate: from, endDate: to })}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onChange({ ...emptyHistoryFilter })}
      >
        Sıfırla
      </Button>
    </>
  );
}
