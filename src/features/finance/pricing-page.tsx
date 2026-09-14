import { DialogFooter } from '@/components/ui/dialog';
import { useWorkspace } from '@/app/workspace-provider';
import { Icon } from '@/components/shared/icon';
import { PageHeading, StatusBadge } from '@/components/shared/primitives';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input as UIFieldInput } from '@/components/ui/input';
import { Label as UIFieldLabel } from '@/components/ui/label';
import {
  Select as UISelect,
  SelectContent as UISelectContent,
  SelectItem as UISelectItem,
  SelectTrigger as UISelectTrigger,
  SelectValue as UISelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { contractTemplates } from '@/features/administration/contract-model';
import { validatePricePlan, type PricePlan } from '@/features/operations/model';
import { useOperations } from '@/features/operations/operations-provider';
import { navigate } from '@/hooks/use-route';
import { money } from '@/lib/format';
import { useState } from 'react';
import { toast } from 'sonner';
import { PricingFields, defaultDiscounts } from './pricing-fields';
import { useLearningData } from '@/features/education/learning-catalog';
const blank: PricePlan = {
  id: '',
  name: '',
  course: '',
  lessons: 120,
  price: 0,
  installments: 6,
  active: true,
  periodId: '',
  contract: '',
  hasCampaign: false,
  paymentDiscounts: defaultDiscounts,
};
export function PricingPage({ create = false }: { create?: boolean }) {
  const { operations, save } = useOperations(),
    [editing, setEditing] = useState<PricePlan | null>(create ? blank : null);
  const { state } = useWorkspace();
  const catalog = useLearningData();
  const contracts = contractTemplates(state.settings);
  const close = () => {
    setEditing(null);
    if (create) navigate('admin/pricing');
  };
  return (
    <>
      <PageHeading
        title="Fiyatlandırma"
        description="Eğitim paketleri, ders hakları ve ödeme seçenekleri."
      >
        <Button onClick={() => setEditing({ ...blank })}>
          <Icon name="plus" />
          Paket oluştur
        </Button>
      </PageHeading>
      <div className="pricing-grid">
        {operations.plans.map((p, i) => (
          <Card className={`pricing-card ${i === 1 ? 'featured' : ''}`} key={p.id}>
            <div className="flex justify-between items-center">
              <span className={`course-symbol tone-${i % 3}`}>
                <Icon name="graduation-cap" />
              </span>
              <StatusBadge>{p.active ? 'Aktif' : 'Pasif'}</StatusBadge>
            </div>
            <span className="eyebrow">{p.course}</span>
            <h2>{p.name}</h2>
            <div className="package-price" data-sensitive>
              {money(p.price)}
            </div>
            <p>Eğitim paketi toplam bedeli</p>
            <ul>
              <li>
                <Icon name="check" />
                {p.lessons} ders eğitimi
              </li>
              <li>
                <Icon name="check" />
                {p.installments} taksite kadar ödeme
              </li>
              <li>
                <Icon name="check" />
                Öğrenci gelişim raporları
              </li>
            </ul>
            <div className="plan-toggle">
              <span>Satışa açık</span>
              <Switch
                checked={p.active}
                aria-label={`${p.name} satışa açık`}
                onCheckedChange={(active) =>
                  save({ type: 'save', collection: 'plans', record: { ...p, active } })
                }
              />
            </div>
            <Button variant="outline" onClick={() => setEditing({ ...blank, ...p })}>
              Paketi düzenle
              <Icon name="arrow-up-right" />
            </Button>
          </Card>
        ))}
      </div>
      <Dialog
        open={!!editing}
        onOpenChange={(v) => {
          if (!v) close();
        }}
      >
        <DialogContent preventOutsideClose className={'jam-modal dialog-wide'}>
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Paketi düzenle' : 'Yeni eğitim paketi'}</DialogTitle>
            <DialogDescription className="sr-only">
              {editing?.id ? 'Paketi düzenle' : 'Yeni eğitim paketi'}
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <form
              className="dialog-form"
              onSubmit={(e) => {
                e.preventDefault();
                const error = validatePricePlan(editing);
                if (error) {
                  toast.error(error);
                  return;
                }
                save({
                  type: 'save',
                  collection: 'plans',
                  record: { ...editing, id: editing.id || crypto.randomUUID() },
                });
                toast.success('Paket kaydedildi.');
                close();
              }}
            >
              <div className="dialog-form-body">
                <fieldset className="form-section" data-form-section="required">
                  <legend>
                    Paket bilgileri <span>Zorunlu</span>
                  </legend>
                  <div className="form-grid">
                    <div className="form-field">
                      <UIFieldLabel htmlFor={'plan-name'}>{'Paket adı *'}</UIFieldLabel>
                      <UIFieldInput
                        id={'plan-name'}
                        name="plan-name"
                        value={editing.name}
                        onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-field choice-field">
                      <UIFieldLabel htmlFor="pricing-page-select-1">{'Eğitim *'}</UIFieldLabel>
                      <UISelect
                        name={undefined}
                        value={editing.course || undefined}
                        onValueChange={(course) => setEditing({ ...editing, course })}
                      >
                        <UISelectTrigger
                          id="pricing-page-select-1"
                          className="filter-select"
                          aria-label={'Eğitim'}
                        >
                          <UISelectValue placeholder={'Seçin'} />
                        </UISelectTrigger>
                        <UISelectContent position="popper">
                          {(
                            [
                              ...new Set(
                                [
                                  ...catalog.educations
                                    .filter((e) => e.isActive)
                                    .map((e) => e.name),
                                  editing.course,
                                ].filter(Boolean),
                              ),
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
                    <div className="form-field">
                      <UIFieldLabel htmlFor={'lessons'}>{'Ders sayısı *'}</UIFieldLabel>
                      <UIFieldInput
                        id={'lessons'}
                        name="lessons"
                        type="number"
                        min={1}
                        value={editing.lessons}
                        onChange={(e) =>
                          setEditing({ ...editing, lessons: Number(e.target.value) })
                        }
                        required
                      />
                    </div>
                    <div className="form-field">
                      <UIFieldLabel htmlFor={'price'}>{'Fiyat (₺) *'}</UIFieldLabel>
                      <UIFieldInput
                        id={'price'}
                        name="price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={editing.price ?? ''}
                        onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })}
                        required
                      />
                    </div>
                    <div className="form-field">
                      <UIFieldLabel htmlFor={'installments'}>{'Taksit sayısı *'}</UIFieldLabel>
                      <UIFieldInput
                        id={'installments'}
                        name="installments"
                        type="number"
                        min={1}
                        max={24}
                        value={editing.installments}
                        onChange={(e) =>
                          setEditing({ ...editing, installments: Number(e.target.value) })
                        }
                        required
                      />
                    </div>
                  </div>
                  <PricingFields
                    contracts={contracts}
                    value={editing}
                    onChange={setEditing}
                    section="required"
                  />
                </fieldset>
                <fieldset
                  className="form-section form-section-optional"
                  data-form-section="optional"
                >
                  <legend>
                    Kampanya ve indirimler <span>İsteğe bağlı</span>
                  </legend>
                  <p className="form-section-description">
                    Kampanya ve indirim tanımlamadan paket oluşturabilirsiniz.
                  </p>
                  <PricingFields
                    contracts={contracts}
                    value={editing}
                    onChange={setEditing}
                    section="optional"
                  />
                </fieldset>
              </div>
              <DialogFooter className="form-actions">
                <Button type="button" variant="outline" onClick={close}>
                  Vazgeç
                </Button>
                <Button type="submit">Paketi kaydet</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
