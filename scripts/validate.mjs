import fs from 'node:fs';
import path from 'node:path';
import { loadRegistry, listFor, readmePath, STATUSES } from './lib/registry.mjs';
import { loadRules } from './lib/match.mjs';
import { renderReadme } from './lib/render.mjs';
import { parseArgs } from './lib/util.mjs';

function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = path.resolve(args.root || process.cwd());
  const errors = [];
  const warnings = [];
  const registry = loadRegistry(root);
  const rules = loadRules(registry.paths.rules);
  const categories = new Set((registry.taxonomy.categories || []).map((item) => item.id));

  if (!categories.size) errors.push('taxonomy has no categories');
  if (!rulersOk(rules)) errors.push('detection rules failed to load');

  const listedIds = new Map();
  const listedNames = new Map();
  for (const entry of registry.listed.entries) {
    if (entry.id === undefined || entry.id === null) errors.push('listed entry without id: ' + entry.full_name);
    if (!entry.full_name || !/^[^/]+\/[^/]+$/.test(entry.full_name)) errors.push('listed entry bad full_name: ' + JSON.stringify(entry.full_name));
    if (!categories.has(entry.category)) errors.push('unknown category "' + entry.category + '" for ' + entry.full_name);
    if (listedIds.has(String(entry.id))) errors.push('duplicate listed id ' + entry.id + ' (' + entry.full_name + ' / ' + listedIds.get(String(entry.id)) + ')');
    listedIds.set(String(entry.id), entry.full_name);
    const lower = entry.full_name.toLowerCase();
    if (listedNames.has(lower)) errors.push('duplicate listed full_name ' + entry.full_name);
    listedNames.set(lower, entry);
    for (const alias of entry.aliases || []) {
      const key = String(alias).toLowerCase();
      if (listedNames.has(key) && listedNames.get(key) !== entry) errors.push('alias collides with listed entry: ' + alias);
    }
    if (!entry.desc || entry.desc.length < 3) warnings.push('thin description: ' + entry.full_name);
    if (!entry.added_at) warnings.push('missing added_at: ' + entry.full_name);
    if (!entry.source) warnings.push('missing source: ' + entry.full_name);
    if (!Array.isArray(entry.evidence) || entry.evidence.length === 0) warnings.push('missing evidence: ' + entry.full_name);
    if (entry.archived) warnings.push('listed entry is archived: ' + entry.full_name);
  }

  for (const status of ['excluded', 'rejected']) {
    const seen = new Set();
    for (const entry of listFor(registry, status)) {
      if (entry.id !== undefined && entry.id !== null) {
        const key = String(entry.id);
        if (seen.has(key)) errors.push('duplicate ' + status + ' id ' + key + ' (' + entry.full_name + ')');
        seen.add(key);
        if (listedIds.has(key)) errors.push(status + ' entry also listed: ' + entry.full_name);
      }
      if (!entry.reason) errors.push(status + ' entry without reason: ' + entry.full_name);
      if (!entry.full_name) errors.push(status + ' entry without full_name');
    }
  }

  const queueIds = new Set();
  // A repo in a terminal state must never reappear in the queue. Checking only listed
  // let an excluded repo be enqueued again, so it sat in two states at once and could
  // be approved despite having been deliberately kept out.
  const terminalNames = new Map();
  for (const status of ['listed', 'excluded', 'rejected']) {
    for (const entry of listFor(registry, status)) {
      if (entry.full_name) terminalNames.set(String(entry.full_name).toLowerCase(), status);
    }
  }
  for (const entry of registry.queue.entries) {
    const key = String(entry.id);
    if (queueIds.has(key)) errors.push('duplicate queue id ' + key);
    queueIds.add(key);
    if (listedIds.has(key)) errors.push('queue entry already listed: ' + entry.full_name);
    const settled = terminalNames.get(String(entry.full_name || '').toLowerCase());
    if (settled && !listedIds.has(key)) errors.push('queue entry already ' + settled + ': ' + entry.full_name);
  }

  for (const lang of ['zh', 'en']) {
    const file = readmePath(root, lang);
    if (!fs.existsSync(file)) {
      errors.push('missing ' + path.basename(file));
      continue;
    }
    const text = fs.readFileSync(file, 'utf8');
    if (!text.includes('<!-- BEGIN:ENTRIES -->') || !text.includes('<!-- END:ENTRIES -->')) {
      errors.push(path.basename(file) + ' missing ENTRIES markers');
      continue;
    }
    const expected = renderReadme(text, registry, lang);
    if (expected !== text) errors.push(path.basename(file) + ' is stale: run node scripts/render-readme.mjs');
    for (const entry of registry.listed.entries) {
      if (!text.includes('[' + entry.full_name + ']')) errors.push(path.basename(file) + ' missing entry ' + entry.full_name);
    }
  }

  const payload = { ok: errors.length === 0, listed: registry.listed.entries.length, excluded: registry.excluded.entries.length, rejected: registry.rejected.entries.length, queue: registry.queue.entries.length, errors, warnings: warnings.slice(0, 20) };
  console.log(JSON.stringify(payload, null, 2));
  process.exit(errors.length ? 1 : 0);
}

function rulersOk(rules) {
  return !!(rules && rules.thresholds && typeof rules.thresholds.queue === 'number' && Array.isArray(rules.search_queries));
}

void STATUSES;
main();
