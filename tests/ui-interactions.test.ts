import test from 'node:test';
import assert from 'node:assert/strict';
import {
  entityFromPath,
  entityPath,
  identifyTeamRows,
  shouldPreview,
} from '../src/features/entities/entity-model.ts';
import { imageFileError, isLocalProfileImage } from '../src/lib/profile-image.ts';
import { profileImageSchema } from '../src/lib/validation.ts';
import { validIBAN, settingFieldError } from '../src/features/settings/settings-model.ts';

test('Önizleme yalnız açık araç alanında çalışır; çift tıklama daima tam sayfaya gider', () => {
  for (const drawer of [false, true])
    for (const toolsOpen of [false, true])
      for (const mobileOpen of [false, true]) {
        assert.equal(
          shouldPreview({ drawer, toolsOpen, mobileOpen, fullPage: false }),
          drawer ? mobileOpen : toolsOpen,
        );
        assert.equal(shouldPreview({ drawer, toolsOpen, mobileOpen, fullPage: true }), false);
      }
});
test('Detay yönlendirmeleri gerçek rotaları korur, liste/kayıt/bozuk URL önizlemeye dönüşmez', () => {
  for (const kind of ['students', 'groups', 'teachers', 'staff', 'users'] as const) {
    const entity = { kind, id: kind === 'students' ? '1088' : 'id-1' };
    assert.deepEqual(entityFromPath(entityPath(entity)), entity);
  }
  for (const path of [
    '/admin/students/register',
    '/admin/students/past',
    '/admin/groups/form',
    '/admin/staff/salary',
    '/admin/students/1088/payments',
    '/admin/groups/%zz',
  ])
    assert.equal(entityFromPath(path), null, path);
  assert.equal(entityPath({ kind: 'users', id: 'user-1' }), '/super/users/user-1');
});
test('Personel kimlikleri yeni kayıt ekleme ve ad değiştirmeden sonra sabit kalır', () => {
  const legacy = [
    ['A', 'Danışman', 'Şube', '2026-09-01', 'Aktif'],
    ['B', 'Öğretmen', 'Şube', '2026-09-01', 'Aktif'],
  ];
  const materialized = identifyTeamRows(legacy, 'staff');
  const id = materialized[1][5];
  const afterInsert = identifyTeamRows(
    [['C', 'Danışman', 'Şube', '', 'Aktif', 'uuid-new'], ...materialized],
    'staff',
  );
  afterInsert[2][0] = 'Yeni ad';
  assert.equal(afterInsert[2][5], id);
  assert.equal(legacy[0].length, 5);
});
test('Profil yükleme boş, aşırı büyük ve desteklenmeyen dosyaları reddeder; data URL yalnız raster görseldir', () => {
  assert.equal(imageFileError({ type: 'image/png', size: 1024 }), null);
  assert.ok(imageFileError({ type: 'image/svg+xml', size: 100 }));
  assert.ok(imageFileError({ type: 'image/png', size: 0 }));
  assert.ok(imageFileError({ type: 'image/png', size: 6 * 1024 * 1024 }));
  assert.equal(isLocalProfileImage('data:image/png;base64,aGVsbG8='), true);
  assert.equal(profileImageSchema.safeParse('data:image/png;base64,aGVsbG8=').success, true);
  assert.equal(profileImageSchema.safeParse('data:image/svg+xml;base64,aGVsbG8=').success, false);
  assert.equal(profileImageSchema.safeParse('javascript:alert(1)').success, false);
  assert.equal(isLocalProfileImage('data:image/png;base64,' + 'a'.repeat(400000)), false);
});
test('Ayarlar IBAN kontrol basamağı, boş opsiyonel alan ve sıfır gün hatırlatmayı doğru doğrular', () => {
  assert.equal(validIBAN('TR33 0006 1005 1978 6457 8413 26'), true);
  assert.equal(validIBAN('TR34 0006 1005 1978 6457 8413 26'), false);
  assert.equal(settingFieldError({ key: 'iban', label: 'IBAN' }, ''), '');
  assert.ok(settingFieldError({ key: 'iban', label: 'IBAN' }, 'TR000'));
  assert.equal(
    settingFieldError(
      { key: 'reminderDays', label: 'Gün', type: 'number', required: true, min: 0, max: 365 },
      '0',
    ),
    '',
  );
  assert.ok(
    settingFieldError(
      {
        key: 'defaultInstallments',
        label: 'Taksit',
        type: 'number',
        required: true,
        min: 1,
        max: 120,
      },
      '1.5',
    ),
  );
});
