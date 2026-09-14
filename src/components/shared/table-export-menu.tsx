import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Icon } from './icon';
import { downloadText, serializeTable, type TableExport } from '@/lib/table-export';

export function TableExportMenu<T>({
  rows,
  config,
  selected = false,
}: {
  rows: T[];
  config: TableExport<T>;
  selected?: boolean;
}) {
  const excel = async () => {
    try {
      const { downloadXlsx } = await import('@/lib/table-xlsx');
      downloadXlsx(`${config.filename}${selected ? '-secili' : ''}.xlsx`, rows, config.columns);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Excel dosyası oluşturulamadı.');
    }
  };
  const download = (format: 'csv' | 'json') =>
    downloadText(
      `${config.filename}${selected ? '-secili' : ''}.${format}`,
      serializeTable(rows, config.columns, format),
      format === 'csv' ? 'text/csv;charset=utf-8' : 'application/json;charset=utf-8',
    );
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant={selected ? 'secondary' : 'ghost'}
          size="sm"
          disabled={!rows.length}
        >
          <Icon name="download" />
          {selected ? 'Seçilenleri dışa aktar' : 'Dışa aktar'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          {rows.length} {selected ? 'seçili' : 'filtrelenmiş'} kayıt
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void excel()}>Excel (.xlsx)</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => download('csv')}>CSV (.csv)</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => download('json')}>JSON (.json)</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
