import path from 'node:path';
import { parseArgs } from './lib/util.mjs';
import { createClient } from './lib/github.mjs';
import { loadRegistry, upsertListed, upsertRejected, upsertExcluded, logChange, saveRegistry, lookup } from './lib/registry.mjs';
import { evaluateRepo, loadRules, suggestCategory } from './lib/match.mjs';

const FULL_NAME = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

async function fetchRepo(client, fullName, cached) {
  if (cached && Number(cached.id)) {
    return {
      id: cached.id,
      full_name: cached.full_name || fullName,
      description: cached.desc || cached.description || '',
      stargazers_count: cached.stars || 0,
      language: cached.language || null,
      pushed_at: cached.pushed_at || null,
      archived: !!cached.archived,
      fork: !!cached.fork,
      size: cached.size === undefined ? 1 : cached.size,
      topics: cached.topics || []
    };
  }
  const repo = await client.repo(fullName);
  if (!repo) throw new Error('repository not found: ' + fullName);
  return repo;
}

async function main() {
  const argv = process.argv.slice(2);
  const args = parseArgs(argv);
  const root = path.resolve(args.root || process.cwd());
  const registry = loadRegistry(root);
  const rules = loadRules(registry.paths.rules);
  const dryRun = !!args['dry-run'];
  const command = args._[0];
  const target = args._[1];
  const token = args.token || process.env.GITHUB_TOKEN;
  const client = token ? createClient({ token, repo: args.repo || 'luotianyi-community/awesome-luotianyi' }) : null;

  if (!command || ['help', '-h'].includes(command)) {
    console.log(usage());
    return;
  }

  if (command === 'list') {
    const payload = {
      listed: registry.listed.entries.map((entry) => ({ full_name: entry.full_name, category: entry.category, stars: entry.stars })),
      excluded: registry.excluded.entries.map((entry) => ({ full_name: entry.full_name, reason: entry.reason })),
      rejected: registry.rejected.entries.map((entry) => ({ full_name: entry.full_name, reason: entry.reason })),
      queue: registry.queue.entries.map((entry) => ({ full_name: entry.full_name, score: entry.score }))
    };
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  if (command === 'refresh') {
    if (!client) throw new Error('GITHUB_TOKEN required for refresh');
    let count = 0;
    for (const entry of registry.listed.entries) {
      if (args.limit && count >= Number(args.limit)) break;
      const repo = await client.repo(entry.full_name);
      if (!repo) {
        registry.state.tombstones = registry.state.tombstones || [];
        registry.state.tombstones.push({ id: entry.id, full_name: entry.full_name, at: new Date().toISOString().slice(0, 10), reason: 'not found during refresh' });
        continue;
      }
      if (repo.full_name !== entry.full_name) {
        entry.aliases = Array.from(new Set([...(entry.aliases || []), entry.full_name])).sort();
      }
      entry.full_name = repo.full_name;
      entry.stars = repo.stargazers_count || 0;
      entry.language = repo.language || entry.language || null;
      entry.pushed_at = repo.pushed_at || entry.pushed_at || null;
      entry.archived = !!repo.archived;
      if (repo.description) entry.desc = String(repo.description).slice(0, 190);
      count += 1;
    }
    if (!dryRun) {
      saveRegistry(registry, { dryRun });
      logChange(registry, { action: 'refresh', count, actor: args.actor || 'manual' }, { dryRun });
    }
    console.log(JSON.stringify({ refreshed: count, dryRun }, null, 2));
    return;
  }

  if (!target || !FULL_NAME.test(target)) throw new Error('usage: add-entry.mjs ' + command + ' <owner/repo>');

  let repo;
  if (client) {
    repo = (await fetchRepo(client, target, null)) || null;
  }
  if (!repo) {
    const known = lookup(registry, { full_name: target });
    if (known && known.entry && known.entry.id) repo = await fetchRepo(client, target, known.entry);
  }
  if (!repo) {
    if (!dryRun && (!client || args.offline)) throw new Error('cannot resolve ' + target + ' without network access');
    repo = { id: null, full_name: target, description: args.desc || '', stargazers_count: 0, language: null, pushed_at: null, archived: false, fork: false, size: 1, topics: [] };
  }

  if (command === 'add') {
    const category = args.category || suggestCategory(repo, registry.taxonomy);
    if (!registry.taxonomy.categories.some((item) => item.id === category)) {
      throw new Error('unknown category "' + category + '"; valid: ' + registry.taxonomy.categories.map((item) => item.id).join(', '));
    }
    const evaluation = evaluateRepo(repo, rules, {});
    const entry = upsertListed(registry, repo, category, {
      desc: args.desc || repo.description,
      source: args.source || 'manual',
      evidence: args.evidence ? [String(args.evidence)] : ['manual-review']
    });
    if (!dryRun) {
      saveRegistry(registry, { dryRun });
      logChange(registry, { action: 'add', repo: entry.full_name, category, actor: args.actor || 'manual' }, { dryRun });
    }
    console.log(JSON.stringify({ added: entry, score: evaluation.score, dryRun }, null, 2));
    return;
  }

  if (command === 'reject') {
    if (!args.reason) throw new Error('reject requires --reason');
    const entry = upsertRejected(registry, repo, args.reason, args.by || args.actor || 'manual');
    if (!dryRun) {
      saveRegistry(registry, { dryRun });
      logChange(registry, { action: 'reject', repo: entry.full_name, reason: args.reason, actor: args.actor || 'manual' }, { dryRun });
    }
    console.log(JSON.stringify({ rejected: entry, dryRun }, null, 2));
    return;
  }

  if (command === 'exclude') {
    if (!args.reason) throw new Error('exclude requires --reason');
    const entry = upsertExcluded(registry, repo, args.reason);
    if (!dryRun) {
      saveRegistry(registry, { dryRun });
      logChange(registry, { action: 'exclude', repo: entry.full_name, reason: args.reason, actor: args.actor || 'manual' }, { dryRun });
    }
    console.log(JSON.stringify({ excluded: entry, dryRun }, null, 2));
    return;
  }

  throw new Error('unknown command: ' + command + '\n\n' + usage());
}

function usage() {
  return [
    'usage:',
    '  node scripts/add-entry.mjs add <owner/repo> [--category <id>] [--desc "..."] [--evidence "..."]',
    '  node scripts/add-entry.mjs reject <owner/repo> --reason "..."',
    '  node scripts/add-entry.mjs exclude <owner/repo> --reason "..."',
    '  node scripts/add-entry.mjs refresh [--limit N]',
    '  node scripts/add-entry.mjs list',
    '',
    'options: --root <dir> --dry-run --token <pat> --actor <login>'
  ].join('\n');
}

main().catch((err) => {
  console.error('add-entry failed: ' + err.message);
  process.exit(1);
});
