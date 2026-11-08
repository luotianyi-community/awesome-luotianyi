import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  loadRegistry,
  buildIndex,
  lookup,
  isKnown,
  upsertListed,
  upsertRejected,
  upsertExcluded,
  saveRegistry,
  queueHas
} from '../scripts/lib/registry.mjs';

function fixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'reg-'));
  fs.mkdirSync(path.join(dir, 'data/entries'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'data/candidates'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'data/state'), { recursive: true });
  fs.writeFileSync(
    path.join(dir, 'data/taxonomy.json'),
    JSON.stringify({ version: 1, categories: [{ id: 'desktop-pet', zh: '桌宠', en: 'Pets', order: 1, hints: [] }], fallback: 'desktop-pet' })
  );
  return dir;
}

function repo(id, fullName, over) {
  return { id, full_name: fullName, description: '洛天依桌宠', stargazers_count: 3, language: 'TypeScript', pushed_at: '2026-01-01T00:00:00Z', archived: false, fork: false, size: 100, topics: [], ...over };
}

test('listed entry is keyed by numeric id and blocks re-submission', () => {
  const dir = fixture();
  const registry = loadRegistry(dir);
  upsertListed(registry, repo(1001, 'alice/pet'), 'desktop-pet', { source: 'manual' });
  buildIndex(registry);
  assert.equal(isKnown(registry, { id: 1001, full_name: 'renamed/pet' }), true, 'id wins after rename');
  assert.equal(isKnown(registry, { id: 2002, full_name: 'alice/pet' }), true, 'name match still blocked');
  assert.equal(isKnown(registry, { id: 3003, full_name: 'bob/other' }), false);
});

test('rename keeps aliases instead of duplicating the entry', () => {
  const dir = fixture();
  const registry = loadRegistry(dir);
  upsertListed(registry, repo(1001, 'alice/pet'), 'desktop-pet', { source: 'manual' });
  const old = registry.listed.entries[0].full_name;
  upsertListed(registry, repo(1001, 'alice/new-pet', { aliases: [old] }), 'desktop-pet', { source: 'manual' });
  assert.equal(registry.listed.entries.length, 1);
  assert.deepEqual(registry.listed.entries[0].aliases, ['alice/pet']);
  assert.equal(isKnown(registry, { id: 1001, full_name: 'alice/pet' }), true);
});

test('status transitions move an entry between buckets instead of duplicating', () => {
  const dir = fixture();
  const registry = loadRegistry(dir);
  upsertListed(registry, repo(1001, 'alice/pet'), 'desktop-pet', {});
  upsertRejected(registry, repo(1001, 'alice/pet'), 'duplicate project', 'maintainer');
  assert.equal(registry.listed.entries.length, 0);
  assert.equal(registry.rejected.entries.length, 1);
  assert.equal(lookup(registry, { id: 1001 }).status, 'rejected');
  upsertExcluded(registry, repo(1001, 'alice/pet'), 'archived');
  assert.equal(registry.rejected.entries.length, 0);
  assert.equal(registry.excluded.entries.length, 1);
});

test('duplicate ids across buckets are rejected by the index builder', () => {
  const dir = fixture();
  const registry = loadRegistry(dir);
  registry.listed.entries.push({ id: 7007, full_name: 'a/b', category: 'desktop-pet' });
  registry.rejected.entries.push({ id: 7007, full_name: 'c/d', reason: 'dup' });
  assert.throws(() => buildIndex(registry), /duplicate repo id/);
});

test('saveRegistry sorts by stars then name and writes stable json', () => {
  const dir = fixture();
  const registry = loadRegistry(dir);
  upsertListed(registry, repo(1, 'zeta/two', { stargazers_count: 1 }), 'desktop-pet', {});
  upsertListed(registry, repo(2, 'alpha/one', { stargazers_count: 50 }), 'desktop-pet', {});
  upsertListed(registry, repo(3, 'beta/three', { stargazers_count: 1 }), 'desktop-pet', {});
  saveRegistry(registry, {});
  const saved = JSON.parse(fs.readFileSync(path.join(dir, 'data/entries/listed.json'), 'utf8'));
  assert.deepEqual(saved.entries.map((entry) => entry.full_name), ['alpha/one', 'beta/three', 'zeta/two']);
});

test('dry run does not touch the filesystem', () => {
  const dir = fixture();
  const registry = loadRegistry(dir);
  upsertListed(registry, repo(9, 'x/y'), 'desktop-pet', {});
  saveRegistry(registry, { dryRun: true });
  assert.equal(fs.existsSync(path.join(dir, 'data/entries/listed.json')), false);
});

test('queue deduplicates by id and merges evidence', () => {
  const dir = fixture();
  const registry = loadRegistry(dir);
  registry.queue.entries.push({ id: 5, full_name: 'x/y', score: 40, evidence: ['github-search'], sources: ['catalog'] });
  assert.equal(queueHas(registry, { id: 5, full_name: 'x/y' }), true);
});
