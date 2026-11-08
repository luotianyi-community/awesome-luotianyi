import fs from 'node:fs';
import path from 'node:path';
import { readJson, writeJson, appendJsonl, nowIso } from './util.mjs';

export const STATUSES = ['listed', 'excluded', 'rejected'];

export function registryPaths(root) {
  return {
    root,
    listed: path.join(root, 'data/entries/listed.json'),
    excluded: path.join(root, 'data/entries/excluded.json'),
    rejected: path.join(root, 'data/entries/rejected.json'),
    queue: path.join(root, 'data/candidates/queue.json'),
    state: path.join(root, 'data/state/radar-state.json'),
    changelog: path.join(root, 'data/state/changelog.jsonl'),
    taxonomy: path.join(root, 'data/taxonomy.json'),
    rules: path.join(root, 'data/rules/detection.json')
  };
}

export function emptyState() {
  return { version: 1, lastRun: null, watermark: {}, seen: {}, cursors: {}, tombstones: [], lastIssueRun: null };
}

export function loadRegistry(root) {
  const paths = registryPaths(root);
  const registry = {
    paths,
    listed: readJson(paths.listed, { version: 1, entries: [] }),
    excluded: readJson(paths.excluded, { version: 1, entries: [] }),
    rejected: readJson(paths.rejected, { version: 1, entries: [] }),
    queue: readJson(paths.queue, { version: 1, entries: [] }),
    state: readJson(paths.state, emptyState()),
    taxonomy: readJson(paths.taxonomy, { version: 1, categories: [] }),
    rules: readJson(paths.rules, null)
  };
  if (!registry.state.watermark) registry.state.watermark = {};
  if (!registry.state.seen) registry.state.seen = {};
  if (!registry.state.cursors) registry.state.cursors = {};
  registry.index = buildIndex(registry);
  return registry;
}

export function listFor(registry, status) {
  if (status === 'listed') return registry.listed.entries;
  if (status === 'excluded') return registry.excluded.entries;
  if (status === 'rejected') return registry.rejected.entries;
  throw new Error('unknown status ' + status);
}

export function buildIndex(registry) {
  const ids = new Map();
  const names = new Map();
  for (const status of STATUSES) {
    for (const entry of listFor(registry, status)) {
      const idKey = entry.id === undefined || entry.id === null ? null : String(entry.id);
      if (idKey) {
        if (ids.has(idKey)) throw new Error('duplicate repo id ' + idKey + ' (status ' + status + ', ' + entry.full_name + ')');
        ids.set(idKey, { status, entry });
      }
      if (entry.full_name) names.set(String(entry.full_name).toLowerCase(), { status, entry });
      for (const alias of entry.aliases || []) {
        names.set(String(alias).toLowerCase(), { status, entry });
      }
    }
  }
  const index = { ids, names };
  if (registry) registry.index = index;
  return index;
}

export function lookup(registry, repo) {
  if (!repo) return null;
  const index = registry.index || buildIndex(registry);
  if (repo.id !== undefined && repo.id !== null && index.ids.has(String(repo.id))) return index.ids.get(String(repo.id));
  const lower = String(repo.full_name || '').toLowerCase();
  if (lower && index.names.has(lower)) return index.names.get(lower);
  const tomb = (registry.state.tombstones || []).find((item) => String(item.id) === String(repo.id));
  if (tomb) return { status: 'tombstone', entry: tomb };
  return null;
}

export function isKnown(registry, repo) {
  return lookup(registry, repo) !== null;
}

export function statusOf(registry, repo) {
  const hit = lookup(registry, repo);
  return hit ? hit.status : null;
}

export function queueHas(registry, repo) {
  return registry.queue.entries.some((entry) => String(entry.id) === String(repo.id));
}

export function invalidate(registry) {
  registry.index = buildIndex(registry);
  return registry.index;
}

export function removeEverywhere(registry, repo) {
  const same = (entry) => String(entry.id) === String(repo.id) || String(entry.full_name || '').toLowerCase() === String(repo.full_name || '').toLowerCase();
  for (const status of STATUSES) registry[status].entries = listFor(registry, status).filter((entry) => !same(entry));
  registry.queue.entries = registry.queue.entries.filter((entry) => !same(entry));
  invalidate(registry);
}

export function upsertListed(registry, repo, category, options) {
  const opts = options || {};
  const entry = {
    id: repo.id,
    full_name: repo.full_name,
    aliases: opts.aliases || repo.aliases || [],
    category,
    desc: String(opts.desc || repo.description || '').slice(0, 190),
    stars: Number(repo.stargazers_count || 0),
    language: repo.language || null,
    pushed_at: repo.pushed_at || repo.updated_at || null,
    archived: !!repo.archived,
    fork: !!repo.fork,
    added_at: nowIso().slice(0, 10),
    source: opts.source || 'manual',
    evidence: opts.evidence || []
  };
  removeEverywhere(registry, repo);
  registry.listed.entries.push(entry);
  invalidate(registry);
  return entry;
}

export function upsertRejected(registry, repo, reason, by) {
  const entry = {
    id: repo.id,
    full_name: repo.full_name,
    reason: String(reason || 'no reason given').slice(0, 500),
    by: by || 'automation',
    at: nowIso().slice(0, 10),
    issue: (repo.issue && repo.issue.number) || null
  };
  removeEverywhere(registry, repo);
  registry.rejected.entries.push(entry);
  invalidate(registry);
  return entry;
}

export function upsertExcluded(registry, repo, reason) {
  const entry = {
    id: repo.id === undefined ? null : repo.id,
    full_name: repo.full_name,
    reason: String(reason || 'excluded').slice(0, 500),
    at: nowIso().slice(0, 10)
  };
  removeEverywhere(registry, repo);
  registry.excluded.entries.push(entry);
  invalidate(registry);
  return entry;
}

export function sortEntries(registry) {
  const byName = (a, b) => String(a.full_name || '').localeCompare(String(b.full_name || ''));
  registry.listed.entries = registry.listed.entries.slice().sort((a, b) => (Number(b.stars || 0) - Number(a.stars || 0)) || byName(a, b));
  registry.excluded.entries = registry.excluded.entries.slice().sort(byName);
  registry.rejected.entries = registry.rejected.entries.slice().sort(byName);
  registry.queue.entries = registry.queue.entries.slice().sort((a, b) => (Number(b.score || 0) - Number(a.score || 0)) || byName(a, b));
}

export function saveRegistry(registry, options) {
  const opts = options || {};
  sortEntries(registry);
  if (opts.dryRun) return false;
  writeJson(registry.paths.listed, registry.listed);
  writeJson(registry.paths.excluded, registry.excluded);
  writeJson(registry.paths.rejected, registry.rejected);
  writeJson(registry.paths.queue, registry.queue);
  return true;
}

export function saveState(registry, options) {
  const opts = options || {};
  if (opts.dryRun) return false;
  writeJson(registry.paths.state, registry.state);
  return true;
}

export function logChange(registry, record, options) {
  const opts = options || {};
  if (opts.dryRun) return;
  appendJsonl(registry.paths.changelog, { at: nowIso(), ...record });
}

export function readmePath(root, lang) {
  return path.join(root, lang === 'en' ? 'README_EN.md' : 'README.md');
}

export function exists(file) {
  return fs.existsSync(file);
}
