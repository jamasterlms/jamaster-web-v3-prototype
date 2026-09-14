import { useState } from 'react';
import { SearchField } from '@/components/shared/feature-primitives';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Table,
  TableHead,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { normalize } from '@/lib/format';
import {
  permissionResources,
  permissionActions,
  permissionPresets,
  normalizePermissions,
  changePermission,
  setManager,
  type BranchPermissions,
} from './permissions-model';
export function PermissionFields({
  value,
  onChange,
  branchName,
}: {
  value: BranchPermissions;
  onChange: (value: BranchPermissions) => void;
  branchName: string;
}) {
  const [search, setSearch] = useState('');
  const preset =
    Object.entries(permissionPresets).find(
      ([, p]) =>
        JSON.stringify(normalizePermissions(p.values)) ===
        JSON.stringify(normalizePermissions(value.permissions)),
    )?.[0] || 'custom';
  return (
    <fieldset className="form-section">
      <legend>Şube yetkileri</legend>
      <p className="field-hint">{branchName} şubesi için yetki tanımı.</p>
      <div className="switch-row">
        <Label htmlFor="staff-manager">Şube yöneticisi</Label>
        <Switch
          id="staff-manager"
          checked={value.isManager}
          onCheckedChange={(checked) => onChange(setManager(value, checked))}
        />
      </div>
      {!value.isManager && (
        <>
          <div className="form-grid mt-5">
            <div className="form-field">
              <Label htmlFor="permission-preset">Yetki şablonu</Label>
              <Select
                value={preset}
                onValueChange={(key) =>
                  onChange({
                    ...value,
                    permissions:
                      key === 'custom'
                        ? []
                        : permissionPresets[key as keyof typeof permissionPresets].values,
                  })
                }
              >
                <SelectTrigger id="permission-preset">
                  <SelectValue placeholder="Yetki şablonu seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Özel yetkiler</SelectItem>
                  {Object.entries(permissionPresets).map(([key, p]) => (
                    <SelectItem key={key} value={key}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <SearchField value={search} onChange={setSearch} placeholder="Yetki başlığı ara" />
          </div>
          <div className="permission-table">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kaynak</TableHead>
                  {Object.values(permissionActions).map((a) => (
                    <TableHead key={a}>{a}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(permissionResources)
                  .filter(([, label]) => normalize(label).includes(normalize(search)))
                  .map(([resource, label]) => (
                    <TableRow key={resource}>
                      <TableCell>
                        <label className="flex items-center gap-2">
                          <Checkbox
                            aria-label={`${label}: tüm yetkiler`}
                            checked={Object.keys(permissionActions).every((a) =>
                              value.permissions.includes(`${resource}.${a}`),
                            )}
                            onCheckedChange={(checked) =>
                              onChange({
                                ...value,
                                permissions: normalizePermissions([
                                  ...value.permissions.filter((p) => !p.startsWith(`${resource}.`)),
                                  ...(checked
                                    ? Object.keys(permissionActions).map((a) => `${resource}.${a}`)
                                    : []),
                                ]),
                              })
                            }
                          />
                          {label}
                        </label>
                      </TableCell>
                      {Object.entries(permissionActions).map(([action, title]) => (
                        <TableCell key={action}>
                          <Checkbox
                            aria-label={`${label}: ${title}`}
                            checked={value.permissions.includes(`${resource}.${action}`)}
                            onCheckedChange={(checked) =>
                              onChange({
                                ...value,
                                permissions: changePermission(
                                  value.permissions,
                                  resource,
                                  action,
                                  !!checked,
                                ),
                              })
                            }
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
      <p className="field-hint">
        Yetki tanımı kaydedilir. Hesap erişiminin etkinleştirilmesi kullanıcı servisi bağlantısı
        gerektirir.
      </p>
    </fieldset>
  );
}
