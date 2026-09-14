import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import {
  accessRole,
  resolveAccessState,
  safeReturnTo,
} from '../src/features/access/access-state-model.ts';
import {
  helpRole,
  helpLink,
  tutorialFor,
  tutorials,
  tutorialsFor,
  tutorialAsset,
} from '../src/features/help/help-model.ts';
test('return paths preserve role and reject external or escaped destinations', () => {
  for (const value of [
    'https://evil.test',
    '//evil.test',
    '/student/../admin/dashboard',
    '/student/%2e%2e/admin',
    '/student/\\evil',
    '/admin/dashboard',
    '/teacher/courses',
  ])
    assert.equal(safeReturnTo(value, 'student'), '/student/dashboard', value);
  assert.equal(
    safeReturnTo('/student/courses?status=active', 'student'),
    '/student/courses?status=active',
  );
  assert.equal(safeReturnTo('/teacher/activities', 'teacher'), '/teacher/activities');
  assert.equal(safeReturnTo('/admin/dashboard', 'user'), '/admin/dashboard');
});
test('unknown access states and role values fail to safe defaults', () => {
  assert.equal(resolveAccessState('__proto__'), 'not-found');
  assert.equal(resolveAccessState('forbidden'), 'forbidden');
  assert.equal(accessRole('admin'), 'student');
});
test('context selects role and specific child tutorial before parent guide', () => {
  assert.equal(helpRole('/teacher/courses', 'staff'), 'teacher');
  assert.equal(helpRole('/admin/dashboard', 'student'), 'staff');
  assert.equal(helpRole('/login'), 'student');
  assert.equal(tutorialFor('/admin/students/1/documents', 'staff').id, 'documents');
  assert.equal(tutorialFor('/admin/students/register', 'staff').id, 'registration');
  assert.equal(tutorialFor('/polling', 'staff').id, 'polling');
  assert.equal(tutorialFor('/payment', 'staff').id, 'payment');
  assert.ok(!tutorialsFor('student').some((t) => t.id === 'finance'));
});
test('every tutorial has playable asset, poster and complete captions', () => {
  assert.equal(new Set(tutorials.map((t) => t.id)).size, tutorials.length);
  for (const t of tutorials) {
    assert.equal(t.steps.length, 3);
    for (const ext of ['mp4', 'vtt', 'webp'] as const)
      assert.ok(existsSync('public' + tutorialAsset(t.id, ext)), `${t.id}.${ext}`);
    assert.match(readFileSync('public' + tutorialAsset(t.id, 'vtt'), 'utf8'), /00:00:24.000/);
  }
});

test('help resolves canonical and query-specific pages without leaking private query values', () => {
  const cases = [
    ['/admin/education', 'education'],
    ['/admin/education/period', 'education'],
    ['/admin/program-terms', 'education'],
    ['/admin/groups/g1/schedule', 'calendar'],
    ['/admin/groups/g1/polling', 'attendance'],
    ['/admin/students/1/history?other=x&tab=polling', 'attendance'],
    ['/admin/teachers/t1/history?tab=schedule', 'calendar'],
    ['/admin/verification-requests', 'finance'],
    ['/super/expenses', 'finance'],
    ['/super/files', 'files'],
  ];
  for (const [path, id] of cases)
    assert.equal(tutorialFor(path, path.startsWith('/super') ? 'super' : 'staff').id, id, path);
  assert.equal(tutorialFor('/payment?tab=history', 'student').id, 'payment');
  const target = new URL(
    helpLink('staff', '/admin/students/1/history?tab=polling&token=private&phone=555'),
    'https://help.local',
  );
  assert.equal(target.searchParams.get('from'), '/admin/students/1/history?tab=polling');
});
