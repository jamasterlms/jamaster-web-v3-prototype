import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement, Suspense } from 'react';
import { renderToString } from 'react-dom/server';
import { createPageResource } from '../src/app/navigation/page-resource.ts';
import { internalPagePath, mayWarmPages } from '../src/app/navigation/preloading-policy.ts';

test('navigation intent and rendering share one pending page request', async () => {
  let finish!: (value: string) => void;
  let requests = 0;
  const resource = createPageResource(() => {
    requests++;
    return new Promise<string>((resolve) => {
      finish = resolve;
    });
  });
  const pending = resource.preload();
  assert.equal(requests, 1, 'The download starts before navigation/render');
  assert.equal(resource.preload(), pending);
  assert.throws(
    () => resource.read(),
    (thrown) => thrown === pending,
  );
  finish('Students');
  await pending;
  assert.equal(resource.read(), 'Students');
  assert.equal(requests, 1);
});

test('a warmed page renders immediately without a Suspense fallback or another import', async () => {
  let requests = 0;
  const resource = createPageResource(async () => {
    requests++;
    return { default: () => createElement('h1', null, 'Öğrenciler') };
  });
  await resource.preload();
  const Page = () => createElement(resource.read().default);
  for (let visit = 0; visit < 3; visit++) {
    const html = renderToString(
      createElement(Suspense, { fallback: 'WAITING' }, createElement(Page)),
    );
    assert.match(html, /Öğrenciler/);
    assert.doesNotMatch(html, /WAITING/);
  }
  assert.equal(requests, 1);
  resource.resetFailure();
  assert.equal(
    resource.read().default instanceof Function,
    true,
    'Retry must not evict ready pages',
  );
});

test('a failed speculative download is retryable and never starts an automatic retry loop', async () => {
  const offline = new Error('offline');
  let requests = 0;
  const resource = createPageResource(async () => {
    if (++requests === 1) throw offline;
    return 'Ready';
  });
  await assert.rejects(resource.preload(), offline);
  assert.throws(
    () => resource.read(),
    (error) => error === offline,
  );
  assert.equal(requests, 1);
  resource.resetFailure();
  await resource.preload();
  assert.equal(resource.read(), 'Ready');
  assert.equal(requests, 2);
});

test('intent only prepares same-origin page links and keeps their filters', () => {
  const origin = 'https://workspace.example';
  assert.equal(
    internalPagePath('/admin/students?query=Elif&status=active', origin),
    '/admin/students?query=Elif&status=active',
  );
  assert.equal(
    internalPagePath('https://workspace.example/admin/calendar', origin),
    '/admin/calendar',
  );
  for (const href of [
    '',
    '#main',
    'https://other.example/admin/students',
    '//other.example/admin/students',
    'javascript:void(0)',
    'mailto:hello@example.com',
    'tel:+905551234567',
  ]) {
    assert.equal(internalPagePath(href, origin), null, href);
  }
});

test('background preparation respects data saver, slow connections and hidden tabs', () => {
  assert.equal(mayWarmPages(), true);
  assert.equal(mayWarmPages({ effectiveType: '4g' }), true);
  assert.equal(mayWarmPages({ saveData: true }), false);
  assert.equal(mayWarmPages({ effectiveType: 'slow-2g' }), false);
  assert.equal(mayWarmPages({ effectiveType: '2g' }), false);
  assert.equal(mayWarmPages(undefined, false), false);
});
