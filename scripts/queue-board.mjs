import path from 'node:path';
import fs from 'node:fs';
import { createClient } from './lib/github.mjs';
import { loadRegistry } from './lib/registry.mjs';
import { parseArgs, nowIso } from './lib/util.mjs';

const TITLE = '[queue] \u5019\u9009\u89c2\u5bdf\u540d\u5355';
const MARKER = '<!-- luotianyi-queue-board -->';

function bt(t) {
  return String.fromCharCode(96) + t + String.fromCharCode(96);
}

export function boardBody(registry) {
  const queue = (registry.queue.entries || []).slice().sort((a, b) => (b.score || 0) - (a.score || 0) || String(a.full_name).localeCompare(String(b.full_name)));
  const taxonomy = registry.taxonomy.categories;
  const lines = [];
  lines.push(MARKER);
  lines.push('# \u5019\u9009\u89c2\u5bdf\u540d\u5355');
  lines.push('');
  lines.push('\u672c Issue \u7531\u81ea\u52a8\u5316\u7ef4\u62a4\uff0c\u5217\u51fa**\u5df2\u53d1\u73b0\u4f46\u5c1a\u672a\u81ea\u52a8\u5efa Issue \u7684\u5019\u9009\u4ed3\u5e93**\u3002');
  lines.push('');
  lines.push('\u8fdb\u5165\u8fd9\u91cc\u7684\u539f\u56e0\u901a\u5e38\u662f\uff1a\u4ec5\u547d\u4e2d ' + bt('vsinger') + ' \u8fd9\u7c7b\u6cdb\u79f0\uff0c\u6ca1\u6709\u51fa\u73b0\u660e\u786e\u6307\u5411\u6d1b\u5929\u4f9d\u7684\u8bcd\u3002\u6cdb\u79f0\u540c\u65f6\u662f\u4efb\u4f55\u865a\u62df\u6b4c\u624b\u7684\u901a\u79f0\uff0c\u5355\u72ec\u547d\u4e2d\u4e0d\u8db3\u4ee5\u6253\u6270\u7ef4\u62a4\u8005\uff0c\u6240\u4ee5\u7559\u5728\u8fd9\u91cc\u7b49\u5f85\u4eba\u5de5\u8fc7\u76ee\u3002');
  lines.push('');
  lines.push('**\u5f53\u524d\u5019\u9009\uff1a' + queue.length + ' \u4e2a**\uff08\u66f4\u65b0\u4e8e ' + nowIso().slice(0, 10) + '\uff09');
  lines.push('');
  if (!queue.length) {
    lines.push('\u76ee\u524d\u6ca1\u6709\u5f85\u5ba1\u7684\u5019\u9009\u3002');
    lines.push('');
    lines.push('> \u6709\u660e\u786e\u76f8\u5173\u6027\u7684\u4ed3\u5e93\u4f1a\u76f4\u63a5\u5efa\u72ec\u7acb\u7684 ' + bt('[candidate] owner/repo') + ' Issue\uff0c\u4e0d\u4f1a\u505c\u5728\u8fd9\u91cc\u3002');
  } else {
    lines.push('| \u4ed3\u5e93 | \u5206 | \u4fe1\u53f7 | \u63cf\u8ff0 | \u5efa\u8bae\u5206\u7c7b |');
    lines.push('| --- | --- | --- | --- | --- |');
    for (const e of queue) {
      const cat = taxonomy.find((c) => c.id === e.category_suggestion);
      const desc = String(e.desc || '\uff08\u65e0\uff09').replace(/\|/g, '/').replace(/\n/g, ' ').slice(0, 90);
      lines.push('| [' + e.full_name + '](https://github.com/' + e.full_name + ') | ' + (e.score || 0) + ' | ' + ((e.signals || []).join(', ') || '\u65e0') + ' | ' + desc + ' | ' + (cat ? cat.zh : e.category_suggestion || '\u672a\u77e5') + ' |');
    }
    lines.push('');
    lines.push('**\u5982\u4f55\u5904\u7406**\uff1a\u5728\u4e0b\u65b9\u8bc4\u8bba\u533a\u53d1\u5e03\u547d\u4ee4\uff0c\u5e26\u4ed3\u5e93\u540d\u3002\u4f8b\uff1a');
    lines.push('');
    lines.push(bt('/approve owner/repo category-id'));
    lines.push(bt('/reject owner/repo \u7406\u7531'));
    lines.push(bt('/exclude owner/repo \u7406\u7531'));
    lines.push('');
    lines.push('\u5206\u7c7b id\uff1a' + taxonomy.map((c) => c.id).join(' / '));
  }
  lines.push('');
  lines.push('> \u8fdb\u5165 listed / rejected / excluded \u540e\uff0c\u81ea\u52a8\u5316\u4e0d\u4f1a\u518d\u6b21\u63d0\u51fa\u8be5\u4ed3\u5e93\u3002');
  return lines.join('\n');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = path.resolve(args.root || process.cwd());
  const repoPath = args.repo || process.env.GITHUB_REPOSITORY || 'luotianyi-community/awesome-luotianyi';
  const dryRun = !!args['dry-run'];
  const token = args.token || process.env.GITHUB_TOKEN;
  if (!token && !dryRun) throw new Error('GITHUB_TOKEN required');

  const registry = loadRegistry(root);
  const body = boardBody(registry);

  if (dryRun || !token) {
    console.log(JSON.stringify({ dryRun: true, preview: body.slice(0, 400) }, null, 2));
    return;
  }

  const client = createClient({ token, repo: repoPath });
  const found = await client.request('/repos/' + repoPath + '/issues?state=all&per_page=100&sort=created&direction=asc');
  const existing = (found.data || []).find((i) => String(i.title) === TITLE);

  if (!existing) {
    const issue = await client.createIssue(repoPath, { title: TITLE, body, labels: ['automation', 'queue-board'] });
    console.log(JSON.stringify({ created: issue.number, url: issue.html_url }));
    return;
  }

  if (String(existing.body || '').trim() === body.trim()) {
    console.log(JSON.stringify({ unchanged: existing.number, queue: registry.queue.entries.length }));
    return;
  }

  await client.updateIssue(repoPath, existing.number, { body });
  if (existing.state !== 'open') await client.updateIssue(repoPath, existing.number, { state: 'open' });
  console.log(JSON.stringify({ updated: existing.number, queue: registry.queue.entries.length }));
}

void fs;
const invokedDirectly = process.argv[1] && /queue-board\.mjs$/.test(process.argv[1]);
if (invokedDirectly) {
  main().catch((err) => {
    console.error('[queue-board] failed: ' + err.message);
    process.exit(err.name === 'RateLimitError' ? 2 : 1);
  });
}
