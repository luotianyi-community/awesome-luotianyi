import path from 'node:path';
import { createClient } from './lib/github.mjs';
import { loadRegistry, saveRegistry, logChange } from './lib/registry.mjs';
import { parseArgs, nowIso, todayIso } from './lib/util.mjs';
import { stripUrls } from './lib/match.mjs';

export function firstSentence(readme) {
  if (!readme) return '';
  const lines = readme.split('\n');
  let inFence = false;
  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith(String.fromCharCode(96, 96, 96)) || line.startsWith('~~~')) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    if (!line) continue;
    if (line.startsWith('#')) continue;
    if (line.startsWith('![') || line.startsWith('[![') || line.startsWith('[!')) continue;
    if (line.startsWith('|') || line.startsWith('---') || line.startsWith('===')) continue;
    if (line.startsWith('<')) continue;
    if (line.startsWith('- ') || line.startsWith('* ') || line.startsWith('> ')) continue;
    if (/^\d+\./.test(line)) continue;
    if (line.endsWith(':') || line.endsWith('：')) continue;
    if (/^(终端|运行|安装|使用|截图|效果图|预览|demo|preview|install|usage)\b/i.test(line)) continue;
    const clean = stripUrls(line)
      .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/[\[\]()*_`>#]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (clean.length < 12) continue;
    if (!/[\u3400-\u9fff]/.test(clean) && clean.split(' ').length < 4) continue;
    return clean.slice(0, 150);
  }
  return '';
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = path.resolve(args.root || process.cwd());
  const registry = loadRegistry(root);
  const dryRun = !!args['dry-run'];
  const limit = Number(args.limit || registry.listed.entries.length);
  const fillOnly = !args.all;
  const token = args.token || process.env.GITHUB_TOKEN;
  if (!token && !dryRun) throw new Error('GITHUB_TOKEN required');
  const client = token ? createClient({ token, repo: args.repo || 'luotianyi-community/awesome-luotianyi' }) : null;

  let touched = 0;
  let read = 0;
  const tombstones = [];
  for (const entry of registry.listed.entries.slice(0, limit)) {
    if (client) {
      const repo = await client.repo(entry.full_name);
      if (!repo) {
        tombstones.push(entry.full_name);
        continue;
      }
      if (repo.full_name !== entry.full_name) {
        entry.aliases = Array.from(new Set([...(entry.aliases || []), entry.full_name])).sort();
        entry.full_name = repo.full_name;
      }
      entry.stars = repo.stargazers_count || 0;
      entry.language = repo.language || entry.language || null;
      entry.pushed_at = repo.pushed_at || entry.pushed_at || null;
      entry.archived = !!repo.archived;
      if (repo.description) entry.desc = String(repo.description).slice(0, 190);
      touched += 1;
    }
    if (fillOnly && entry.desc && entry.desc.length >= 12) continue;
    if (client && (entry.desc || '').length < 12) {
      const text = await client.readme(entry.full_name);
      const sentence = firstSentence(text);
      if (sentence) {
        entry.desc = sentence;
        read += 1;
      }
    }
  }

  if (tombstones.length) {
    registry.state.tombstones = Array.from(new Set([...(registry.state.tombstones || []), ...tombstones]));
  }
  registry.state.lastRefresh = todayIso();
  if (!dryRun) {
    saveRegistry(registry, { dryRun });
    logChange(registry, { action: 'refresh-metadata', touched, read, at: nowIso() }, { dryRun });
  }
  console.log(JSON.stringify({ dryRun, touched, read, tombstones: tombstones.length }, null, 2));
}

const invokedDirectly = process.argv[1] && /refresh-metadata\.mjs$/.test(process.argv[1]);
if (invokedDirectly) {
  main().catch((err) => {
    console.error('[refresh-metadata] failed: ' + err.message);
    process.exit(err.name === 'RateLimitError' ? 2 : 1);
  });
}
