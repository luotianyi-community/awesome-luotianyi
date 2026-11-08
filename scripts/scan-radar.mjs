import path from 'node:path';
import { createClient } from './lib/github.mjs';
import { loadRules, evaluateRepo } from './lib/match.mjs';
import { loadRegistry, lookup, saveRegistry, saveState, logChange, statusOf } from './lib/registry.mjs';
import { parseArgs, nowIso } from './lib/util.mjs';
import { enqueue, mergeEvidence, autoExclude, repoRecord } from './lib/pipeline.mjs';

async function collectSignals(client, registry, rules, args, verbose) {
  const found = new Map();
  const watermark = registry.state.watermark.radar || '1970-01-01';
  const since = args.since || watermark;
  const maxPages = Number(args.pages || 1);

  for (const term of rules.radar_queries.commits || []) {
    for (let page = 1; page <= maxPages; page += 1) {
      const query = term + ' committer-date:>' + since;
      let result;
      try {
        result = await client.searchCommits(query, page);
      } catch (err) {
        console.error('[radar] commit query failed: ' + query + ' :: ' + err.message);
        break;
      }
      if (verbose) console.log('[radar] commits ' + query + ' -> ' + (result.items || []).length + ' / ' + result.total_count);
      for (const item of result.items || []) {
        const repo = (item.repository && item.repository.full_name) || '';
        if (!repo) continue;
        const hit = found.get(repo) || { repo, evidence: [] };
        hit.evidence = mergeEvidence(hit.evidence, ['commit:' + (item.sha || '').slice(0, 7) + ':' + String(item.commit && item.commit.message ? item.commit.message.split('\n')[0] : '').slice(0, 60)]);
        found.set(repo, hit);
      }
      if ((result.items || []).length < 100) break;
    }
  }

  for (const term of rules.radar_queries.issues || []) {
    for (const kind of ['is:issue', 'is:pull-request']) {
      for (let page = 1; page <= maxPages; page += 1) {
        const query = term + ' ' + kind + ' created:>' + since;
        let result;
        try {
          result = await client.searchIssues(query, page);
        } catch (err) {
          console.error('[radar] issue query failed: ' + query + ' :: ' + err.message);
          break;
        }
        if (verbose) console.log('[radar] ' + kind + ' ' + query + ' -> ' + (result.data ? '' : '') + (result.items || []).length + ' / ' + result.total_count);
        for (const item of result.items || []) {
          const repo = String(item.repository_url || '').split('/repos/')[1] || '';
          if (!repo) continue;
          const hit = found.get(repo) || { repo, evidence: [] };
          hit.evidence = mergeEvidence(hit.evidence, [kind.replace('is:', '') + ':' + item.number + ':' + String(item.title || '').slice(0, 70)]);
          found.set(repo, hit);
        }
        if ((result.items || []).length < 100) break;
      }
    }
  }
  return found;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = path.resolve(args.root || process.cwd());
  const registry = loadRegistry(root);
  const rules = loadRules(registry.paths.rules);
  const dryRun = !!args['dry-run'];
  const verbose = !!args.verbose;
  const client = createClient({
    token: args.token || process.env.GITHUB_TOKEN,
    repo: args.repo || 'luotianyi-community/awesome-luotianyi',
    verbose
  });

  const signals = await collectSignals(client, registry, rules, args, verbose);
  let scanned = 0;
  let queued = 0;
  let excluded = 0;
  let skipped = 0;
  const details = [];

  for (const item of signals.values()) {
    scanned += 1;
    // never propose the index itself
    if (item.repo.toLowerCase() === String(args.repo || 'luotianyi-community/awesome-luotianyi').toLowerCase()) continue;
    const known = lookup(registry, { full_name: item.repo });
    if (known) {
      skipped += 1;
      continue;
    }
    let repo;
    try {
      repo = await client.repo(item.repo);
    } catch (err) {
      console.error('[radar] repo fetch failed: ' + item.repo + ' :: ' + err.message);
      continue;
    }
    if (!repo) {
      autoExclude(registry, { id: null, full_name: item.repo }, 'repository not found (deleted or renamed)', { dryRun });
      excluded += 1;
      continue;
    }
    const record = repoRecord(repo);
    const evaluation = evaluateRepo(record, rules, {});
    if (evaluation.verdict.startsWith('excluded:')) {
      autoExclude(registry, record, evaluation.verdict.replace('excluded:', ''), { dryRun });
      excluded += 1;
      continue;
    }
    if (evaluation.score < rules.thresholds.queue) {
      skipped += 1;
      continue;
    }
    const out = enqueue(registry, rules, record, evaluation, { source: 'radar', evidence: mergeEvidence(item.evidence, evaluation.signals) });
    if (out.created) queued += 1;
    details.push({ full_name: record.full_name, score: evaluation.score, evidence: item.evidence.slice(0, 3) });
  }

  if (!dryRun) {
    registry.state.watermark.radar = nowIso().slice(0, 10);
    registry.state.lastRun = nowIso();
    saveRegistry(registry, { dryRun });
    saveState(registry, { dryRun });
    logChange(registry, { action: 'radar-scan', scanned, queued, excluded, skipped, watermark: registry.state.watermark.radar }, { dryRun });
  }

  console.log(JSON.stringify({
    dryRun,
    scanned,
    queued,
    excluded,
    skipped,
    queueSize: registry.queue.entries.length,
    watermark: registry.state.watermark.radar,
    requests: client.stats.requests,
    details: details.sort((a, b) => b.score - a.score).slice(0, 15)
  }, null, 2));
}

main().catch((err) => {
  console.error('[scan-radar] failed: ' + err.message);
  process.exit(err.name === 'RateLimitError' ? 2 : 1);
});
