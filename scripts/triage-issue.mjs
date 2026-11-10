import path from 'node:path';
import { createClient } from './lib/github.mjs';
import { loadRegistry, upsertListed, upsertRejected, upsertExcluded, logChange, saveRegistry, saveState, lookup } from './lib/registry.mjs';
import { parseArgs } from './lib/util.mjs';

const COMMAND = /^\s*\/(approve|reject|exclude)\b\s*(.*)$/i;
const FULL_NAME_TITLE = /^\s*\[candidate\]\s+(\S+\/\S+)\s*$/i;

const TARGET = /^(?:https?:\/\/github\.com\/)?([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)\/?$/;

export function parseCommand(text) {
  const match = String(text || '').match(COMMAND);
  if (!match) return null;
  const action = match[1].toLowerCase();
  const rest = (match[2] || '').trim();
  const first = rest.split(/\s+/)[0] || '';
  const target = TARGET.test(first) ? first.replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '') : null;
  // On the queue board there is no "candidate" title to read the repo from, so the command
  // carries it: "/approve owner/repo category-id". On a normal candidate issue the target
  // is redundant and ignored, which keeps every existing command working unchanged.
  // With an explicit target the real argument is the token after it.
  const after = target ? rest.slice(first.length).trim() : rest;
  return {
    action,
    argument: target ? (after.split(/\s+/)[0] || '') : first,
    target,
    reason: after
  };
}

export function parseTitle(title) {
  const match = String(title || '').match(FULL_NAME_TITLE);
  return match ? match[1] : null;
}

async function resolveRepo(client, fullName) {
  const repo = await client.repo(fullName);
  if (!repo) return null;
  return {
    id: repo.id,
    full_name: repo.full_name,
    description: repo.description || '',
    stargazers_count: repo.stargazers_count || 0,
    language: repo.language || null,
    pushed_at: repo.pushed_at || null,
    archived: !!repo.archived,
    fork: !!repo.fork,
    size: repo.size,
    topics: repo.topics || []
  };
}

function bt(text) {
  return String.fromCharCode(96) + text + String.fromCharCode(96);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = path.resolve(args.root || process.cwd());
  const registry = loadRegistry(root);
  const dryRun = !!args['dry-run'];
  // Replay mode: the decision was already announced (issue closed, label added, comment
  // posted) but the push lost a race against another writer. Re-running the data step on
  // top of the new origin/main must not repeat those side effects.
  const replay = !!args.replay || process.env.TRIAGE_REPLAY === '1';
  const announce = !dryRun && !replay;
  const repoPath = args.repo || process.env.GITHUB_REPOSITORY || 'luotianyi-community/awesome-luotianyi';
  const token = args.token || process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN required');
  const client = createClient({ token, repo: repoPath });

  const number = Number(args.issue || process.env.ISSUE_NUMBER);
  if (!number) throw new Error('ISSUE_NUMBER or --issue required');

  const issueRes = await client.request('/repos/' + repoPath + '/issues/' + number);
  const issue = issueRes.data;
  if (!issue) throw new Error('issue #' + number + ' not found');
  const titleTarget = parseTitle(issue.title);
  const boardTarget = /^\s*\[queue\]/.test(String(issue.title || ''));

  const comments = await client.issueComments(repoPath, number);
  const decisions = [];
  for (const comment of comments) {
    const parsed = parseCommand(comment.body);
    if (!parsed) continue;
    const login = (comment.user && comment.user.login) || '';
    if (login.endsWith('[bot]') || login === 'github-actions') continue;
    const permission = await client.userPermission(repoPath, login);
    decisions.push({ ...parsed, login, permission });
  }
  if (!decisions.length) {
    console.log(JSON.stringify({ skipped: true, reason: 'no decision command found', issue: number }));
    return;
  }

  const allowed = ['admin', 'maintain', 'write'];
  const accepted = decisions.filter((item) => allowed.includes(item.permission));
  if (!accepted.length) {
    const last = decisions[decisions.length - 1];
    const note = '命令来自 @' + last.login + '，其权限为 ' + bt(last.permission) + '，需要 ' + bt('write') + ' 及以上才能裁决。本次命令未生效。';
    if (!dryRun) await client.createComment(repoPath, number, note);
    console.log(JSON.stringify({ skipped: true, reason: 'insufficient permission', login: last.login, permission: last.permission }));
    return;
  }

  const decision = accepted[accepted.length - 1];
  // Board issues carry no repo in the title, so the command must name one.
  const fullName = titleTarget || decision.target;
  if (!fullName) {
    if (boardTarget) {
      const note = '请在命令中标明仓库，例如 ' + bt('/approve owner/repo ' + (decision.argument || 'desktop-pet'));
      if (announce) await client.createComment(repoPath, number, note);
      console.log(JSON.stringify({ skipped: true, reason: 'board command without a repo target' }));
      return;
    }
    console.log(JSON.stringify({ skipped: true, reason: 'title is not a candidate title', title: issue.title }));
    return;
  }
  if (!/\//.test(fullName)) {
    console.log(JSON.stringify({ skipped: true, reason: 'resolved target is not owner/repo', fullName }));
    return;
  }
  const repo = await resolveRepo(client, fullName);
  const known = lookup(registry, repo || { full_name: fullName });
  const taxonomyIds = new Set(registry.taxonomy.categories.map((item) => item.id));
  const summary = { issue: number, action: decision.action, by: decision.login, repo: fullName };

  if (known && (known.status === 'listed' || known.status === 'rejected') && !args.force) {
    const note = '该仓库已在名单中（状态 ' + bt(known.status) + '），本次命令被忽略。';
    if (announce) await client.createComment(repoPath, number, note);
    console.log(JSON.stringify({ skipped: true, reason: 'already in registry', status: known.status }));
    return;
  }

  if (decision.action === 'approve') {
    const category = decision.argument || 'data-tools';
    if (!taxonomyIds.has(category)) {
      const note = '未知分类 ' + bt(category) + '。可用分类：' + Array.from(taxonomyIds).join(' / ');
      if (announce) await client.createComment(repoPath, number, note);
      console.log(JSON.stringify({ skipped: true, reason: 'unknown category', category }));
      return;
    }
    if (!repo) {
      // A typo in a board command must not take the whole run down: report it on the
      // issue and stop cleanly, so the board stays usable.
      const note = '无法解析仓库 ' + bt(fullName) + '：GitHub API 查不到它。请检查拼写，或确认仓库仍然公开存在。';
      if (announce) await client.createComment(repoPath, number, note);
      console.log(JSON.stringify({ skipped: true, reason: 'unresolvable repository', fullName }));
      return;
    }
    upsertListed(registry, repo, category, { source: 'issue:' + number, evidence: ['issue:' + number + ' approved by ' + decision.login] });
    if (!dryRun) {
      saveRegistry(registry, { dryRun });
      logChange(registry, { action: 'approve', repo: repo.full_name, category, issue: number, actor: decision.login }, { dryRun });
    }
    if (announce) {
      await client.updateIssue(repoPath, number, { state: 'closed', state_reason: 'completed' });
      await client.addLabels(repoPath, number, ['approved']);
      await client.createComment(repoPath, number, '已收录到分类 ' + bt(category) + '，由 @' + decision.login + ' 批准。README 将在下次渲染时更新。');
    }
    summary.category = category;
  } else if (decision.action === 'reject') {
    const reason = decision.reason.replace(/^reject\s*/i, '').trim() || '未提供理由';
    const record = repo || { id: null, full_name: fullName };
    upsertRejected(registry, record, reason, decision.login);
    if (!dryRun) {
      saveRegistry(registry, { dryRun });
      logChange(registry, { action: 'reject', repo: record.full_name, reason, issue: number, actor: decision.login }, { dryRun });
    }
    if (announce) {
      await client.updateIssue(repoPath, number, { state: 'closed', state_reason: 'not_planned' });
      await client.addLabels(repoPath, number, ['rejected']);
      await client.createComment(repoPath, number, '已永久否决：' + reason + '（由 @' + decision.login + '）。该仓库不会被自动化再次提出。');
    }
    summary.reason = reason;
  } else if (decision.action === 'exclude') {
    const reason = decision.reason.replace(/^exclude\s*/i, '').trim() || '技术性排除';
    const record = repo || { id: null, full_name: fullName };
    upsertExcluded(registry, record, reason);
    if (!dryRun) {
      saveRegistry(registry, { dryRun });
      logChange(registry, { action: 'exclude', repo: record.full_name, reason, issue: number, actor: decision.login }, { dryRun });
    }
    if (announce) {
      await client.updateIssue(repoPath, number, { state: 'closed', state_reason: 'not_planned' });
      await client.addLabels(repoPath, number, ['excluded']);
      await client.createComment(repoPath, number, '已排除：' + reason + '（由 @' + decision.login + '）。');
    }
    summary.reason = reason;
  }

  saveState(registry, { dryRun });
  console.log(JSON.stringify({ ok: true, dryRun, ...summary }, null, 2));
}

const invokedDirectly = process.argv[1] && /triage-issue\.mjs$/.test(process.argv[1]);
if (invokedDirectly) {
  main().catch((err) => {
    console.error('[triage] failed: ' + err.message);
    process.exit(err.name === 'RateLimitError' ? 2 : 1);
  });
}
