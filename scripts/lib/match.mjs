import { readJson } from './util.mjs';

const REGEX_SPECIALS = ['.', '*', '+', '?', '^', '$', '{', '}', '(', ')', '|', '[', ']', '\\'];
const CJK = /[\u3400-\u9fff\uf900-\ufaff]/;

export function escapeRegExp(text) {
  let out = '';
  for (const ch of String(text)) out += REGEX_SPECIALS.includes(ch) ? '\\' + ch : ch;
  return out;
}

export const DEFAULT_RULES = {
  version: 1,
  terms: {
    // "core" terms unambiguously identify Luo Tianyi. "vsinger" alone does not: it is also
    // a generic word for any virtual singer and a Japanese talent label (浠Mizuki, ななし律歌).
    core: ['洛天依', '樂天依', '天依', 'luotianyi', 'luo tian yi', 'luo tianyi', 'tianyicraft'],
    strong: ['洛天依', '樂天依', '天依', 'luotianyi', 'luo tian yi', 'luo tianyi', 'tianyicraft', 'vsinger', 'lty'],
    weak: ['vocaloid', '虚拟歌手', '虚拟歌姬', '中文v家', '乐正绫', '言和', '声库', 'voicebank', 'utau', 'tianyi'],
    negative: ['vtuber', 'company', 'api evangelist', 'chat2api', 'one api']
  },
  weights: {
    name_strong: 45,
    owner_strong: 10,
    description_strong: 30,
    description_weak: 8,
    topics_strong: 15,
    topics_weak: 5,
    readme_strong: 25,
    readme_weak: 6,
    archived: -20,
    fork: -10,
    owner_denylist: -60,
    no_readme_signal: -12,
    negative: -10
  },
  thresholds: { queue: 30, issue: 45, aggregator_links: 40 },
  caps: { candidate_per_run: 400, readme_fetches: 70, issues_per_run: 20, issues_per_owner: 4, metadata_refresh: 220 },
  search_queries: [
    'luotianyi in:name,description,readme',
    '"洛天依" in:name,description,readme',
    'vsinger in:name,description,readme',
    'topic:luotianyi',
    '"luo tian yi" in:name,description,readme',
    'tianyi vocaloid in:name,description,readme',
    'tianyicraft in:name,description,readme'
  ],
  radar_queries: {
    commits: ['洛天依', 'luotianyi', '"Luo Tianyi"', 'tianyicraft'],
    issues: ['洛天依', 'luotianyi', '"Luo Tianyi"']
  },
  owner_denylist: []
};

export function loadRules(file) {
  const loaded = readJson(file, DEFAULT_RULES);
  return {
    ...DEFAULT_RULES,
    ...loaded,
    terms: { ...DEFAULT_RULES.terms, ...(loaded.terms || {}) },
    weights: { ...DEFAULT_RULES.weights, ...(loaded.weights || {}) },
    thresholds: { ...DEFAULT_RULES.thresholds, ...(loaded.thresholds || {}) },
    caps: { ...DEFAULT_RULES.caps, ...(loaded.caps || {}) },
    radar_queries: { ...DEFAULT_RULES.radar_queries, ...(loaded.radar_queries || {}) }
  };
}

export function normalize(input) {
  return String(input || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[_\-./\\:]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function squashed(input) {
  return normalize(input).replace(/\s+/g, '');
}

const termCache = new Map();

export function indexTerms(terms) {
  const key = (terms || []).join('\u0001');
  if (termCache.has(key)) return termCache.get(key);
  const ascii = new Map();
  const cjk = new Map();
  for (const raw of terms || []) {
    const normal = normalize(raw);
    if (!normal) continue;
    if (CJK.test(normal)) {
      const value = normal.replace(/\s+/g, '');
      if (!cjk.has(value)) cjk.set(value, raw);
    } else {
      const value = normal;
      if (!ascii.has(value)) ascii.set(value, raw);
    }
  }
  const index = {
    ascii: Array.from(ascii.keys()).map((value) => ({ value, multi: value.includes(' '), regex: new RegExp('\\b' + escapeRegExp(value) + '\\b') })),
    cjk: Array.from(cjk.keys())
  };
  termCache.set(key, index);
  return index;
}

export function stripUrls(text) {
  return String(text || '')
    .replace(/https?:\/\/\S+/gi, ' ')
    .replace(/\bwww\.\S+/gi, ' ')
    .replace(/\b[A-Za-z0-9-]+\.(com|cn|net|org|vc|io|dev|app|me|cc)\b\S*/gi, ' ');
}

export function matchTerms(text, terms) {
  const index = indexTerms(terms);
  const normal = normalize(stripUrls(text));
  const flat = normal.replace(/\s+/g, '');
  const found = [];
  for (const entry of index.ascii) {
    if (entry.multi) {
      if (flat.includes(entry.value.replace(/\s+/g, ''))) found.push(entry.value);
    } else if (entry.regex.test(normal)) {
      found.push(entry.value);
    }
  }
  for (const term of index.cjk) {
    if (flat.includes(term)) found.push(term);
  }
  return collapseOverlaps(found);
}

export function collapseOverlaps(found) {
  const flat = found.map((term) => term.replace(/\s+/g, ''));
  const keep = [];
  for (let i = 0; i < found.length; i += 1) {
    let absorbed = false;
    for (let j = 0; j < found.length; j += 1) {
      if (i === j) continue;
      if (flat[j].includes(flat[i]) && (flat[j].length > flat[i].length || (flat[j].length === flat[i].length && j < i))) {
        absorbed = true;
        break;
      }
    }
    if (!absorbed) keep.push(found[i]);
  }
  return keep;
}

export function countHits(text, terms) {
  return matchTerms(text, terms).length;
}

function asciiOnly(text, terms) {
  return matchTerms(text, terms).filter((term) => !CJK.test(term));
}

function cjkOnly(text, terms) {
  return matchTerms(text, terms).filter((term) => CJK.test(term));
}

// A project README links to itself, its docs, its releases. A curated index links to
// everything it indexes, so the ratio of foreign repository links is a structural signal
// that does not depend on which words happen to appear.
export function foreignRepoLinks(readme, selfFullName) {
  if (!readme) return { total: 0, foreign: 0 };
  const self = String(selfFullName || '').toLowerCase();
  const found = new Set();
  let total = 0;
  const re = /https?:\/\/(?:www\.)?github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)/g;
  let m;
  while ((m = re.exec(readme)) !== null) {
    const full = (m[1] + '/' + m[2]).toLowerCase().replace(/\.git$/, '');
    total += 1;
    if (full !== self) found.add(full);
  }
  return { total, foreign: found.size };
}

export function evaluateRepo(repo, rules, extra) {
  const cfg = rules || DEFAULT_RULES;
  const ctx = extra || {};
  const weights = cfg.weights;
  const signals = [];
  const nameText = repo.name || (repo.full_name || '').split('/')[1] || '';
  const ownerText = (repo.owner && repo.owner.login) || (repo.full_name || '').split('/')[0] || '';
  const descriptionText = repo.description || '';
  const topicsText = (repo.topics || []).join(' ');
  const readmeText = ctx.readme || '';

  const nameStrong = countHits(nameText, cfg.terms.strong);
  const ownerStrong = countHits(ownerText, cfg.terms.strong);
  const descStrong = countHits(descriptionText, cfg.terms.strong);
  const descWeak = countHits(descriptionText, cfg.terms.weak);
  const topicStrong = countHits(topicsText, cfg.terms.strong);
  const topicWeak = countHits(topicsText, cfg.terms.weak);
  const readmeStrong = readmeText ? countHits(readmeText, cfg.terms.strong) : 0;
  const readmeWeak = readmeText ? countHits(readmeText, cfg.terms.weak) : 0;
  // A single mention inside an enormous README is a mention, not a topic. Aggregators and
  // market listings carry hundreds of thousands of characters and name every project they
  // index: losebird/dsh-plugin-market (435KB) lists one Luo Tianyi skin and scored 56;
  // bilibili-collection (403KB) contains her name in one row of a generated table.
  // Both were proposed as candidates on the strength of that single line.
  const readmeDensity = readmeText ? readmeStrong / Math.max(1, Math.ceil(readmeText.length / 20000)) : 0;
  const readmeStrongEffective = readmeDensity < 0.5 ? 0 : readmeStrong;
  // Structural check on top of the density heuristic: an index links out to the projects it
  // indexes, so many distinct foreign repo links mean the subject is the list, not any one
  // entry in it. The threshold lives in the rules so it can be tuned without editing code.
  const links = foreignRepoLinks(readmeText, repo.full_name || '');
  const aggregatorMin = Number((cfg.thresholds && cfg.thresholds.aggregator_links) || 40);
  const isAggregator = links.foreign >= aggregatorMin;
  const negativeHits = countHits(descriptionText + ' ' + topicsText, cfg.terms.negative || []);

  let score = 0;
  score += Math.min(nameStrong, 2) * weights.name_strong;
  score += Math.min(ownerStrong, 1) * weights.owner_strong;
  score += Math.min(descStrong, 2) * weights.description_strong;
  score += Math.min(descWeak, 2) * weights.description_weak;
  score += Math.min(topicStrong, 2) * weights.topics_strong;
  score += Math.min(topicWeak, 1) * weights.topics_weak;
  score += Math.min(readmeStrongEffective, 2) * weights.readme_strong;
  score += Math.min(readmeWeak, 1) * weights.readme_weak;

  if (nameStrong > 0) signals.push('name:strong');
  else if (ownerStrong > 0) signals.push('owner:strong');
  if (descStrong > 0) signals.push('description:strong');
  if (descWeak > 0) signals.push('description:weak');
  if (topicStrong > 0) signals.push('topics:strong');
  if (topicWeak > 0) signals.push('topics:weak');
  if (readmeStrongEffective > 0) signals.push('readme:strong');
  else if (readmeStrong > 0) signals.push('readme:diluted');
  else if (readmeWeak > 0) signals.push('readme:weak');

  if (repo.archived) {
    score += weights.archived;
    signals.push('archived');
  }
  if (repo.fork) {
    score += weights.fork;
    signals.push('fork');
  }
  const ownerLower = normalize(ownerText);
  const deny = (cfg.owner_denylist || []).some((entry) => normalize(entry) === ownerLower);
  if (deny) {
    score += weights.owner_denylist;
    signals.push('owner:denylist');
  }
  if (ctx.readmeChecked && readmeStrong === 0 && readmeWeak === 0) {
    score += weights.no_readme_signal;
    signals.push('readme:none');
  }
  if (negativeHits > 0) {
    score += weights.negative * Math.min(negativeHits, 3);
    signals.push('negative');
  }

  const coreTerms = cfg.terms.core || [];
  const coreHits = countHits(nameText + ' ' + descriptionText + ' ' + topicsText + ' ' + readmeText, coreTerms);

  const contentHits = descStrong + topicStrong + readmeStrong;
  const hasContentSignal = contentHits + descWeak + readmeWeak + cjkOnly(descriptionText, cfg.terms.strong).length > 0;

  // A strong term inside the repository NAME is itself a content signal: whoever
  // created the repo chose that name. Only the OWNER account can collide by accident
  // (e.g. owner "Luotianyi-0712" publishing an unrelated OpenIDC server), so only
  // owner-only matches may be treated as a collision, and only after we have actually
  // read a README that carries no signal.
  const nameHit = asciiOnly(nameText, cfg.terms.strong).length + cjkOnly(nameText, cfg.terms.strong).length;  // strong term in the repo name: creator chose it deliberately
  const ownerHit = asciiOnly(ownerText, cfg.terms.strong).length + cjkOnly(ownerText, cfg.terms.strong).length;
  const inspected = !!ctx.readmeChecked;
  const nameCollision = nameHit === 0 && ownerHit > 0 && !hasContentSignal && inspected;
  if (nameCollision) signals.push('name-collision');
  // Recorded so downstream steps (open-issues) can apply the same core-term gate without
  // re-reading the README.
  if (coreHits > 0) signals.push('core');
  // Recorded rather than folded into the score: being an index is a structural property,
  // and a maintainer should be able to see why a repo was skipped.
  if (isAggregator) signals.push('aggregator');

  return {
    score: Math.round(score),
    signals: signals.slice().sort(),
    nameCollision,
    hasContentSignal,
    contentHits,
    negativeHits,
    coreHits,
    isAggregator,
    foreignLinks: links.foreign,
    verdict: classify(repo, { score, nameCollision, contentHits, negativeHits, inspected, nameHit, coreHits, isAggregator }),
    detail: { nameStrong, ownerStrong, descStrong, descWeak, topicStrong, topicWeak, readmeStrong, readmeWeak }
  };
}

function classify(repo, state) {
  if (repo.archived) return 'excluded:archived';
  if (Number(repo.size) === 0) return 'excluded:empty';
  if (state.nameCollision && state.inspected) return 'excluded:name-collision';
  // An index is not the thing it indexes. Skipping at classification time means the repo
  // never becomes a candidate, never eats a README fetch next round, and never opens an
  // issue a maintainer has to close by hand.
  if (state.isAggregator) return 'excluded:aggregator';
  // A strong term in the repository NAME counts as evidence even when the repo has no
  // README at all: e.g. LuoTianYi_GrubTheme ships only fonts and a screenshot.
  const evidenced = state.contentHits > 0 || state.nameHit > 0;
  // Anything clearing the bar is surfaced as an issue instead of being parked in a queue
  // nobody reads. Two gates remain, because an issue costs a maintainer's attention:
  // there must be textual evidence (description / topics / README), and at least one
  // unambiguous term must appear. A bare "vsinger" describes any virtual singer and
  // already produced false positives (Miizuki, nanashi), so it stays in the queue.
  if (state.score >= 45 && state.contentHits > 0 && state.coreHits > 0) return 'issue';
  if (state.score >= 30 && evidenced) return 'queue';
  return 'low';
}

export function suggestCategory(repo, taxonomy) {
  const haystack = [repo.name || '', repo.description || '', (repo.topics || []).join(' ')].join(' ');
  const normal = normalize(haystack);
  const flat = normal.replace(/\s+/g, '');
  let best = null;
  for (const category of taxonomy.categories || []) {
    let hits = 0;
    for (const hint of category.hints || []) {
      const needle = normalize(hint);
      if (!needle) continue;
      if (CJK.test(needle)) {
        if (flat.includes(needle.replace(/\s+/g, ''))) hits += 1;
      } else if (new RegExp('\\b' + escapeRegExp(needle) + '\\b').test(normal)) {
        hits += 1;
      }
    }
    if (hits > 0 && (!best || hits > best.hits)) best = { id: category.id, hits };
  }
  return best ? best.id : taxonomy.fallback || 'data-tools';
}
