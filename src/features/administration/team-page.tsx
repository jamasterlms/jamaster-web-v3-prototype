import { PermissionFields } from './permission-fields';
import { normalizePermissions, type BranchPermissions } from './permissions-model';
import { PayrollPage } from '@/features/payroll/payroll-page';
import { AuditHistory } from '@/features/entities/audit-history';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StaffSalaryFields, type StaffSalary } from './staff-salary';
import { BranchDialog } from './branch-dialog';
import { branchToRow } from './branch-model';
import { DialogFooter } from '@/components/ui/dialog';
import { useWorkspace } from '@/app/workspace-provider';
import { SearchField } from '@/components/shared/feature-primitives';
import { Icon } from '@/components/shared/icon';
import { Avatar, PageHeading, StatusBadge } from '@/components/shared/primitives';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MultiSelect } from '@/components/ui/multi-select';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { operationalData } from '@/data/institution';
import { identifyTeamRows } from '@/features/entities/entity-model';
import { useEntityNavigation } from '@/features/entities/use-entity-navigation';
import { usePageState } from '@/hooks/use-page-state';
import { navigate } from '@/hooks/use-route';
import { normalize } from '@/lib/format';
import { emailSchema, localDate, optionalPhoneSchema, normalizePhone } from '@/lib/validation';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
type Draft = {
  id: string;
  name: string;
  role: string;
  contact: string;
  status: string;
  phone: string;
  email: string;
  salary?: StaffSalary;
  permission?: BranchPermissions;
};
function readPermission(row: string[]): BranchPermissions | undefined {
  try {
    const value = JSON.parse(row[8] || '{}').branchPermissions?.[0];
    return value && typeof value.branchId === 'string'
      ? {
          ...value,
          isManager: !!value.isManager,
          permissions: normalizePermissions(value.permissions || []),
        }
      : undefined;
  } catch {
    return undefined;
  }
}
function readSalary(row: string[]): StaffSalary | undefined {
  try {
    const salary = JSON.parse(row[8] || '{}').staffSalary;
    return salary
      ? {
          ...salary,
          commissionRate:
            salary.commissionRate === undefined ? undefined : salary.commissionRate * 100,
        }
      : undefined;
  } catch {
    return undefined;
  }
}

export function TeamPage({ route }: { route: string }) {
  const { state, dispatch } = useWorkspace(),
    openEntity = useEntityNavigation(),
    [params, setParams] = useSearchParams();
  const key = route.split('/')[1],
    branch = key === 'branches',
    users = key === 'users',
    create = route.endsWith('/form'),
    base = `/${route.split('/').slice(0, 2).join('/')}`;
  const data = operationalData[key],
    rows = identifyTeamRows(state.moduleRows[key] || data.rows, key);
  const detailId =
    !create && !branch && route.split('/').length === 3 && !route.endsWith('/salary')
      ? decodeURIComponent(route.split('/').at(-1)!)
      : undefined;
  const formId = create ? params.get(branch || users ? 'id' : 'staffId') : null;
  const selected = rows.find((r) => r[5] === (detailId || formId));
  const blank = (): Draft => ({
    id: '',
    name: '',
    role: branch ? '' : 'Eğitim danışmanı',
    contact: !branch && !users ? state.branch : '',
    status: 'Aktif',
    phone: '',
    email: '',
    permission:
      key === 'staff'
        ? {
            branchId:
              identifyTeamRows(
                state.moduleRows.branches || operationalData.branches.rows,
                'branches',
              ).find((r) => r[0] === state.branch)?.[5] || '',
            permissions: [],
            isManager: false,
          }
        : undefined,
  });
  const draftFor = (r: string[]): Draft => ({
    id: r[5],
    name: r[0],
    role: r[users ? 2 : 1],
    contact: r[branch ? 3 : users ? 1 : 2],
    status: r[4],
    phone: r[6] || '',
    email: r[7] || '',
    salary: key === 'staff' ? readSalary(r) : undefined,
    permission:
      readPermission(r) ||
      (key === 'staff'
        ? {
            branchId:
              identifyTeamRows(
                state.moduleRows.branches || operationalData.branches.rows,
                'branches',
              ).find((b) => b[0] === r[2])?.[5] || '',
            permissions: [],
            isManager: false,
          }
        : undefined),
  });
  const [editing, setEditing] = useState<Draft | null>(
    create
      ? formId
        ? selected
          ? draftFor(selected)
          : null
        : blank()
      : selected && params.get('edit') === '1'
        ? draftFor(selected)
        : null,
  );
  const [query, setQuery] = usePageState('query', ''),
    [statuses, setStatuses] = usePageState<string[]>('statuses', []),
    [roles, setRoles] = usePageState<string[]>('roles', []);
  const editRequest = params.get('edit') === '1';
  useEffect(() => {
    if ((editRequest || formId) && selected) setEditing(draftFor(selected));
    else if (create && formId) setEditing(null);
    else if (!create) setEditing(null);
  }, [editRequest, detailId, formId]);
  const close = () => {
    setEditing(null);
    if (params.has('edit'))
      setParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          next.delete('edit');
          return next;
        },
        { replace: true },
      );
    if (create) navigate(base);
  };
  const edit = (r: string[]) => setEditing(draftFor(r));
  const open = (r: string[], full = false, ordered?: string[][]) =>
    openEntity(
      { kind: users ? 'users' : 'staff', id: r[5] },
      full,
      ordered?.map((item) => ({ kind: users ? 'users' : 'staff', id: item[5] })),
    );
  const field = (
    key: Exclude<keyof Draft, 'salary' | 'permission'>,
    label: string,
    type = 'text',
    required = false,
  ) => (
    <div className="form-field">
      <Label htmlFor={`team-${key}`}>
        {label}
        {required ? ' *' : ''}
      </Label>
      <Input
        id={`team-${key}`}
        type={type}
        required={required}
        value={editing?.[key] || ''}
        placeholder={`${label} girin`}
        onValueChange={(value) => setEditing((v) => (v ? { ...v, [key]: value } : v))}
      />
    </div>
  );
  const detailTab = params.get('tab') || 'general';
  return (
    <>
      {create && formId && !selected && (
        <p role="alert" className="pending-banner">
          Düzenlenecek kayıt bulunamadı. Listeye dönüp kaydı yeniden seçin.
        </p>
      )}
      {detailId ? (
        <section className="entity-detail-page">
          <Button variant="ghost" asChild>
            <Link to={base}>← Listeye dön</Link>
          </Button>
          <PageHeading
            title={selected?.[0] || 'Kayıt bulunamadı'}
            description="Personel bilgileri ve çalışma alanı."
          />
          {selected && (
            <>
              {!users && (
                <Tabs
                  value={detailTab}
                  onValueChange={(tab) =>
                    setParams(
                      (p) => {
                        const n = new URLSearchParams(p);
                        n.set('tab', tab);
                        return n;
                      },
                      { replace: true },
                    )
                  }
                >
                  <TabsList className="detail-view-tabs">
                    <TabsTrigger value="general">Genel bilgiler</TabsTrigger>
                    <TabsTrigger value="payments">Maaş hareketleri</TabsTrigger>
                    <TabsTrigger value="history">İşlem geçmişi</TabsTrigger>
                  </TabsList>
                </Tabs>
              )}
              {detailTab === 'payments' && !users ? (
                <PayrollPage kind="staff" id={selected[5]} embedded />
              ) : detailTab === 'history' && !users ? (
                <AuditHistory targetType="staff" targetId={selected[5]} />
              ) : (
                <>
                  <div className="detail-header">
                    <Avatar name={selected[0]} />
                    <StatusBadge>{selected[4]}</StatusBadge>
                  </div>
                  <div className="detail-grid">
                    {[
                      ['Görev', selected[users ? 2 : 1]],
                      ['Şube / iletişim', selected[users ? 1 : 2]],
                      ['Kayıt / son giriş', selected[3]],
                      ['Telefon', selected[6]],
                      ['E-posta', selected[7]],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <small>{label}</small>
                        <b>{value || 'Belirtilmedi'}</b>
                      </div>
                    ))}
                  </div>
                  <div className="form-actions">
                    {selected[6] && (
                      <Button variant="outline" asChild>
                        <a href={`tel:${selected[6]}`}>Ara</a>
                      </Button>
                    )}
                    <Button onClick={() => edit(selected)}>
                      <Icon name="pencil" />
                      Bilgileri düzenle
                    </Button>
                  </div>
                </>
              )}
            </>
          )}
        </section>
      ) : (
        <>
          <PageHeading
            title={data.title}
            description={
              branch
                ? 'Şubelerinizi ve sorumlu ekiplerinizi yönetin.'
                : 'Ekibinizin görevleri, iletişim bilgileri ve çalışma alanları.'
            }
          >
            <Button onClick={() => setEditing(blank())}>
              <Icon name="plus" />
              {data.create}
            </Button>
          </PageHeading>
          <div className="module-toolbar">
            <SearchField
              value={query}
              onChange={setQuery}
              placeholder={branch ? 'Şube veya şehir ara' : 'Ad, görev veya iletişim bilgisi ara'}
            />
          </div>
          <div className="module-toolbar secondary-filters">
            <MultiSelect
              label="Durum"
              value={statuses}
              onChange={setStatuses}
              options={[
                ...new Set([
                  ...(branch
                    ? ['Aktif', 'Pasif', 'Askıya alındı', 'Kapalı']
                    : ['Aktif', 'Pasif', 'Engellendi']),
                  ...rows.map((row) => row[4]),
                ]),
              ].map((value) => ({ value, label: value }))}
            />
            <MultiSelect
              label={branch ? 'Adres' : 'Görev'}
              value={roles}
              onChange={setRoles}
              options={[...new Set(rows.map((r) => r[users ? 2 : 1]))].map((value) => ({
                value,
                label: value,
              }))}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setQuery('');
                setStatuses([]);
                setRoles([]);
              }}
            >
              Sıfırla
            </Button>
          </div>
          <DataTable
            data={rows.filter(
              (r) =>
                normalize([...r.slice(0, 5), ...r.slice(6, 8)].join(' ')).includes(
                  normalize(query),
                ) &&
                (!statuses.length || statuses.includes(r[4])) &&
                (!roles.length || roles.includes(r[users ? 2 : 1])),
            )}
            getRowId={(r) => r[5]}
            entityKind={branch ? undefined : users ? 'users' : 'staff'}
            onOpen={branch ? undefined : open}
            columns={[
              {
                id: 'name',
                header: branch ? 'Şube' : 'Ad soyad',
                accessorFn: (r) => r[0],
                cell: ({ row }) =>
                  branch ? (
                    row.original[0]
                  ) : (
                    <Link to={`${base}/${row.original[5]}`}>{row.original[0]}</Link>
                  ),
              },
              {
                id: 'role',
                header: branch ? 'Adres' : 'Görev',
                accessorFn: (r) => r[users ? 2 : 1],
              },
              {
                id: 'contact',
                header: branch ? 'Yetkili' : users ? 'E-posta' : 'Şube',
                accessorFn: (r) => r[branch ? 3 : users ? 1 : 2],
              },
              {
                id: 'status',
                header: 'Durum',
                accessorFn: (r) => r[4],
                cell: ({ row }) => <StatusBadge>{row.original[4]}</StatusBadge>,
              },
              {
                id: 'actions',
                header: 'İşlemler',
                cell: ({ row }) => (
                  <div className="flex gap-1">
                    <Button
                      onClick={() => edit(row.original)}
                      variant="ghost"
                      size="icon"
                      aria-label="Düzenle"
                      title="Düzenle"
                    >
                      <Icon name="pencil" />
                    </Button>
                    {branch && (
                      <Button
                        onClick={() => {
                          dispatch({ type: 'branch/set', branch: row.original[0] });
                          navigate('admin/dashboard');
                        }}
                        variant="ghost"
                        size="icon"
                        aria-label="Şubeye geç"
                        title="Şubeye geç"
                      >
                        <Icon name="arrow-right" />
                      </Button>
                    )}
                  </div>
                ),
              },
            ]}
            mobileCard={(r) => (
              <>
                <div className="card-person">
                  <Avatar name={r[0]} />
                  <strong>{r[0]}</strong>
                </div>
                <p>{r[users ? 2 : 1]}</p>
                <StatusBadge>{r[4]}</StatusBadge>
                <div className="form-actions">
                  <Button variant="outline" onClick={() => edit(r)}>
                    Düzenle
                  </Button>
                  {!branch && (
                    <Button variant="ghost" onClick={(e) => open(r, e.detail > 1)}>
                      Profili aç
                    </Button>
                  )}
                </div>
              </>
            )}
          />
        </>
      )}
      {branch && editing && (
        <BranchDialog
          key={editing.id || 'new'}
          row={rows.find((row) => row[5] === editing.id)}
          onClose={close}
          onSave={(draft) => {
            const previous = rows.find((row) => row[5] === draft.id);
            const record = branchToRow(draft, previous);
            dispatch({
              type: 'module/rows',
              key: 'branches',
              rows: previous
                ? rows.map((row) => (row[5] === draft.id ? record : row))
                : [record, ...rows],
            });
            if (previous?.[0] === state.branch)
              dispatch({ type: 'branch/set', branch: draft.name });
            toast.success('Şube kaydedildi.');
            close();
          }}
        />
      )}
      <Dialog
        open={!branch && !!editing}
        onOpenChange={(v) => {
          if (!v) close();
        }}
      >
        <DialogContent preventOutsideClose className="jam-modal dialog-wide">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Bilgileri düzenle' : data.create}</DialogTitle>
            <DialogDescription>
              Önce zorunlu bilgileri tamamlayın; ek iletişim bilgilerini daha sonra
              ekleyebilirsiniz.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <form
              className="dialog-form"
              onSubmit={(e) => {
                e.preventDefault();
                const draft = {
                  ...editing,
                  name: editing.name.trim(),
                  contact: editing.contact.trim(),
                  phone: normalizePhone(editing.phone),
                  email: editing.email.trim().toLowerCase(),
                };
                if (
                  draft.salary &&
                  ((draft.salary.baseAmount !== undefined &&
                    (!Number.isFinite(draft.salary.baseAmount) || draft.salary.baseAmount < 0)) ||
                    (draft.salary.commissionRate !== undefined &&
                      (!Number.isFinite(draft.salary.commissionRate) ||
                        draft.salary.commissionRate < 0 ||
                        draft.salary.commissionRate > 100)) ||
                    (draft.salary.paymentDay !== undefined &&
                      (!Number.isInteger(draft.salary.paymentDay) ||
                        draft.salary.paymentDay < 1 ||
                        draft.salary.paymentDay > 31)))
                ) {
                  toast.error('Maaş, prim oranı ve ödeme gününü kontrol edin.');
                  return;
                }
                if (!draft.name || !draft.contact || !draft.phone || (!users && !draft.email)) {
                  toast.error('Zorunlu alanları tamamlayın.');
                  return;
                }
                if (
                  (users && !emailSchema.safeParse(draft.contact).success) ||
                  (draft.email && !emailSchema.safeParse(draft.email).success) ||
                  !optionalPhoneSchema.safeParse(draft.phone).success
                ) {
                  toast.error('Telefon ve e-posta bilgilerini kontrol edin.');
                  return;
                }
                if (
                  rows.some(
                    (r) =>
                      r[5] !== draft.id &&
                      normalize(users ? r[1] : r[7] || '') ===
                        normalize(users ? draft.contact : draft.email),
                  )
                ) {
                  toast.error('Bu bilgilerle bir kayıt zaten var.');
                  return;
                }
                if (
                  key === 'staff' &&
                  (!draft.permission?.branchId ||
                    !identifyTeamRows(
                      state.moduleRows.branches || operationalData.branches.rows,
                      'branches',
                    ).some((r) => r[5] === draft.permission?.branchId && r[0] === draft.contact))
                ) {
                  toast.error('Personelin şube ve yetki seçimini kontrol edin.');
                  return;
                }
                const old = rows.find((r) => r[5] === draft.id);
                const record = branch
                  ? [draft.name, draft.role, old?.[2] || '0', draft.contact, draft.status]
                  : users
                    ? [
                        draft.name,
                        draft.contact.toLowerCase(),
                        draft.role,
                        old?.[3] || 'Henüz giriş yapmadı',
                        draft.status,
                      ]
                    : [
                        draft.name,
                        draft.role,
                        draft.contact,
                        old?.[3] || localDate(),
                        draft.status,
                      ];
                record.push(draft.id || crypto.randomUUID(), draft.phone, draft.email);
                if (old?.[8]) record[8] = old[8];
                if (key === 'staff') {
                  let metadata = {};
                  try {
                    metadata = JSON.parse(old?.[8] || '{}');
                  } catch {}
                  record[8] = JSON.stringify({
                    ...metadata,
                    accessibleBranches: draft.permission ? [draft.permission.branchId] : undefined,
                    branchPermissions: draft.permission
                      ? [
                          {
                            ...draft.permission,
                            permissions: normalizePermissions(draft.permission.permissions),
                          },
                        ]
                      : undefined,
                    staffSalary: draft.salary
                      ? {
                          ...draft.salary,
                          commissionRate:
                            draft.salary.commissionRate === undefined
                              ? undefined
                              : draft.salary.commissionRate / 100,
                        }
                      : undefined,
                  });
                }
                dispatch({
                  type: 'module/rows',
                  key,
                  rows: old ? rows.map((r) => (r[5] === draft.id ? record : r)) : [record, ...rows],
                });
                toast.success('Bilgiler kaydedildi.');
                close();
                if (users) navigate(`${base}/${record[5]}`);
              }}
            >
              <div className="dialog-form-body">
                <fieldset className="form-section" data-form-section="required">
                  <legend>
                    Temel bilgiler <span>Zorunlu</span>
                  </legend>
                  <div className="form-grid">
                    {field('name', branch ? 'Şube adı' : 'Ad soyad', 'text', true)}
                    {field('phone', 'Telefon', 'tel', true)}
                    {!users && field('email', 'E-posta', 'email', true)}
                    {users ? (
                      field('contact', 'E-posta', 'email', true)
                    ) : (
                      <div className="form-field">
                        <Label htmlFor="team-contact">Şube *</Label>
                        <Select
                          value={editing.contact}
                          onValueChange={(contact) =>
                            setEditing({
                              ...editing,
                              contact,
                              permission: editing.permission
                                ? {
                                    ...editing.permission,
                                    branchId:
                                      identifyTeamRows(
                                        state.moduleRows.branches || operationalData.branches.rows,
                                        'branches',
                                      ).find((r) => r[0] === contact)?.[5] || '',
                                  }
                                : undefined,
                            })
                          }
                        >
                          <SelectTrigger id="team-contact">
                            <SelectValue placeholder="Şube seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            {[
                              ...new Set([
                                state.branch,
                                editing.contact,
                                ...(state.moduleRows.branches || operationalData.branches.rows).map(
                                  (row) => row[0],
                                ),
                              ]),
                            ]
                              .filter(Boolean)
                              .map((name) => (
                                <SelectItem value={name} key={name}>
                                  {name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="form-field">
                      <Label htmlFor="team-status">Durum</Label>
                      <Select
                        value={editing.status}
                        onValueChange={(status) => setEditing({ ...editing, status })}
                      >
                        <SelectTrigger id="team-status">
                          <SelectValue placeholder="Durum seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {[...new Set(['Aktif', 'Pasif', 'Engellendi', editing.status])].map(
                            (v) => (
                              <SelectItem key={v} value={v}>
                                {v}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </fieldset>
                <fieldset
                  className="form-section form-section-optional"
                  data-form-section="optional"
                >
                  <legend>
                    Ek bilgiler <span>İsteğe bağlı</span>
                  </legend>
                  <div className="form-grid">{field('role', 'Görev / unvan')}</div>
                </fieldset>
                {key === 'staff' && (
                  <PermissionFields
                    branchName={editing.contact}
                    value={
                      editing.permission || {
                        branchId:
                          identifyTeamRows(
                            state.moduleRows.branches || operationalData.branches.rows,
                            'branches',
                          ).find((r) => r[0] === editing.contact)?.[5] || '',
                        permissions: [],
                        isManager: false,
                      }
                    }
                    onChange={(permission) => setEditing({ ...editing, permission })}
                  />
                )}
                {key === 'staff' && (
                  <StaffSalaryFields
                    value={editing.salary}
                    onChange={(salary) => setEditing({ ...editing, salary })}
                  />
                )}
              </div>
              <DialogFooter className="form-actions">
                <Button type="button" variant="outline" onClick={close}>
                  Vazgeç
                </Button>
                <Button type="submit">Kaydet</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
