import { lookup, statusOf, upsertExcluded, logChange } from './registry.mjs';
import { suggestCategory } from './match.mjs';
import { nowIso } from './util.mjs';

export function repoRecord(repo) {
  return {
    id: repo.id,
    full_name: repo.full_name,
    html_url: repo.html_url || 'https://github.com/' + repo.full_name,
    desc: repo.description || '',
    stars: repo.stargazers_count || 0,
    language: repo.language || null,
    pushed_at: repo.pushed_at || repo.updated_at || null,
    archived: !!repo.archived,
    fork: !!repo.fork,
    size: repo.size,
    topics: repo.topics || []
  };
}

export function mergeEvidence(current, incoming) {
  const list = Array.isArray(current) ? current.slice() : [];
  for (const item of incoming || []) {
    if (!item) continue;
    if (!list.includes(item)) list.push(item);
  }
  return list.slice(0, 8);
}

export function enqueue(registry, rules, repo, evaluation, extra) {
  const opts = extra || {};
  const existing = registry.queue.entries.find((entry) => String(entry.id) === String(repo.id));
  const now = nowIso().slice(0, 10);
  const categorySuggestion = suggestCategory(repo, registry.taxonomy);
  if (existing) {
    existing.score = evaluation.score;
    existing.signals = evaluation.signals;
    existing.desc = repo.desc;
    existing.stars = repo.stars;
    existing.language = repo.language;
    existing.pushed_at = repo.pushed_at;
    existing.last_seen = now;
    existing.category_suggestion = categorySuggestion;
    existing.evidence = mergeEvidence(existing.evidence, opts.evidence);
    existing.sources = Array.from(new Set([...(existing.sources || []), opts.source || 'catalog'])).sort();
    return { entry: existing, created: false };
  }
  const entry = {
    id: repo.id,
    full_name: repo.full_name,
    desc: repo.desc,
    stars: repo.stars,
    language: repo.language,
    pushed_at: repo.pushed_at,
    archived: repo.archived,
    fork: repo.fork,
    score: evaluation.score,
    signals: evaluation.signals,
    category_suggestion: categorySuggestion,
    sources: [opts.source || 'catalog'],
    evidence: mergeEvidence([], opts.evidence),
    first_seen: now,
    last_seen: now,
    issue: null
  };
  registry.queue.entries.push(entry);
  void rules;
  return { entry, created: true };
}

export function autoExclude(registry, repo, reason, options) {
  const opts = options || {};
  if (statusOf(registry, repo)) return false;
  upsertExcluded(registry, repo, reason);
  logChange(registry, { action: 'exclude', repo: repo.full_name, id: repo.id, reason, actor: 'automation' }, opts);
  return true;
}

export function statusLabel(registry, repo) {
  const hit = lookup(registry, repo);
  return hit ? hit.status : 'new';
}
