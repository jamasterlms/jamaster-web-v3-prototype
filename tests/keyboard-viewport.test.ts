import assert from 'node:assert/strict';
import test from 'node:test';
import { isSoftwareKeyboardVisible } from '../src/lib/keyboard-viewport.ts';

test('A touch keyboard reserves space only while an editable field owns focus', () => {
  const viewport = { editable: true, coarse: true, baseline: 844, height: 430, scale: 1 };
  assert.equal(isSoftwareKeyboardVisible(viewport), true);
  assert.equal(isSoftwareKeyboardVisible({ ...viewport, editable: false }), false);
  assert.equal(isSoftwareKeyboardVisible({ ...viewport, coarse: false }), false);
});

test('Pinch zoom and browser chrome do not masquerade as the software keyboard', () => {
  const viewport = { editable: true, coarse: true, baseline: 844, height: 422, scale: 2 };
  assert.equal(isSoftwareKeyboardVisible(viewport), false);
  assert.equal(isSoftwareKeyboardVisible({ ...viewport, height: 240 }), true);
  assert.equal(isSoftwareKeyboardVisible({ ...viewport, scale: 1, height: 780 }), false);
});
