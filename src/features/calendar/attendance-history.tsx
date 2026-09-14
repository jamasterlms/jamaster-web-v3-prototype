import { DateRangeFilter } from '@/components/forms/date-range-filter';
import { StatusBadge } from '@/components/shared/primitives';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { MultiSelect } from '@/components/ui/multi-select';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useQueryFilter } from '@/hooks/use-query-filter';
import { dateTR, downloadCSV } from '@/lib/format';
import { localDate } from '@/lib/validation';
import {
  filterAttendanceRecords,
  lessonStatusLabels,
  type AttendanceFilters,
  type AttendanceRecord,
} from './attendance-model';

const defaultFilters: AttendanceFilters = {
  from: '',
  to: '',
  statuses: [],
  types: [],
  sort: 'desc',
};
const statusOptions = Object.entries(lessonStatusLabels).map(([value, label]) => ({
  value,
  label,
}));
const typeOptions = [
  { value: 'GROUP', label: 'Grup dersi' },
  { value: 'PRIVATE', label: 'Özel ders' },
  { value: 'unknown', label: 'Belirtilmedi' },
];
export function AttendanceHistory({
  records,
  onSelect,
}: {
  records: AttendanceRecord[];
  onSelect: (record: AttendanceRecord) => void;
}) {
  const [filters, setFilters] = useQueryFilter<AttendanceFilters>(
    'group-attendance-filters',
    defaultFilters,
    {
      keys: ['startDate', 'endDate', 'status', 'type', 'order'],
      read: (p) => ({
        from: p.get('startDate') || '',
        to: p.get('endDate') || '',
        statuses: p.getAll('status').filter((v) => statusOptions.some((s) => s.value === v)),
        types: p.getAll('type').filter((v) => typeOptions.some((s) => s.value === v)),
        sort: p.get('order') === 'asc' ? 'asc' : 'desc',
      }),
      write: (p, v) => {
        p.set('startDate', v.from);
        p.set('endDate', v.to);
        v.statuses.forEach((s) => p.append('status', s));
        v.types.forEach((t) => p.append('type', t));
        p.set('order', v.sort);
      },
    },
  );
  const rows = filterAttendanceRecords(records, filters);
  const timeRange = (r: AttendanceRecord) =>
    Number.isFinite(r.end)
      ? `${r.time} – ${new Date(r.end).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}${localDate(new Date(r.start)) !== localDate(new Date(r.end)) ? ` (${dateTR(new Date(r.end))})` : ''}`
      : r.time;
  const participation = (r: AttendanceRecord) =>
    r.rosterCount === null
      ? 'Kaydedilmedi'
      : `${r.present} / ${r.rosterCount}${r.participation === null ? '' : ` · %${r.participation}`}`;
  return (
    <>
      <div className="module-toolbar attendance-history-filters">
        <DateRangeFilter
          from={filters.from}
          to={filters.to}
          onChange={(range) => setFilters({ ...filters, ...range })}
        />
        <MultiSelect
          label="Ders durumu"
          value={filters.statuses}
          onChange={(statuses) => setFilters({ ...filters, statuses })}
          options={statusOptions}
        />
        <MultiSelect
          label="Ders tipi"
          value={filters.types}
          onChange={(types) => setFilters({ ...filters, types })}
          options={typeOptions}
        />
        <Select
          value={filters.sort}
          onValueChange={(sort) => setFilters({ ...filters, sort: sort as 'asc' | 'desc' })}
        >
          <SelectTrigger aria-label="Oturum sıralaması">
            <SelectValue placeholder="Sıralama seçin" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">En yeni ders</SelectItem>
            <SelectItem value="asc">En eski ders</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          disabled={
            !filters.from &&
            !filters.to &&
            !filters.statuses.length &&
            !filters.types.length &&
            filters.sort === 'desc'
          }
          onClick={() => setFilters(defaultFilters)}
        >
          Sıfırla
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" disabled={!rows.length}>
              Dışa aktar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onSelect={() =>
                downloadCSV('grup-yoklama-gecmisi.csv', [
                  [
                    'Tarih',
                    'Ders saati',
                    'Ders',
                    'Ders tipi',
                    'Ders durumu',
                    'Katılan',
                    'Kayıtlı öğrenci',
                    'Katılım (%)',
                  ],
                  ...rows.map((r) => [
                    r.date,
                    timeRange(r),
                    r.title,
                    r.lessonType || '',
                    r.event
                      ? lessonStatusLabels[r.status]
                      : r.archiveReason === 'rescheduled'
                        ? 'Yeniden planlandı'
                        : 'Takvimden kaldırıldı',
                    r.present,
                    r.rosterCount,
                    r.participation,
                  ]),
                ])
              }
            >
              CSV indir
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                const data = rows.map((r) => ({
                  eventId: r.eventId,
                  date: r.date,
                  time: r.time,
                  title: r.title,
                  lessonType: r.lessonType ?? null,
                  scheduleStatus: r.event ? r.status : null,
                  present: r.present,
                  rosterCount: r.rosterCount,
                  participation: r.participation,
                }));
                const url = URL.createObjectURL(
                  new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
                );
                const a = document.createElement('a');
                a.href = url;
                a.download = 'grup-yoklama-gecmisi.json';
                a.click();
                setTimeout(() => URL.revokeObjectURL(url), 500);
              }}
            >
              JSON indir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <DataTable
        name="group-attendance-history"
        data={rows}
        getRowId={(r) => r.id}
        manualSorting
        onOpen={(r) => onSelect(r)}
        columns={[
          {
            id: 'date',
            header: 'Ders tarihi',
            accessorFn: (r) => `${dateTR(r.date)} ${r.date.slice(0, 4)}`,
            enableSorting: false,
          },
          { id: 'time', header: 'Ders saati', accessorFn: timeRange, enableSorting: false },
          { accessorKey: 'title', header: 'Ders', enableSorting: false },
          {
            id: 'type',
            header: 'Ders tipi',
            accessorFn: (r) =>
              typeOptions.find((o) => o.value === r.lessonType)?.label || 'Belirtilmedi',
            enableSorting: false,
          },
          {
            id: 'participation',
            header: 'Kaydedilen katılım',
            accessorFn: participation,
            enableSorting: false,
          },
          {
            id: 'status',
            header: 'Ders durumu',
            cell: ({ row }) => (
              <StatusBadge>
                {row.original.event
                  ? lessonStatusLabels[row.original.status]
                  : row.original.archiveReason === 'rescheduled'
                    ? 'Yeniden planlandı'
                    : 'Takvimden kaldırıldı'}
              </StatusBadge>
            ),
            enableSorting: false,
          },
          {
            id: 'detail',
            header: '',
            enableSorting: false,
            cell: ({ row }) => (
              <Button variant="ghost" size="sm" onClick={() => onSelect(row.original)}>
                Öğrenci listesi
              </Button>
            ),
          },
        ]}
        mobileCard={(r) => (
          <>
            <strong>{r.title}</strong>
            <p>
              {dateTR(r.date)} {r.date.slice(0, 4)} · {timeRange(r)}
            </p>
            <p>{participation(r)}</p>
            <StatusBadge>
              {r.event
                ? lessonStatusLabels[r.status]
                : r.archiveReason === 'rescheduled'
                  ? 'Yeniden planlandı'
                  : 'Takvimden kaldırıldı'}
            </StatusBadge>
            <Button variant="ghost" size="sm" onClick={() => onSelect(r)}>
              Öğrenci listesi
            </Button>
          </>
        )}
      />
    </>
  );
}
