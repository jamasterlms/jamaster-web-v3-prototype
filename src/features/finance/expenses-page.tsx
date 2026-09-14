import { DialogFooter } from '@/components/ui/dialog';
import { expenseDraft, normalizeExpense, monthlyExpenses } from './expense-model';
import { localDate } from '@/lib/validation';
import { DateRangeFilter } from '@/components/forms/date-range-filter';
import { Metrics, SearchField } from '@/components/shared/feature-primitives';
import { Icon } from '@/components/shared/icon';
import { PageHeading, StatusBadge } from '@/components/shared/primitives';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { Label, Label as UIFieldLabel } from '@/components/ui/label';
import { MultiSelect } from '@/components/ui/multi-select';
import {
  Select as UISelect,
  SelectContent as UISelectContent,
  SelectItem as UISelectItem,
  SelectTrigger as UISelectTrigger,
  SelectValue as UISelectValue,
} from '@/components/ui/select';

import { validateExpense, type Expense } from '@/features/operations/model';
import { useOperations } from '@/features/operations/operations-provider';
import { usePageState } from '@/hooks/use-page-state';
import { navigate } from '@/hooks/use-route';
import { dateTR, downloadCSV, money, normalize } from '@/lib/format';
import { useState } from 'react';
import { toast } from 'sonner';
import { ExpenseFields } from './expense-fields';
const blank: Expense = {
  id: '',
  title: '',
  category: 'Hizmet',
  date: localDate(),
  amount: 0,
  status: 'Bekliyor',
  note: '',
  type: 'EXPENSE',
  transactionMode: 'ONE_TIME',
  isRecurringActive: true,
};
export function ExpensesPage({
  create = false,
  superAdmin = false,
}: {
  create?: boolean;
  superAdmin?: boolean;
}) {
  const { operations, save } = useOperations();
  const currentMonthExpenses = monthlyExpenses(operations.expenses, localDate().slice(0, 7));
  const [query, setQuery] = usePageState('query', ''),
    [category, setCategory] = usePageState('category', 'Tümü'),
    [editing, setEditing] = useState<Expense | null>(
      create ? { ...blank, date: localDate() } : null,
    );
  const [types, setTypes] = usePageState<string[]>('types', []),
    [range, setRange] = usePageState('range', { from: '', to: '' }),
    [sort, setSort] = usePageState('sortOrder', 'date:desc');
  const list = operations.expenses
      .filter(
        (e) =>
          (category === 'Tümü' || e.category === category) &&
          (!types.length || types.includes(e.type || 'EXPENSE')) &&
          (!range.from || e.date >= range.from) &&
          (!range.to || e.date <= range.to) &&
          normalize(e.title).includes(normalize(query)),
      )
      .sort(
        (a, b) =>
          (sort.endsWith('asc') ? 1 : -1) *
          (sort.startsWith('title')
            ? a.title.localeCompare(b.title, 'tr')
            : a.date.localeCompare(b.date)),
      ),
    total = currentMonthExpenses.reduce((n, e) => n + e.amount, 0),
    paid = currentMonthExpenses
      .filter((e) => e.status === 'Ödendi')
      .reduce((n, e) => n + e.amount, 0);
  const close = () => {
    setEditing(null);
    if (create) navigate(superAdmin ? 'super/expenses' : 'admin/expenses');
  };
  return (
    <>
      <PageHeading
        title="Muhasebe"
        description="Şubenizin harcamalarını, ödeme tarihlerini ve gider dağılımını takip edin."
      >
        <Button onClick={() => setEditing({ ...blank, date: localDate() })}>
          <Icon name="plus" />
          İşlem ekle
        </Button>
      </PageHeading>
      <Metrics
        items={[
          { label: 'Bu ayki gider kayıtları', value: money(total) },
          { label: 'Ödenen', value: money(paid), highlight: true },
          { label: 'Ödeme bekleyen', value: money(total - paid) },
        ]}
      />
      <div className="finance-overview">
        <div>
          <span className="eyebrow">GİDER DAĞILIMI</span>
          <h2>Harcamaların görünümü</h2>
          <p>{new Date().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}</p>
        </div>
        <div className="expense-breakdown">
          {[...new Set(currentMonthExpenses.map((e) => e.category))].map((c, i) => {
            const amount = currentMonthExpenses
              .filter((e) => e.category === c)
              .reduce((n, e) => n + e.amount, 0);
            return (
              <div key={c}>
                <div>
                  <i className={`tone-${i % 3}`} />
                  <span>{c}</span>
                  <b>{money(amount)}</b>
                </div>
                <div className="capacity-meter">
                  <span style={{ width: `${total ? (amount / total) * 100 : 0}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="module-toolbar">
        <SearchField value={query} onChange={setQuery} placeholder="İşlem adı ara" />
        <div className="form-field choice-field">
          <UIFieldLabel htmlFor="expenses-page-select-1">{'Kategori'}</UIFieldLabel>
          <UISelect name={undefined} value={category || undefined} onValueChange={setCategory}>
            <UISelectTrigger
              id="expenses-page-select-1"
              className="filter-select"
              aria-label={'Kategori'}
            >
              <UISelectValue placeholder={'Seçin'} />
            </UISelectTrigger>
            <UISelectContent position="popper">
              {(
                ['Tümü', 'Kira', 'Malzeme', 'Fatura', 'Hizmet', 'Personel'] as (
                  | string
                  | { value: string; label: string }
                )[]
              ).map((option) => (
                <UISelectItem
                  key={typeof option === 'string' ? option : option.value}
                  value={typeof option === 'string' ? option : option.value}
                >
                  {typeof option === 'string' ? option : option.label}
                </UISelectItem>
              ))}
            </UISelectContent>
          </UISelect>
        </div>
        <Button
          variant="outline"
          onClick={() =>
            downloadCSV('jamaster-giderler.csv', [
              ['İşlem', 'Tip', 'Kategori', 'Tarih', 'Tutar', 'Durum'],
              ...list.map((e) => [
                e.title,
                e.type === 'INCOME' ? 'Gelir' : 'Gider',
                e.category,
                e.date,
                e.amount,
                e.status,
              ]),
            ])
          }
        >
          <Icon name="download" />
          Dışa aktar
        </Button>
      </div>
      <p className="field-hint">
        Özet, bu ayın tek seferlik gider kayıtlarını kapsar. Tekrar planları gerçekleşmiş ödeme
        olarak toplanmaz.
      </p>
      <div className="module-toolbar secondary-filters">
        <MultiSelect
          label="İşlem tipi"
          value={types}
          onChange={setTypes}
          options={[
            { value: 'INCOME', label: 'Gelir' },
            { value: 'EXPENSE', label: 'Gider' },
          ]}
        />
        <DateRangeFilter {...range} onChange={setRange} />
        <div className="form-field choice-field">
          <UIFieldLabel htmlFor="expenses-page-select-2">{'Sıralama'}</UIFieldLabel>
          <UISelect name={undefined} value={sort || undefined} onValueChange={setSort}>
            <UISelectTrigger
              id="expenses-page-select-2"
              className="filter-select"
              aria-label={'Sıralama'}
            >
              <UISelectValue placeholder={'Seçin'} />
            </UISelectTrigger>
            <UISelectContent position="popper">
              {(
                [
                  { value: 'date:desc', label: 'Tarih en yeni' },
                  { value: 'date:asc', label: 'Tarih en eski' },
                  { value: 'title:asc', label: 'Başlık A–Z' },
                  { value: 'title:desc', label: 'Başlık Z–A' },
                ] as (string | { value: string; label: string })[]
              ).map((option) => (
                <UISelectItem
                  key={typeof option === 'string' ? option : option.value}
                  value={typeof option === 'string' ? option : option.value}
                >
                  {typeof option === 'string' ? option : option.label}
                </UISelectItem>
              ))}
            </UISelectContent>
          </UISelect>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setQuery('');
            setCategory('Tümü');
            setTypes([]);
            setRange({ from: '', to: '' });
            setSort('date:desc');
          }}
        >
          Sıfırla
        </Button>
      </div>
      <DataTable
        manualSorting
        data={list}
        getRowId={(e) => e.id}
        columns={[
          {
            accessorKey: 'title',
            header: 'İşlem',
            cell: ({ row }) => (
              <div>
                <strong>{row.original.title}</strong>
                <small className="cell-description">{row.original.note}</small>
              </div>
            ),
          },
          { accessorKey: 'category', header: 'Kategori' },
          {
            id: 'type',
            header: 'Tip',
            accessorFn: (e) => (e.type === 'INCOME' ? 'Gelir' : 'Gider'),
          },
          { accessorKey: 'date', header: 'Tarih', cell: ({ row }) => dateTR(row.original.date) },
          {
            accessorKey: 'amount',
            header: 'Tutar',
            cell: ({ row }) => <span data-sensitive>{money(row.original.amount)}</span>,
          },
          {
            accessorKey: 'status',
            header: 'Durum',
            cell: ({ row }) => <StatusBadge>{row.original.status}</StatusBadge>,
          },
          {
            id: 'actions',
            header: 'İşlemler',
            cell: ({ row }) => (
              <Button
                onClick={() => setEditing(expenseDraft(row.original))}
                variant="ghost"
                size="icon"
                aria-label="Düzenle"
                title="Düzenle"
              >
                <Icon name="pencil" />
              </Button>
            ),
          },
        ]}
        mobileCard={(e) => (
          <>
            <div className="flex justify-between">
              <strong>{e.title}</strong>
              <b data-sensitive>{money(e.amount)}</b>
            </div>
            <div className="mobile-record-meta">
              <span>
                {e.category} · {dateTR(e.date)}
              </span>
              <StatusBadge>{e.status}</StatusBadge>
            </div>
            <Button variant="outline" onClick={() => setEditing(expenseDraft(e))}>
              İşlemi düzenle
            </Button>
          </>
        )}
      />
      <Dialog
        open={!!editing}
        onOpenChange={(v) => {
          if (!v) close();
        }}
      >
        <DialogContent preventOutsideClose className={'jam-modal dialog-wide'}>
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'İşlemi düzenle' : 'Yeni işlem'}</DialogTitle>
            <DialogDescription className="sr-only">
              {editing?.id ? 'İşlemi düzenle' : 'Yeni işlem'}
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <form
              className="dialog-form"
              onSubmit={(e) => {
                e.preventDefault();
                const error = validateExpense(editing);
                if (error) {
                  toast.error(error);
                  return;
                }
                save({
                  type: 'save',
                  collection: 'expenses',
                  record: { ...normalizeExpense(editing), id: editing.id || crypto.randomUUID() },
                });
                toast.success('İşlem kaydedildi.');
                close();
              }}
            >
              <div className="dialog-form-body">
                <ExpenseFields value={editing} onChange={setEditing} />
              </div>
              <DialogFooter className="form-actions">
                <Button type="button" variant="outline" onClick={close}>
                  Vazgeç
                </Button>
                <Button type="submit">İşlemi kaydet</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
