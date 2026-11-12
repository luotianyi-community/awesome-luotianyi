import test from 'node:test';
import assert from 'node:assert/strict';
import { lookup, buildIndex } from '../scripts/lib/registry.mjs';

function registryWith(tombstones) {
  return {
    listed: { entries: [] },
    excluded: { entries: [] },
    rejected: { entries: [] },
    state: { tombstones }
  };
}

test('a tombstone makes a dead repo known so it is not re-proposed', () => {
  const registry = registryWith([{ id: 42, full_name: 'gone/repo', at: '2026-11-10', reason: 'not found' }]);
  registry.index = buildIndex(registry);
  const hit = lookup(registry, { id: 42, full_name: 'gone/repo' });
  assert.equal(hit && hit.status, 'tombstone');
});

test('a bare string tombstone matches nothing, which is the bug that was fixed', () => {
  // refresh-metadata used to push entry.full_name instead of an object. lookup compares
  // String(item.id) against the repo id, so a string never matched and the dead repo
  // stayed invisible to the dedupe check.
  const registry = registryWith(['gone/repo']);
  registry.index = buildIndex(registry);
  assert.equal(lookup(registry, { id: 42, full_name: 'gone/repo' }), null);
});