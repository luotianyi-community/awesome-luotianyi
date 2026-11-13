import test from 'node:test';
import assert from 'node:assert/strict';
import { selectCandidates } from '../scripts/open-issues.mjs';

const rules = { thresholds: { issue: 45 }, caps: { issues_per_run: 20, issues_per_owner: 4 } };

function e(full_name, score, extra) {
  return { full_name, score, signals: ['core'], ...(extra || {}) };
}

test('only entries at or above the issue threshold are eligible', () => {
  const { picked } = selectCandidates([e('a/1', 44), e('a/2', 45), e('a/3', 90)], rules);
  assert.deepEqual(picked.map((x) => x.full_name), ['a/3', 'a/2']);
});

test('a bare vsinger match without the core signal is never proposed', () => {
  const vague = { full_name: 'v/x', score: 100, signals: ['description:strong'] };
  assert.deepEqual(selectCandidates([vague], rules).picked, []);
});

test('an entry that already has an issue is skipped', () => {
  const done = e('a/1', 99, { issue: { number: 7 } });
  assert.deepEqual(selectCandidates([done], rules).picked, []);
});

test('an entry whose title is already open is skipped', () => {
  const open = ['[candidate] A/B'];
  assert.deepEqual(selectCandidates([e('a/b', 99)], rules, { existingTitles: open }).picked, []);
});

test('per-owner cap stops one owner from flooding the tracker', () => {
  const entries = [
    e('spam/1', 99), e('spam/2', 98), e('spam/3', 97), e('spam/4', 96), e('spam/5', 95), e('spam/6', 94),
    e('other/1', 50)
  ];
  const { picked } = selectCandidates(entries, rules);
  const spam = picked.filter((x) => x.full_name.startsWith('spam/'));
  assert.equal(spam.length, 4, 'caps.issues_per_owner is 4');
  assert.ok(picked.some((x) => x.full_name === 'other/1'), 'other owners still get their turn');
});

test('the per-run cap applies overall', () => {
  const entries = [];
  for (let i = 0; i < 30; i += 1) entries.push(e('o' + i + '/r', 90 - i));
  assert.equal(selectCandidates(entries, rules).picked.length, 20, 'caps.issues_per_run is 20');
});

test('higher scores are taken first', () => {
  const { picked } = selectCandidates([e('a/low', 46), e('a/high', 99)], rules);
  assert.deepEqual(picked.map((x) => x.full_name), ['a/high', 'a/low']);
});

test('ties are broken deterministically by name', () => {
  const { picked } = selectCandidates([e('z/b', 60), e('a/b', 60)], rules);
  assert.deepEqual(picked.map((x) => x.full_name), ['a/b', 'z/b']);
});

test('the owner cap counts across the whole selection, not per candidate', () => {
  const entries = [e('x/1', 99), e('x/2', 98), e('x/3', 97), e('x/4', 96), e('x/5', 95)];
  assert.equal(selectCandidates(entries, rules).picked.length, 4);
});
test('existingTitles accepts a Set as well as an array', () => {
  // Regression: selectCandidates used (opts.existingTitles || []).map(...), which throws
  // on a Set. Tests passed an array; the workflow passed a Set. The result was four
  // consecutive radar failures whose preceding steps all reported success.
  const e = { full_name: 'a/b', score: 90, signals: ['core'] };
  assert.equal(selectCandidates([e], rules, { existingTitles: ['[candidate] a/b'] }).picked.length, 0);
  assert.equal(selectCandidates([e], rules, { existingTitles: new Set(['[candidate] a/b']) }).picked.length, 0);
  assert.equal(selectCandidates([e], rules).picked.length, 1);
});
