import { useRef } from 'react';
import { useWorkspace } from '@/app/workspace-provider';
import { Icon } from '@/components/shared/icon';
import { PageHeading, Person } from '@/components/shared/primitives';
import { Button } from '@/components/ui/button';
import { Input as UIFieldInput } from '@/components/ui/input';
import { Label as UIFieldLabel } from '@/components/ui/label';
import {
  Select as UISelect,
  SelectContent as UISelectContent,
  SelectItem as UISelectItem,
  SelectTrigger as UISelectTrigger,
  SelectValue as UISelectValue,
} from '@/components/ui/select';
import { useOperations } from '@/features/operations/operations-provider';
import { usePageState } from '@/hooks/use-page-state';
import { navigate } from '@/hooks/use-route';
import { money } from '@/lib/format';
import { priceQuote, splitInstallments } from '@/lib/payments';
import { isDate, localDate } from '@/lib/validation';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { dueDates } from './finance-model';
export function SalePage({ id }: { id: number }) {
  const { state, dispatch } = useWorkspace(),
    { operations } = useOperations(),
    student = state.students.find((s) => s.id === id),
    plans = operations.plans.filter((p) => p.active);
  const methods = ['Havale / EFT', 'Kredi kartı', 'Nakit'].filter(
    (m) => state.settings[`payment:${m === 'Nakit' ? 'Nakit ödeme' : m}`] !== 'false',
  );
  const [planId, setPlanId] = usePageState('planId', plans[0]?.id || ''),
    [method, setMethod] = usePageState('method', methods[0] || ''),
    [installments, setInstallments] = usePageState(
      'installments',
      String(
        Math.max(
          1,
          Math.min(Number(state.settings.defaultInstallments) || 1, plans[0]?.installments || 1),
        ),
      ),
    ),
    [discount, setDiscount] = usePageState('discount', 0),
    [saleDate, setSaleDate] = usePageState('saleDate', localDate()),
    [firstDueDate, setFirstDueDate] = usePageState('firstDueDate', localDate());
  const plan = plans.find((p) => p.id === planId),
    quote = plan
      ? priceQuote(plan, saleDate, method, discount)
      : { base: 0, methodDiscount: 0, additionalDiscount: 0, amount: 0, campaign: false },
    amount = quote.amount;
  const committed = useRef(false);
  const paymentParts = splitInstallments(amount, Number(installments));
  if (!student)
    return (
      <>
        <PageHeading title="Öğrenci bulunamadı" />
        <Button asChild>
          <Link to="/admin/students">Öğrencilere dön</Link>
        </Button>
      </>
    );
  return (
    <>
      <PageHeading
        title="Yeni satış"
        description={`${student.name} için eğitim ve ödeme planı oluşturun.`}
      />
      <form
        className="sale-layout"
        onSubmit={(e) => {
          e.preventDefault();
          if (committed.current) return;
          if (
            !plan ||
            !methods.includes(method) ||
            !Number.isFinite(amount) ||
            amount < 0 ||
            !paymentParts.length ||
            Number(installments) > plan.installments ||
            !Number.isFinite(discount) ||
            discount < 0 ||
            discount > 50
          ) {
            toast.error('Paket ve indirim bilgilerini kontrol edin.');
            return;
          }
          const data = new FormData(e.currentTarget);
          if (!isDate(String(data.get('date')))) {
            toast.error('Geçerli bir satış tarihi seçin.');
            return;
          }
          if (!isDate(firstDueDate) || firstDueDate < saleDate) {
            toast.error('İlk vade, satış tarihinden önce olamaz.');
            return;
          }
          committed.current = true;
          dispatch({
            type: 'sale/save',
            sale: {
              id: crypto.randomUUID(),
              studentId: id,
              planId,
              course: plan.course,
              amount,
              method,
              installments: Number(installments),
              discount,
              date: saleDate,
              dueDates: dueDates(firstDueDate, Number(installments)),
            },
          });
          toast.success('Satış ve ödeme planı kaydedildi.');
          navigate('admin/reports/sales');
        }}
      >
        <div className="dialog-form">
          <div className="meeting-person">
            <Person student={student} />
          </div>
          <fieldset className="form-section" data-form-section="required">
            <legend>
              Satış bilgileri <span>Zorunlu</span>
            </legend>
            <div className="form-field choice-field">
              <UIFieldLabel htmlFor="sale-page-select-1">{'Eğitim paketi *'}</UIFieldLabel>
              <UISelect
                name={undefined}
                value={planId || undefined}
                onValueChange={(v) => {
                  setPlanId(v);
                  setInstallments(
                    String(
                      Math.max(
                        1,
                        Math.min(
                          Number(state.settings.defaultInstallments) || 1,
                          plans.find((p) => p.id === v)?.installments || 1,
                        ),
                      ),
                    ),
                  );
                }}
              >
                <UISelectTrigger
                  id="sale-page-select-1"
                  className="filter-select"
                  aria-label={'Eğitim paketi'}
                >
                  <UISelectValue placeholder={'Seçin'} />
                </UISelectTrigger>
                <UISelectContent position="popper">
                  {(
                    plans.map((p) => ({ value: p.id, label: `${p.name} · ${p.course}` })) as (
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
            <div className="form-grid">
              <div className="form-field choice-field">
                <UIFieldLabel htmlFor="sale-page-select-2">{'Ödeme yöntemi *'}</UIFieldLabel>
                <UISelect name={undefined} value={method || undefined} onValueChange={setMethod}>
                  <UISelectTrigger
                    id="sale-page-select-2"
                    className="filter-select"
                    aria-label={'Ödeme yöntemi'}
                  >
                    <UISelectValue placeholder={'Seçin'} />
                  </UISelectTrigger>
                  <UISelectContent position="popper">
                    {(methods as (string | { value: string; label: string })[]).map((option) => (
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
              <div className="form-field choice-field">
                <UIFieldLabel htmlFor="sale-page-select-3">{'Taksit sayısı *'}</UIFieldLabel>
                <UISelect
                  name={undefined}
                  value={installments || undefined}
                  onValueChange={setInstallments}
                >
                  <UISelectTrigger
                    id="sale-page-select-3"
                    className="filter-select"
                    aria-label={'Taksit sayısı'}
                  >
                    <UISelectValue placeholder={'Seçin'} />
                  </UISelectTrigger>
                  <UISelectContent position="popper">
                    {(
                      Array.from({ length: plan?.installments || 1 }, (_, i) => String(i + 1)) as (
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
              <div className="form-field">
                <UIFieldLabel htmlFor={'date'}>{'Satış tarihi *'}</UIFieldLabel>
                <UIFieldInput
                  id={'date'}
                  name="date"
                  type="date"
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="form-field">
              <UIFieldLabel htmlFor="sale-first-due">İlk vade tarihi *</UIFieldLabel>
              <UIFieldInput
                id="sale-first-due"
                type="date"
                min={saleDate || undefined}
                value={firstDueDate}
                onChange={(e) => setFirstDueDate(e.target.value)}
                required
              />
              <p className="field-hint">Sonraki taksitler aynı günün izleyen aylarına planlanır.</p>
            </div>
          </fieldset>
          <fieldset className="form-section form-section-optional" data-form-section="optional">
            <legend>
              Ek indirim <span>İsteğe bağlı</span>
            </legend>
            <div className="form-field">
              <UIFieldLabel htmlFor={'discount'}>{'Ek indirim (%)'}</UIFieldLabel>
              <UIFieldInput
                id={'discount'}
                name="discount"
                type="number"
                min={0}
                max={50}
                step="0.01"
                value={discount || ''}
                onChange={(e) => setDiscount(Number(e.target.value))}
              />
            </div>
          </fieldset>
          <div className="form-actions">
            <Button variant="outline" type="button" onClick={() => navigate('admin/students')}>
              Vazgeç
            </Button>
            <Button type="submit" disabled={!plan}>
              <Icon name="check" />
              Satışı kaydet
            </Button>
          </div>
        </div>
        <aside className="sale-summary">
          <span className="eyebrow">ÖDEME ÖZETİ</span>
          <h2>{plan?.name || 'Paket seçin'}</h2>
          <div>
            <span>{quote.campaign ? 'Kampanya bedeli' : 'Paket bedeli'}</span>
            <b>{money(quote.base)}</b>
          </div>
          <div>
            <span>Ödeme yöntemi indirimi</span>
            <b>{money(quote.methodDiscount)}</b>
          </div>
          <div>
            <span>Ek indirim (%{discount})</span>
            <b>{money(quote.additionalDiscount)}</b>
          </div>
          <div className="sale-total">
            <span>Toplam</span>
            <b>{money(amount)}</b>
          </div>
          <p>
            {paymentParts.length} taksit · {method}
          </p>
          <div className="payment-plan-list">
            {paymentParts.map((part, i) => (
              <div key={i}>
                <span>
                  {i + 1}. taksit{' '}
                  <small className="block muted">
                    {dueDates(firstDueDate, Number(installments))[i] || 'Vade seçin'}
                  </small>
                </span>
                <b>{money(part)}</b>
              </div>
            ))}
          </div>
        </aside>
      </form>
    </>
  );
}
