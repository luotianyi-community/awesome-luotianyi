import path from 'node:path';
import fs from 'node:fs';
import { createClient } from './lib/github.mjs';
import { loadRegistry, saveRegistry, saveState, logChange, upsertExcluded } from './lib/registry.mjs';
import { loadRules } from './lib/match.mjs';
import { parseArgs, nowIso } from './lib/util.mjs';

const LABELS = [
  { name: 'repo-candidate', color: '0E8A16', description: 'automated candidate from scan' },
  { name: 'needs-review', color: 'FBCA04', description: 'waiting for maintainer decision' },
  { name: 'approved', color: '0B7285', description: 'approved and merged into catalog' },
  { name: 'rejected', color: 'B60205', description: 'rejected permanently' },
  { name: 'excluded', color: '6E7781', description: 'excluded for technical reasons' },
  { name: 'automation', color: '5319E7', description: 'created by automation' }
];

// Selection is a pure function so the caps that stop the bot from flooding a repo can be
// tested without touching the network. Everything about *which* entries are eligible and
// *how many* are taken lives here; the loop in main() only performs the API calls.
export function selectCandidates(entries, rules, options) {
  const opts = options || {};
  // Accept any iterable. The caller builds a Set, the tests pass an array, and requiring
  // one concrete type turned that difference into a runtime crash that only appeared in
  // production -- the tests exercised the array path and the workflow hit the Set path.
  const existingTitles = new Set(Array.from(opts.existingTitles || []).map((t) => String(t).toLowerCase()));
  const limit = Number(opts.limit || rules.caps.issues_per_run);
  const perOwner = Number(opts.perOwner || rules.caps.issues_per_owner);

  const eligible = entries.filter((entry) => {
    if (entry.issue && entry.issue.number) return false;
    if (String(entry.score) < rules.thresholds.issue) return false;
    // A bare "vsinger" match is too generic to page a maintainer; leave it queued for a
    // human. This mirrors the core-term gate in classify() (lib/match.mjs).
    if (!(entry.signals || []).includes('core')) return false;
    if (existingTitles.has(('[candidate] ' + entry.full_name).toLowerCase())) return false;
    return true;
  }).slice().sort((a, b) => (b.score || 0) - (a.score || 0) || String(a.full_name).localeCompare(String(b.full_name)));

  const ownerCounts = new Map();
  const picked = [];
  for (const entry of eligible) {
    if (picked.length >= limit) break;
    const owner = String(entry.full_name).split('/')[0];
    const used = ownerCounts.get(owner) || 0;
    if (used >= perOwner) continue;
    ownerCounts.set(owner, used + 1);
    picked.push(entry);
  }
  return { eligible, picked, owners: ownerCounts };
}
function issueBody(entry, taxonomy) {
  const category = taxonomy.categories.find((item) => item.id === entry.category_suggestion);
  const lines = [];
  lines.push('<!-- luotianyi-candidate:' + entry.id + ' -->');
  lines.push('由自动化扫描发现，尚未进入名单。请维护者裁决。');
  lines.push('');
  lines.push('| 字段 | 值 |');
  lines.push('| --- | --- |');
  lines.push('| 仓库 | [' + entry.full_name + '](https://github.com/' + entry.full_name + ') |');
  lines.push('| 数字 id | ' + entry.id + ' |');
  lines.push('| 描述 | ' + (entry.desc || '（无）').replace(/\|/g, '/').replace(/\n/g, ' ') + ' |');
  lines.push('| 星标 | ' + (entry.stars || 0) + ' |');
  lines.push('| 语言 | ' + (entry.language || '未知') + ' |');
  lines.push('| 最近提交 | ' + (entry.pushed_at || '未知') + ' |');
  lines.push('| 评分 | ' + entry.score + ' |');
  lines.push('| 命中信号 | ' + ((entry.signals || []).join(', ') || '无') + ' |');
  lines.push('| 来源 | ' + ((entry.sources || []).join(', ') || 'catalog') + ' |');
  lines.push('| 建议分类 | ' + (category ? category.id + ' — ' + category.zh : entry.category_suggestion || '未知') + ' |');
  lines.push('');
  if (entry.evidence && entry.evidence.length) {
    lines.push('**证据**');
    lines.push('');
    for (const item of entry.evidence) lines.push('- ' + item);
    lines.push('');
  }
  lines.push('---');
  lines.push('');
  lines.push('**裁决命令**（仅对本仓库有 write 及以上权限者有效）：');
  lines.push('');
  lines.push('- 收录：`/approve ' + (category ? category.id : 'desktop-pet') + '`（可换成其他分类 id）');
  lines.push('- 永久否决：`/reject 理由`');
  lines.push('- 技术性排除：`/exclude 理由`');
  lines.push('');
  lines.push('分类 id：' + taxonomy.categories.map((item) => item.id).join(' / '));
  lines.push('');
  lines.push('> 进入 listed / rejected / excluded 后，自动化不会再次提出该仓库。');
  return lines.join('\n');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = path.resolve(args.root || process.cwd());
  const registry = loadRegistry(root);
  const rules = loadRules(registry.paths.rules);
  const dryRun = !!args['dry-run'];
  const repoPath = args.repo || process.env.GITHUB_REPOSITORY || 'luotianyi-community/awesome-luotianyi';
  const limit = Number(args.limit || rules.caps.issues_per_run);
  const perOwner = Number(args.perOwner || rules.caps.issues_per_owner);

  const token = args.token || process.env.GITHUB_TOKEN;
  if (!token && !dryRun) throw new Error('GITHUB_TOKEN required');
  const client = token ? createClient({ token, repo: repoPath }) : null;

  const existing = [];
  if (client) {
    const openIssues = await client.request('/repos/' + repoPath + '/issues?state=open&per_page=100&labels=repo-candidate');
    for (const issue of (openIssues.data || [])) existing.push(issue.title);
  }
  const existingTitles = new Set(existing.map((title) => title.toLowerCase()));

  const selection = selectCandidates(registry.queue.entries, rules, { existingTitles, limit, perOwner });
  const candidates = selection.eligible;

  let created = 0;
  const out = [];
  // selection.picked is already capped by limit and per-owner, so this loop only performs
  // the API calls.
  for (const entry of selection.picked) {
    if (dryRun || !client) {
      out.push({ wouldCreate: entry.full_name, score: entry.score });
      created += 1;
      continue;
    }
    if (created === 0) await client.ensureLabels(repoPath, LABELS);
    const body = issueBody(entry, registry.taxonomy);
    const issue = await client.createIssue(repoPath, {
      title: '[candidate] ' + entry.full_name,
      body,
      labels: ['repo-candidate', 'needs-review', 'automation']
    });
    entry.issue = { number: issue.number, url: issue.html_url, created_at: nowIso().slice(0, 10) };
    created += 1;
    out.push({ created: entry.full_name, number: issue.number, score: entry.score });
    logChange(registry, { action: 'issue-open', repo: entry.full_name, number: issue.number }, { dryRun });
  }

  if (!dryRun) {
    registry.state.lastIssueRun = nowIso();
    saveRegistry(registry, { dryRun });
    saveState(registry, { dryRun });
  }
  console.log(JSON.stringify({ dryRun, considered: candidates.length, created, out }, null, 2));
}

void fs;
void upsertExcluded;
// Guarded so the module can be imported by tests without running the job.
const invokedDirectly = process.argv[1] && /open-issues\.mjs$/.test(process.argv[1]);
if (invokedDirectly) {
  main().catch((err) => {
    console.error('[open-issues] failed: ' + err.message);
    process.exit(err.name === 'RateLimitError' ? 2 : 1);
  });
}
