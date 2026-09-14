// shadcn Data Table composition, backed by TanStack Table.
import { Icon } from '@/components/shared/icon';
import { TableExportMenu } from '@/components/shared/table-export-menu';
import { BulkActionBar } from '@/components/shared/bulk-action-bar';
import { clearCompletedSelection, retainSelection, type TableExport } from '@/lib/table-export';
import { entityFromPath, type EntityRef } from '@/features/entities/entity-model';
import { usePageState } from '@/hooks/use-page-state';
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
  type Row,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table';
import { useEffect, useRef, type ReactNode } from 'react';
import { Button } from './button';
import { Card } from './card';
import { Checkbox } from './checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';
export function DataTable<T>({
  columns,
  data,
  getRowId,
  mobileCard,
  selectionActions,
  name = 'records',
  manualSorting = false,
  manualPagination = false,
  onOpen,
  unavailable,
  entityKind,
  exportConfig,
  filterKey,
  selectionLabel = 'Seçili kayıtlar',
}: {
  columns: ColumnDef<T, any>[];
  data: T[];
  getRowId: (row: T) => string;
  mobileCard: (row: T) => ReactNode;
  selectionActions?: (
    rows: T[],
    clearSelection: (ids?: string[]) => void,
    restoreFocus: () => boolean,
  ) => ReactNode;
  name?: string;
  manualSorting?: boolean;
  /** Caller owns server pagination and its footer; never slice its page a second time. */
  manualPagination?: boolean;
  onOpen?: (row: T, fullPage: boolean, ordered: T[]) => void;
  entityKind?: EntityRef['kind'];
  unavailable?: string;
  exportConfig?: TableExport<T>;
  filterKey?: string;
  selectionLabel?: string;
}) {
  const tableRoot = useRef<HTMLDivElement>(null);
  const selectable = Boolean(selectionActions || exportConfig);
  const [sorting, setSorting] = usePageState<SortingState>(`${name}:sort`, []),
    [visibility, setVisibility] = usePageState<VisibilityState>(`${name}:columns`, {}),
    [pagination, setPagination] = usePageState<PaginationState>(`${name}:pagination`, {
      pageIndex: 0,
      pageSize: 10,
    }),
    [rowSelection, setRowSelection] = usePageState<RowSelectionState>(`${name}:selection`, {});
  const selection: ColumnDef<T> = {
    id: 'select',
    enableSorting: false,
    enableHiding: false,
    header: ({ table }) => (
      <Checkbox
        aria-label="Bu sayfadaki kayıtları seç"
        checked={
          table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        aria-label="Kaydı seç"
        checked={row.getIsSelected()}
        onCheckedChange={(v) => row.toggleSelected(!!v)}
      />
    ),
  };
  const table = useReactTable({
    data,
    columns: selectable ? [selection, ...columns] : columns,
    getRowId,
    state: { sorting, columnVisibility: visibility, pagination, rowSelection },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setVisibility,
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    manualSorting,
    manualPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex: false,
  });
  useEffect(() => {
    const last = Math.max(0, Math.ceil(data.length / pagination.pageSize) - 1);
    if (pagination.pageIndex > last) setPagination((p) => ({ ...p, pageIndex: last }));
  }, [data.length, pagination.pageSize, pagination.pageIndex, setPagination]);
  const availableIds = JSON.stringify(data.map(getRowId));
  const previousFilter = useRef(filterKey);
  useEffect(() => {
    if (previousFilter.current !== filterKey) {
      previousFilter.current = filterKey;
      if (pagination.pageIndex !== 0) setPagination((p) => ({ ...p, pageIndex: 0 }));
    }
  }, [filterKey, pagination.pageIndex, setPagination]);
  useEffect(() => {
    const next = retainSelection(rowSelection, JSON.parse(availableIds));
    if (next !== rowSelection) setRowSelection(next);
  }, [availableIds, rowSelection, setRowSelection]);
  const rows = table.getRowModel().rows,
    selected = table.getSelectedRowModel().rows;
  const sortableColumns = table.getAllLeafColumns().filter((column) => column.getCanSort());
  const visibleDataColumns = table
    .getAllLeafColumns()
    .filter((column) => column.getCanHide() && column.getIsVisible());
  const activeSort = sorting[0];
  const open = (record: T, fullPage: boolean) =>
    onOpen?.(
      record,
      fullPage,
      table.getPrePaginationRowModel().rows.map((r) => r.original),
    );
  const restoreFocus = () => {
    const checkbox = tableRoot.current?.querySelectorAll<HTMLButtonElement>('[role="checkbox"]');
    const target =
      Array.from(checkbox || []).find((element) => element.getClientRects().length) ||
      tableRoot.current;
    if (!target?.isConnected) return false;
    target.focus({ preventScroll: true });
    return true;
  };
  const clearSelection = (ids?: string[]) => {
    setRowSelection((previous) => clearCompletedSelection(previous, ids));
    // A partial operation keeps focus in its result dialog; restore only once it closes.
    if (!ids) restoreFocus();
  };
  return (
    <div
      className="data-table"
      ref={tableRoot}
      tabIndex={-1}
      data-entity-table={entityKind}
      onClickCapture={(event) => {
        if (!entityKind || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        const anchor = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[href]');
        if (!anchor || anchor.hasAttribute('data-full-page')) return;
        const entity = entityFromPath(anchor.getAttribute('href') || '');
        if (!entity || entity.kind !== entityKind) return;
        const record = data.find((r) => getRowId(r) === entity.id);
        if (record && onOpen) {
          event.preventDefault();
          event.stopPropagation();
          open(record, event.detail > 1);
        }
      }}
    >
      <div className="data-table-controls">
        {selectable && rows.length > 0 && (
          <Checkbox
            className="mobile-select-page"
            aria-label="Bu sayfadaki kayıtları seç"
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          />
        )}
        <span className="record-count" role="status" aria-live="polite">
          {unavailable
            ? 'Rapor verisi bekleniyor'
            : `${data.length} kayıt${selected.length ? ` · ${selected.length} seçili` : ''}`}
        </span>
        {exportConfig && (
          <TableExportMenu
            rows={table.getPrePaginationRowModel().rows.map((r) => r.original)}
            config={exportConfig}
          />
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="table-columns-trigger">
              <Icon name="sliders-horizontal" />
              Sütunlar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="table-column-menu">
            <DropdownMenuLabel>Görünür sütunlar</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {table
              .getAllColumns()
              .filter((c) => c.getCanHide())
              .map((c) => (
                <DropdownMenuCheckboxItem
                  key={c.id}
                  checked={c.getIsVisible()}
                  disabled={c.getIsVisible() && visibleDataColumns.length === 1}
                  onSelect={(event) => event.preventDefault()}
                  onCheckedChange={(v) => c.toggleVisibility(v)}
                >
                  {typeof c.columnDef.header === 'string' ? c.columnDef.header : c.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
        {!manualSorting && sortableColumns.length > 0 && (
          <div className="table-mobile-sort">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" aria-label="Kayıtları sırala">
                  <Icon name="arrow-up-down" />
                  Sırala
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Sıralanacak alan</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={activeSort?.id || ''}
                  onValueChange={(id) =>
                    setSorting(id ? [{ id, desc: activeSort?.desc || false }] : [])
                  }
                >
                  <DropdownMenuRadioItem value="" onSelect={(event) => event.preventDefault()}>
                    Varsayılan sıra
                  </DropdownMenuRadioItem>
                  {sortableColumns.map((column) => (
                    <DropdownMenuRadioItem
                      key={column.id}
                      value={column.id}
                      onSelect={(event) => event.preventDefault()}
                    >
                      {typeof column.columnDef.header === 'string'
                        ? column.columnDef.header
                        : column.id}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup
                  value={activeSort?.desc ? 'desc' : 'asc'}
                  onValueChange={(direction) =>
                    activeSort && setSorting([{ id: activeSort.id, desc: direction === 'desc' }])
                  }
                >
                  <DropdownMenuRadioItem
                    value="asc"
                    disabled={!activeSort}
                    onSelect={(event) => event.preventDefault()}
                  >
                    Artan sıra
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem
                    value="desc"
                    disabled={!activeSort}
                    onSelect={(event) => event.preventDefault()}
                  >
                    Azalan sıra
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
      {selectable && selected.length > 0 && (
        <BulkActionBar
          count={selected.length}
          onClear={() => clearSelection()}
          label={selectionLabel}
        >
          {selectionActions?.(
            selected.map((r) => r.original),
            clearSelection,
            restoreFocus,
          )}
          {exportConfig && (
            <TableExportMenu
              rows={table
                .getPrePaginationRowModel()
                .rows.filter((r) => r.getIsSelected())
                .map((r) => r.original)}
              config={exportConfig}
              selected
            />
          )}
          {selected.length < data.length && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => table.toggleAllRowsSelected(true)}
            >
              <Icon name="check-check" />
              {manualPagination ? 'Bu sayfadaki' : 'Filtrelenmiş'} {data.length} kaydın tümünü seç
            </Button>
          )}
        </BulkActionBar>
      )}
      <div className="data-table-desktop">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id}>
                {group.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    data-column={header.column.id}
                    scope="col"
                    aria-sort={
                      !manualSorting && header.column.getIsSorted()
                        ? header.column.getIsSorted() === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : undefined
                    }
                  >
                    {header.isPlaceholder ? null : header.column.getCanSort() && !manualSorting ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="column-sort"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        <Icon
                          name={
                            header.column.getIsSorted() === 'desc'
                              ? 'arrow-down'
                              : header.column.getIsSorted() === 'asc'
                                ? 'arrow-up'
                                : 'chevrons-up-down'
                          }
                        />
                      </Button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.id}
                onClick={(e) => {
                  if (!(e.target as HTMLElement).closest('button,a,input,[role="checkbox"]'))
                    open(row.original, e.detail > 1);
                }}
                onDoubleClick={(e) => {
                  if (!(e.target as HTMLElement).closest('button,input,[role="checkbox"]'))
                    open(row.original, true);
                }}
                className={onOpen ? 'record-openable' : undefined}
                data-state={row.getIsSelected() ? 'selected' : undefined}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} data-column={cell.column.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="data-table-mobile">
        {rows.map((row: Row<T>) => (
          <Card
            key={row.id}
            className="mobile-record"
            data-selectable={selectable}
            data-state={row.getIsSelected() ? 'selected' : undefined}
            onClick={(event) => {
              if (
                !(event.target as HTMLElement).closest(
                  'a,button,input,[role=checkbox],[role=combobox]',
                )
              )
                open(row.original, event.detail > 1);
            }}
            onDoubleClick={(event) => {
              if (
                !(event.target as HTMLElement).closest(
                  'a,button,input,[role=checkbox],[role=combobox]',
                )
              )
                open(row.original, true);
            }}
          >
            {selectable && (
              <Checkbox
                className="mobile-record-select"
                aria-label="Kaydı seç"
                checked={row.getIsSelected()}
                onCheckedChange={(v) => row.toggleSelected(!!v)}
              />
            )}{' '}
            {mobileCard(row.original)}
          </Card>
        ))}
      </div>
      {!rows.length && (
        <div className="empty-state">
          <Icon name="search" />
          <p>{unavailable || 'Listelenecek kayıt bulunamadı.'}</p>
        </div>
      )}
      {!unavailable && !manualPagination && (
        <div className="data-table-pagination">
          <span>
            {data.length ? pagination.pageIndex * pagination.pageSize + 1 : 0}–
            {Math.min(data.length, (pagination.pageIndex + 1) * pagination.pageSize)} /{' '}
            {data.length}
          </span>
          <Select
            value={String(pagination.pageSize)}
            onValueChange={(v) => setPagination({ pageIndex: 0, pageSize: Number(v) })}
          >
            <SelectTrigger aria-label="Sayfa başına kayıt" className="page-size-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 25, 50, 100].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} / sayfa
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Önceki sayfa"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
          >
            <Icon name="chevron-left" />
          </Button>
          <span>
            {pagination.pageIndex + 1} / {Math.max(1, table.getPageCount())}
          </span>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Sonraki sayfa"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
          >
            <Icon name="chevron-right" />
          </Button>
        </div>
      )}
    </div>
  );
}
