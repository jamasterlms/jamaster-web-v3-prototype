import { Icon } from '@/components/shared/icon';
import { DialogFooter } from '@/components/ui/dialog';
import { useWorkspace } from '@/app/workspace-provider';
import { SearchField } from '@/components/shared/feature-primitives';
import { PageHeading } from '@/components/shared/primitives';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { usePageState } from '@/hooks/use-page-state';
import { navigate } from '@/hooks/use-route';
import { normalize } from '@/lib/format';
import { useState } from 'react';
import { toast } from 'sonner';
import { downloadText } from './content-pages';
import {
  blankContract,
  contractSchema,
  contractTemplates,
  type ContractTemplate,
} from './contract-model';

export function ContractsPage({ create = false }: { create?: boolean }) {
  const { state, dispatch } = useWorkspace();
  const records = contractTemplates(state.settings);
  const [query, setQuery] = usePageState('query', '');
  const [editing, setEditing] = useState<ContractTemplate | null>(
    create ? { ...blankContract } : null,
  );
  const [preview, setPreview] = useState<ContractTemplate | null>(null);
  const [error, setError] = useState('');
  const close = () => {
    setEditing(null);
    setError('');
    if (create) navigate('admin/contracts');
  };
  const list = records.filter((r) =>
    normalize(r.name + ' ' + r.description).includes(normalize(query)),
  );
  let archive: { id: string; studentId: number; terms: string; end: string }[] = [];
  try {
    const saved = JSON.parse(state.settings['contracts-v3'] || '[]');
    if (Array.isArray(saved))
      archive = saved.filter((r) => r && typeof r.id === 'string' && typeof r.terms === 'string');
  } catch {
    /* Retain the original storage entry. */
  }
  const actions = (record: ContractTemplate) => (
    <div className="table-actions">
      <Button
        onClick={() => setPreview(record)}
        variant="ghost"
        size="icon"
        aria-label="Önizle"
        title="Önizle"
      >
        <Icon name="eye" />
      </Button>
      <Button
        onClick={() => {
          setError('');
          setEditing({ ...record });
        }}
        variant="ghost"
        size="icon"
        aria-label="Düzenle"
        title="Düzenle"
      >
        <Icon name="pencil" />
      </Button>
    </div>
  );
  return (
    <>
      <PageHeading
        title="Sözleşmeler"
        description="Eğitim paketlerinde kullanılacak sözleşme şablonlarını yönetin."
      >
        <Button
          onClick={() => {
            setError('');
            setEditing({ ...blankContract });
          }}
        >
          Sözleşme oluştur
        </Button>
      </PageHeading>
      <div className="module-toolbar">
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Sözleşme adı veya açıklama ara"
        />
      </div>
      <DataTable
        name="contract-templates"
        data={list}
        getRowId={(r) => r.id}
        columns={[
          { accessorKey: 'name', header: 'Sözleşme adı' },
          { accessorKey: 'description', header: 'Açıklama' },
          {
            accessorKey: 'updatedAt',
            header: 'Son düzenleme',
            cell: ({ row }) =>
              row.original.updatedAt
                ? new Date(row.original.updatedAt).toLocaleDateString('tr-TR')
                : '—',
          },
          {
            id: 'actions',
            header: 'İşlem',
            enableSorting: false,
            cell: ({ row }) => actions(row.original),
          },
        ]}
        mobileCard={(r) => (
          <>
            <h3>{r.name}</h3>
            <p>{r.description}</p>
            {actions(r)}
          </>
        )}
      />
      {!!archive.length && (
        <>
          <h2 className="subsection-title">Önceki öğrenci belgeleri</h2>
          <p className="muted mb-3">Daha önce kaydedilen belgeler arşivde korunur.</p>
          <div className="attendance-history">
            {archive.map((r) => (
              <Button
                key={r.id}
                variant="outline"
                onClick={() =>
                  setPreview({
                    ...blankContract,
                    name: r.id,
                    description:
                      state.students.find((s) => s.id === r.studentId)?.name || 'Öğrenci belgesi',
                    content: `Bitiş: ${r.end || 'Belirtilmedi'}\n\n${r.terms}`,
                    showBranchInfo: false,
                    showUserInfo: false,
                  })
                }
              >
                {r.id} · Belgeyi aç
              </Button>
            ))}
          </div>
        </>
      )}
      <Dialog
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) close();
        }}
      >
        <DialogContent preventOutsideClose className="jam-modal dialog-wide">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Sözleşmeyi düzenle' : 'Sözleşme oluştur'}</DialogTitle>
            <DialogDescription>
              Temel bilgileri ve metni üstte, görünüm tercihlerini altta düzenleyin.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <form
              className="dialog-form"
              onSubmit={(e) => {
                e.preventDefault();
                const result = contractSchema.safeParse(editing);
                if (!result.success) {
                  setError(result.error.issues[0].message);
                  return;
                }
                if (
                  records.some(
                    (r) => r.id !== editing.id && normalize(r.name) === normalize(result.data.name),
                  )
                ) {
                  setError('Bu adla bir sözleşme zaten var.');
                  return;
                }
                const record = {
                  ...result.data,
                  id: editing.id || crypto.randomUUID(),
                  updatedAt: new Date().toISOString(),
                };
                dispatch({
                  type: 'settings/save',
                  values: {
                    'contract-templates-v4': JSON.stringify([
                      record,
                      ...records.filter((r) => r.id !== record.id),
                    ]),
                  },
                });
                toast.success('Sözleşme şablonu kaydedildi.');
                close();
              }}
            >
              <div className="dialog-form-body">
                <fieldset className="form-section" data-form-section="required">
                  <legend>
                    Sözleşme bilgileri <span>Zorunlu</span>
                  </legend>
                  <div className="form-field">
                    <Label htmlFor="contract-name">Sözleşme adı *</Label>
                    <Input
                      id="contract-name"
                      value={editing.name}
                      onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                      minLength={3}
                      maxLength={160}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <Label htmlFor="contract-description">Açıklama *</Label>
                    <Input
                      id="contract-description"
                      value={editing.description}
                      onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                      minLength={5}
                      maxLength={500}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <Label htmlFor="contract-content">Sözleşme metni *</Label>
                    <Textarea
                      id="contract-content"
                      rows={12}
                      value={editing.content}
                      onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                      minLength={10}
                      maxLength={50000}
                      required
                    />
                  </div>
                </fieldset>
                <fieldset
                  className="form-section form-section-optional"
                  data-form-section="optional"
                >
                  <legend>
                    Görünüm tercihleri <span>İsteğe bağlı</span>
                  </legend>
                  <div className="flex gap-3 items-center">
                    <Switch
                      id="contract-branch"
                      checked={editing.showBranchInfo}
                      onCheckedChange={(v) => setEditing({ ...editing, showBranchInfo: v })}
                    />
                    <Label htmlFor="contract-branch">Şube bilgilerini göster</Label>
                  </div>
                  <div className="flex gap-3 items-center">
                    <Switch
                      id="contract-student"
                      checked={editing.showUserInfo}
                      onCheckedChange={(v) => setEditing({ ...editing, showUserInfo: v })}
                    />
                    <Label htmlFor="contract-student">Öğrenci bilgilerini göster</Label>
                  </div>
                </fieldset>
                {error && (
                  <p className="field-error" role="alert">
                    {error}
                  </p>
                )}
              </div>
              <DialogFooter className="form-actions">
                <Button type="button" variant="outline" onClick={close}>
                  Vazgeç
                </Button>
                <Button type="button" variant="outline" onClick={() => setPreview({ ...editing })}>
                  Önizle
                </Button>
                <Button type="submit">Şablonu kaydet</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!preview}
        onOpenChange={(open) => {
          if (!open) setPreview(null);
        }}
      >
        <DialogContent className="jam-modal dialog-wide">
          <DialogHeader>
            <DialogTitle>{preview?.name || 'Sözleşme önizlemesi'}</DialogTitle>
            <DialogDescription>{preview?.description || 'Sözleşme görünümü'}</DialogDescription>
          </DialogHeader>
          {preview && (
            <>
              <div className="contract-paper">
                {preview.showBranchInfo && (
                  <p>
                    {state.branch}
                    <br />
                    {state.settings.address}
                    <br />
                    {state.settings.phone} · {state.settings.email}
                  </p>
                )}
                {preview.showUserInfo && (
                  <p className="muted">Öğrenci bilgileri satış kaydına bağlandığında yer alır.</p>
                )}
                <div className="contract-copy">
                  {preview.content || 'Sözleşme metni henüz eklenmedi.'}
                </div>
              </div>
              <div className="form-actions">
                <Button variant="outline" onClick={() => setPreview(null)}>
                  Kapat
                </Button>
                <Button
                  onClick={() =>
                    downloadText(
                      'jamaster-sozlesme.txt',
                      `${preview.name}\n${preview.description}\n\n${preview.content}`,
                    )
                  }
                >
                  Metni indir
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
