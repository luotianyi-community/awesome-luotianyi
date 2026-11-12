import test from 'node:test';
import assert from 'node:assert/strict';
import { rewindDay } from '../scripts/lib/util.mjs';

test('rewindDay steps back one calendar day', () => {
  assert.equal(rewindDay('2026-11-10'), '2026-11-09');
  assert.equal(rewindDay('2026-11-01'), '2026-10-31');
});

test('rewindDay crosses month, year and leap boundaries', () => {
  assert.equal(rewindDay('2026-03-01'), '2026-02-28');
  assert.equal(rewindDay('2026-01-01'), '2025-12-31');
  assert.equal(rewindDay('2024-03-01'), '2024-02-29', 'leap year');
});

test('rewindDay tolerates a full timestamp and garbage', () => {
  assert.equal(rewindDay('2026-11-10T19:08:48Z'), '2026-11-09');
  assert.equal(rewindDay(''), '');
  assert.equal(rewindDay('not-a-date'), 'not-a-date');
});

test('the window stays inclusive for a repo pushed on the watermark day', () => {
  // Regression: the watermark is written as the scan day, and `pushed:>2026-11-10`
  // excludes 2026-11-10 itself, so a repo pushed at 19:08 that day was never scanned.
  const watermark = '2026-11-10';
  const window = rewindDay(watermark);
  assert.ok('2026-11-10' > window, 'a repo pushed on the watermark day is inside the window');
});