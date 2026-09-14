import { DialogFooter } from '@/components/ui/dialog';
import { Metrics } from '@/components/shared/feature-primitives';
import { Icon } from '@/components/shared/icon';
import { PageHeading } from '@/components/shared/primitives';
import { Button } from '@/components/ui/button';
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
import type { Automation } from '@/features/operations/model';
import { useOperations } from '@/features/operations/operations-provider';
import { navigate } from '@/hooks/use-route';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'sonner';
const blank: Automation = {
  id: '',
  name: '',
  trigger: 'Dersten 2 saat önce',
  action: 'SMS taslağı oluştur',
  enabled: true,
};
export function AutomationsPage({ create = false, id }: { create?: boolean; id?: string }) {
  const { operations, save } = useOperations(),
    [editing, setEditing] = useState<Automation | null>(create ? blank : null);
  const close = () => {
    setEditing(null);
    if (create) navigate('admin/automations');
  };
  const selected = operations.automations.find((a) => a.id === id);
  if (id && !selected)
    return (
      <>
        <PageHeading title="Otomasyon bulunamadı" />
        <Button asChild>
          <Link to="/admin/automations">Otomasyonlara dön</Link>
        </Button>
      </>
    );
  return (
    <>
      <PageHeading
        title={selected?.name || 'Otomasyonlar'}
        description="Tekrarlanan işleri kurallara bağlayın, ekibinize zaman kazandırın."
      >
        <Button onClick={() => setEditing({ ...blank })}>
          <Icon name="plus" />
          Otomasyon oluştur
        </Button>
      </PageHeading>
      <Metrics
        items={[
          { label: 'Toplam kural', value: operations.automations.length },
          {
            label: 'Etkin kurallar',
            value: operations.automations.filter((a) => a.enabled).length,
            highlight: true,
          },
          { label: 'Duraklatılan', value: operations.automations.filter((a) => !a.enabled).length },
        ]}
      />
      <div className="automation-list">
        {(selected ? [selected] : operations.automations).map((a) => (
          <div className="automation-card" key={a.id}>
            <div className="automation-card-heading">
              <span className="course-symbol tone-1">
                <Icon name="zap" />
              </span>
              <h2>{a.name}</h2>
              <Switch
                checked={a.enabled}
                aria-label={`${a.name} etkin`}
                onCheckedChange={(enabled) =>
                  save({ type: 'save', collection: 'automations', record: { ...a, enabled } })
                }
              />
            </div>
            <div className="automation-steps">
              <div>
                <span>NE ZAMAN</span>
                <strong>{a.trigger}</strong>
              </div>
              <Icon name="arrow-right" />
              <div>
                <span>NE YAPSIN</span>
                <strong>{a.action}</strong>
              </div>
            </div>
            <div className="automation-card-footer">
              <span className={`status-dot ${a.enabled ? 'enabled' : ''}`} />
              <span>{a.enabled ? 'Etkin' : 'Duraklatıldı'}</span>
              <Button variant="ghost" size="sm" onClick={() => setEditing({ ...a })}>
                Kuralı düzenle
                <Icon name="pencil" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      <Dialog
        open={!!editing}
        onOpenChange={(v) => {
          if (!v) close();
        }}
      >
        <DialogContent className={'jam-modal'}>
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Otomasyonu düzenle' : 'Yeni otomasyon'}</DialogTitle>
            <DialogDescription className="sr-only">
              {editing?.id ? 'Otomasyonu düzenle' : 'Yeni otomasyon'}
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <form
              className="dialog-form"
              onSubmit={(e) => {
                e.preventDefault();
                save({
                  type: 'save',
                  collection: 'automations',
                  record: { ...editing, id: editing.id || crypto.randomUUID() },
                });
                toast.success('Otomasyon kuralı kaydedildi.');
                close();
              }}
            >
              <div className="dialog-form-body">
                <div className="form-field">
                  <UIFieldLabel htmlFor={'automation-name'}>{'Kural adı'}</UIFieldLabel>
                  <UIFieldInput
                    id={'automation-name'}
                    name="automation-name"
                    placeholder="Kural adı"
                    value={editing.name}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-field choice-field">
                  <UIFieldLabel htmlFor="automations-page-select-1">{'Tetikleyici'}</UIFieldLabel>
                  <UISelect
                    name={undefined}
                    value={editing.trigger || undefined}
                    onValueChange={(trigger) => setEditing({ ...editing, trigger })}
                  >
                    <UISelectTrigger
                      id="automations-page-select-1"
                      className="filter-select"
                      aria-label={'Tetikleyici'}
                    >
                      <UISelectValue placeholder={'Seçin'} />
                    </UISelectTrigger>
                    <UISelectContent position="popper">
                      {(
                        [
                          'Dersten 2 saat önce',
                          'Vadeden 3 gün önce',
                          '3 ardışık devamsızlık',
                          'Öğrencinin doğum günü',
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
                <div className="form-field choice-field">
                  <UIFieldLabel htmlFor="automations-page-select-2">{'İşlem'}</UIFieldLabel>
                  <UISelect
                    name={undefined}
                    value={editing.action || undefined}
                    onValueChange={(action) => setEditing({ ...editing, action })}
                  >
                    <UISelectTrigger
                      id="automations-page-select-2"
                      className="filter-select"
                      aria-label={'İşlem'}
                    >
                      <UISelectValue placeholder={'Seçin'} />
                    </UISelectTrigger>
                    <UISelectContent position="popper">
                      {(
                        [
                          'SMS taslağı oluştur',
                          'E-posta taslağı oluştur',
                          'Danışmana görev oluştur',
                          'Görüşme planı oluştur',
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
              </div>
              <DialogFooter className="form-actions">
                <Button type="button" variant="outline" onClick={close}>
                  Vazgeç
                </Button>
                <Button type="submit">Kuralı kaydet</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
