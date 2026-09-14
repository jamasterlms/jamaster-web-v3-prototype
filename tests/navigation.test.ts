import test from 'node:test';
import assert from 'node:assert/strict';
import { initialTabs, tabsReducer } from '../src/app/navigation/tab-model.ts';
import {
  pageStateKey,
  readPageValue,
  writePageValue,
} from '../src/app/navigation/page-state-store.ts';
test('General pages open initially; revisits reuse the working tab and keep its URL', () => {
  assert.deepEqual(
    initialTabs.tabs.map((t) => t.path),
    ['/admin/dashboard', '/admin/calendar', '/admin/reports/monthly-meetings'],
  );
  const opened = tabsReducer(initialTabs, {
    type: 'visit',
    path: '/admin/students',
    search: '?studentType=CORPORATE',
  });
  const away = tabsReducer(opened, { type: 'visit', path: '/admin/calendar' });
  assert.equal(
    away.tabs.find((t) => t.path === '/admin/students')?.search,
    '?studentType=CORPORATE',
  );
  const revisited = tabsReducer(away, {
    type: 'visit',
    path: '/admin/students',
    search: '?studentType=CORPORATE',
  });
  assert.equal(revisited.tabs.length, 4);
  assert.equal(revisited.active, '/admin/students');
});
test('Closing the active tab chooses the previous tab; closing the last restores General', () => {
  const opened = tabsReducer(initialTabs, { type: 'visit', path: '/admin/students' });
  const closed = tabsReducer(opened, { type: 'close', path: '/admin/students' });
  assert.equal(closed.active, '/admin/reports/monthly-meetings');
  assert.equal(
    tabsReducer(
      { tabs: [{ path: '/admin/students', search: '' }], active: '/admin/students' },
      { type: 'close', path: '/admin/students' },
    ),
    initialTabs,
  );
});
test('Filters, sort and pagination survive page disposal and are isolated by route and branch', () => {
  const data = new Map<string, string>(),
    storage = {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => {
        data.set(key, value);
      },
    };
  const key = pageStateKey('New York', '/admin/students', 'filters');
  const expected = { query: 'Elif', types: ['Bireysel'], sort: 'name:desc', page: 2 };
  writePageValue(storage, key, expected);
  assert.deepEqual(readPageValue(storage, key, {}), expected);
  assert.deepEqual(
    readPageValue(storage, pageStateKey('Kadıköy', '/admin/students', 'filters'), {}),
    {},
  );
  assert.deepEqual(
    readPageValue(storage, pageStateKey('New York', '/admin/students/past', 'filters'), {}),
    {},
  );
  storage.setItem(key, 'broken');
  assert.deepEqual(readPageValue(storage, key, {}), {});
  assert.equal(writePageValue(undefined, key, expected), false);
});
test('Standalone payment tokens and sign-in pages are never stored in working tabs', () => {
  for (const path of ['/payment', '/payment/private-token', '/login', '/student/dashboard']) {
    assert.equal(
      tabsReducer(initialTabs, { type: 'visit', path, search: '?tab=history' }),
      initialTabs,
    );
  }
});
