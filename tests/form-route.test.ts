import test from 'node:test';
import assert from 'node:assert/strict';
import * as forms from '../src/features/education/form-route-model.ts';

test('Kaynak form adresi istenen kaydı açar; yanlış veya boş kimlik yeni kayda dönüşmez', () => {
  assert.equal(typeof forms.formRouteRecord, 'function');
  const records = [
    { id: 't1', name: 'Selin' },
    { id: 't2', name: 'Deniz' },
  ];
  assert.deepEqual(
    forms.formRouteRecord(records, new URLSearchParams('teacherId=t2'), 'teacherId'),
    { requested: true, record: records[1] },
  );
  assert.deepEqual(forms.formRouteRecord(records, new URLSearchParams('id=t1'), 'id'), {
    requested: true,
    record: records[0],
  });
  assert.deepEqual(
    forms.formRouteRecord(records, new URLSearchParams('teacherId=missing'), 'teacherId'),
    { requested: true, record: undefined },
  );
  assert.deepEqual(forms.formRouteRecord(records, new URLSearchParams('teacherId='), 'teacherId'), {
    requested: true,
    record: undefined,
  });
  assert.deepEqual(
    forms.formRouteRecord(records, new URLSearchParams('phoneNumber=%2B905321234567'), 'teacherId'),
    { requested: false, record: undefined },
  );
});
