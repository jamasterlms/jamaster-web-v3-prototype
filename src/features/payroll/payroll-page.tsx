import { useState } from 'react';
import { useWorkspace } from '@/app/workspace-provider';
import { useOperations } from '@/features/operations/operations-provider';
import { Metrics, SearchField } from '@/components/shared/feature-primitives';
import { PageHeading, IconButton, StatusBadge } from '@/components/shared/primitives';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { MultiSelect } from '@/components/ui/multi-select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useQueryFilter } from '@/hooks/use-query-filter';
import { localDate } from '@/lib/validation';
import { fullDateTR, money, normalize, downloadCSV } from '@/lib/format';
import { salaryPaymentIssue, type SalaryRecord } from './payroll-model';
import { toast } from 'sonner';
const states = {
  PENDING: 'Bekliyor',
  PARTIALLY_PAID: 'Kısmi ödeme',
  PAID: 'Ödendi',
  CANCELLED: 'İptal edildi',
};
const salaryTypes = { HOURLY: 'Saatlik', WEEKLY: 'Haftalık', MONTHLY: 'Aylık' };
export function PayrollPage({
  kind,
  id,
  embedded = false,
}: {
  kind: SalaryRecord['kind'];
  id?: string;
  embedded?: boolean;
}) {
  const { state, dispatch } = useWorkspace(),
    { operations } = useOperations();
  const [filter, setFilter] = useQueryFilter(
    `payroll-${kind}`,
    { search: '', status: [] as string[], salaryType: [] as string[] },
    {
      keys: ['search', 'status', 'salaryType'],
      read: (p) => ({
        search: p.get('search') || '',
        status: p.getAll('status'),
        salaryType: p.getAll('salaryType'),
      }),
      write: (p, v) => {
        p.set('search', v.search);
        ['status', 'salaryType'].forEach((key) => {
          p.delete(key);
          v[key as 'status' | 'salaryType'].forEach((value) => p.append(key, value));
        });
      },
    },
  );
  const [paying, setPaying] = useState<SalaryRecord | null>(null),
    [amount, setAmount] = useState(''),
    [date, setDate] = useState(localDate()),
    [description, setDescription] = useState(''),
    [review, setReview] = useState(false);
  const all = (state.salaryRecords || []).filter(
    (r) => r.kind === kind && (!id || r.personId === id),
  );
  const rows = all.filter(
    (r) =>
      normalize(r.name + (r.description || '')).includes(normalize(filter.search)) &&
      (!filter.status.length || filter.status.includes(r.status)) &&
      (!filter.salaryType.length || filter.salaryType.includes(r.salaryType)),
  );
  const known = state.salaryRecords !== undefined;
  const teacher =
    id && kind === 'teacher' ? operations.teachers.find((t) => t.id === id) : undefined;
  const metrics = [
    {
      label: 'Toplam hakediş',
      value: known
        ? money(all.filter((r) => r.status !== 'CANCELLED').reduce((s, r) => s + r.totalAmount, 0))
        : '—',
    },
    { label: 'Ödenen', value: known ? money(all.reduce((s, r) => s + r.paidAmount, 0)) : '—' },
    {
      label: 'Kalan',
      value: known
        ? money(
            all
              .filter((r) => r.status !== 'CANCELLED')
              .reduce((s, r) => s + Math.max(0, r.totalAmount - r.paidAmount), 0),
          )
        : '—',
      highlight: true,
    },
  ];
  const openPayment = (r: SalaryRecord) => {
    setPaying(r);
    setAmount('');
    setDate(localDate());
    setDescription('');
    setReview(false);
  };
  return (
    <>
      {!embedded && (
        <PageHeading
          title={kind === 'teacher' ? 'Öğretmen maaşları' : 'Personel maaşları'}
          description="Hakedişleri, ödeme kayıtlarını ve kalan tutarları takip edin."
        />
      )}
      {teacher && (
        <p className="salary-current">
          Maaş tanımı:{' '}
          {teacher.salary
            ? `${money(teacher.salary.amount)} · ${salaryTypes[teacher.salary.salaryType]} · Ayın ${teacher.salary.paymentDay}. günü`
            : 'Tanımlanmamış'}
        </p>
      )}
      <Metrics items={metrics} />
      <div className="module-toolbar">
        <SearchField
          value={filter.search}
          onChange={(search) => setFilter({ ...filter, search })}
          placeholder="Ad veya açıklama ara"
        />
        <MultiSelect
          label="Ödeme durumu"
          value={filter.status}
          onChange={(status) => setFilter({ ...filter, status })}
          options={Object.entries(states).map(([value, label]) => ({ value, label }))}
        />
        <MultiSelect
          label="Maaş tipi"
          value={filter.salaryType}
          onChange={(salaryType) => setFilter({ ...filter, salaryType })}
          options={Object.entries(salaryTypes).map(([value, label]) => ({ value, label }))}
        />
        <Button
          variant="outline"
          disabled={!rows.length}
          onClick={() =>
            downloadCSV('maaslar.csv', [
              ['Ad', 'Vade', 'Maaş tipi', 'Toplam', 'Ödenen', 'Kalan', 'Durum'],
              ...rows.map((r) => [
                r.name,
                r.dueDate,
                salaryTypes[r.salaryType],
                r.totalAmount,
                r.paidAmount,
                r.totalAmount - r.paidAmount,
                states[r.status],
              ]),
            ])
          }
        >
          Dışa aktar
        </Button>
      </div>
      <DataTable
        name={`payroll-${kind}-${id || 'all'}`}
        data={rows}
        getRowId={(r) => r.id}
        unavailable={!known ? 'Maaş hareketleri henüz alınamadı.' : undefined}
        columns={[
          { accessorKey: 'name', header: 'Ad soyad' },
          {
            accessorKey: 'dueDate',
            header: 'Vade',
            cell: ({ row }) => fullDateTR(row.original.dueDate),
          },
          {
            accessorKey: 'salaryType',
            header: 'Maaş tipi',
            cell: ({ row }) => salaryTypes[row.original.salaryType],
          },
          {
            accessorKey: 'totalAmount',
            header: 'Hakediş',
            cell: ({ row }) => money(row.original.totalAmount),
          },
          {
            accessorKey: 'paidAmount',
            header: 'Ödenen',
            cell: ({ row }) => money(row.original.paidAmount),
          },
          {
            id: 'remaining',
            header: 'Kalan',
            accessorFn: (r) => r.totalAmount - r.paidAmount,
            cell: ({ row }) => money(row.original.totalAmount - row.original.paidAmount),
          },
          {
            accessorKey: 'status',
            header: 'Durum',
            cell: ({ row }) => <StatusBadge>{states[row.original.status]}</StatusBadge>,
          },
          {
            id: 'actions',
            header: 'İşlemler',
            cell: ({ row }) => (
              <IconButton
                icon="wallet"
                label="Ödeme kaydı ekle"
                disabled={['PAID', 'CANCELLED'].includes(row.original.status)}
                onClick={() => openPayment(row.original)}
              />
            ),
          },
        ]}
        mobileCard={(r) => (
          <>
            <strong>{r.name}</strong>
            <p>
              {fullDateTR(r.dueDate)} · {salaryTypes[r.salaryType]}
            </p>
            <p>
              {money(r.totalAmount)} · Kalan {money(r.totalAmount - r.paidAmount)}
            </p>
            <div className="table-actions">
              <StatusBadge>{states[r.status]}</StatusBadge>
              <IconButton
                icon="wallet"
                label="Ödeme kaydı ekle"
                disabled={['PAID', 'CANCELLED'].includes(r.status)}
                onClick={() => openPayment(r)}
              />
            </div>
          </>
        )}
      />
      <Dialog
        open={!!paying}
        onOpenChange={(o) => {
          if (!o) setPaying(null);
        }}
      >
        <DialogContent preventOutsideClose className="jam-modal">
          <DialogHeader>
            <DialogTitle>{review ? 'Ödeme kaydını kontrol edin' : 'Ödeme kaydı ekle'}</DialogTitle>
            <DialogDescription>
              {paying?.name} · Kalan {money(paying ? paying.totalAmount - paying.paidAmount : 0)}
            </DialogDescription>
          </DialogHeader>
          <form
            className="dialog-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (!paying) return;
              const latest = state.salaryRecords?.find((r) => r.id === paying.id);
              if (!latest) {
                toast.error('Maaş kaydı artık bulunamıyor.');
                return;
              }
              const error = salaryPaymentIssue(latest, Number(amount), date);
              if (error || date > localDate()) {
                toast.error(error || 'Ödeme tarihi gelecekte olamaz.');
                return;
              }
              if (!review) {
                setReview(true);
                return;
              }
              dispatch({
                type: 'salary/payment',
                id: paying.id,
                payment: {
                  id: crypto.randomUUID(),
                  amount: Number(amount),
                  date,
                  description: description.trim(),
                },
              });
              setPaying(null);
              toast.success('Ödeme kaydı eklendi.');
            }}
          >
            <div className="dialog-form-body">
              {review ? (
                <dl className="detail-grid">
                  <div>
                    <dt>Tutar</dt>
                    <dd>{money(Number(amount))}</dd>
                  </div>
                  <div>
                    <dt>Tarih</dt>
                    <dd>{fullDateTR(date)}</dd>
                  </div>
                  <div>
                    <dt>Açıklama</dt>
                    <dd>{description || '—'}</dd>
                  </div>
                </dl>
              ) : (
                <>
                  <div className="form-field">
                    <Label htmlFor="salary-amount">Ödeme tutarı *</Label>
                    <Input
                      id="salary-amount"
                      type="number"
                      inputMode="decimal"
                      min="0.01"
                      step="0.01"
                      max={paying ? paying.totalAmount - paying.paidAmount : 0}
                      placeholder="0,00"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() =>
                        setAmount(
                          String(
                            paying
                              ? Math.round((paying.totalAmount - paying.paidAmount) * 100) / 100
                              : 0,
                          ),
                        )
                      }
                    >
                      Kalan tutarın tamamı
                    </Button>
                  </div>
                  <div className="form-grid mt-5">
                    <div className="form-field">
                      <Label htmlFor="salary-date">Ödeme tarihi *</Label>
                      <Input
                        id="salary-date"
                        type="date"
                        required
                        max={localDate()}
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                      />
                    </div>
                  </div>
                  <fieldset className="form-section form-section-optional">
                    <legend>
                      Ek bilgiler <span>İsteğe bağlı</span>
                    </legend>
                    <div className="form-field">
                      <Label htmlFor="salary-note">Açıklama</Label>
                      <Textarea
                        id="salary-note"
                        placeholder="Ödemeye ilişkin not"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>
                  </fieldset>
                </>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => (review ? setReview(false) : setPaying(null))}
              >
                {review ? 'Düzenle' : 'Vazgeç'}
              </Button>
              <Button type="submit">{review ? 'Kaydı onayla' : 'Önizle'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
