import { createClient } from './lib/github.mjs';
import { loadRules, evaluateRepo } from './lib/match.mjs';
import { loadRegistry, lookup, saveRegistry, saveState, logChange, statusOf } from './lib/registry.mjs';
import { parseArgs, nowIso, rewindDay } from './lib/util.mjs';
import { enqueue, mergeEvidence, autoExclude } from './lib/pipeline.mjs';
import path from 'node:path';

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

  const watermarkKey = 'catalog';
  const watermark = registry.state.watermark[watermarkKey] || '1970-01-01';
  const since = args.since || watermark;
  const pages = Number(args.pages || 1);
  const seenMap = new Map();
  const queries = (args.query ? [args.query] : rules.search_queries).slice();

  for (const rawQuery of queries) {
    let query = rawQuery;
    if (!/\bin:/.test(query) && !/^topic:/.test(query)) query = query + ' in:name,description,readme';
    if (!/pushed:/.test(query) && since && since !== '1970-01-01') query = query + ' pushed:>' + rewindDay(since);
    if (verbose) console.log('[query]', query);
    for (let page = 1; page <= pages; page += 1) {
      let result;
      try {
        result = await client.searchRepos(query, page);
      } catch (err) {
        console.error('[scan] query failed: ' + query + ' :: ' + err.message);
        break;
      }
      const items = result.items || [];
      if (verbose) console.log('[query] ' + query + ' page ' + page + ' -> ' + items.length + ' of ' + result.total_count);
      for (const item of items) {
        if (!item || !item.full_name || item.private) continue;
        if (!seenMap.has(String(item.id))) seenMap.set(String(item.id), item);
      }
      if (items.length < 100 || result.total_count > 1000) break;
    }
  }

  let processed = 0;
  let excluded = 0;
  let queued = 0;
  let updated = 0;
  let readmeLeft = Number(args['readme-limit'] || rules.caps.readme_fetches);
  const results = [];

  for (const item of seenMap.values()) {
    processed += 1;
    // never propose the index itself, or a fork of it
    if (String(item.full_name).toLowerCase() === String(args.repo || 'luotianyi-community/awesome-luotianyi').toLowerCase()) continue;
    const known = lookup(registry, item);
    if (known) {
      if (known.status === 'listed') {
        const entry = known.entry;
        if ((entry.stars || 0) !== (item.stargazers_count || 0)) updated += 1;
        entry.stars = item.stargazers_count || 0;
        entry.language = item.language || entry.language || null;
        entry.pushed_at = item.pushed_at || entry.pushed_at || null;
        if (item.full_name && entry.full_name !== item.full_name) {
          entry.aliases = Array.from(new Set([...(entry.aliases || []), item.full_name])).sort();
        }
      }
      continue;
    }

    // readmeChecked means "we actually looked". Absence of evidence must never be
    // treated as evidence of irrelevance, otherwise unrelated READMEs fetch failures
    // permanently blacklist genuinely related repositories.
    let readme = '';
    let readmeChecked = false;
    if (readmeLeft > 0 && Number(item.size) > 0 && !item.archived && (item.description || '').length < 400) {
      readmeLeft -= 1;
      try {
        readme = await client.readme(item.full_name);
        readmeChecked = readme.length > 0;
      } catch {
        readme = '';
        readmeChecked = false;
      }
    }
    const evaluation = evaluateRepo(item, rules, { readme, readmeChecked });
    const record = {
      id: item.id,
      full_name: item.full_name,
      name: item.name,
      html_url: item.html_url,
      desc: item.description || '',
      stars: item.stargazers_count || 0,
      language: item.language || null,
      pushed_at: item.pushed_at || null,
      archived: !!item.archived,
      fork: !!item.fork,
      size: item.size,
      topics: item.topics || []
    };
    const evidence = ['github-search'];

    if (evaluation.verdict === 'excluded:archived') {
      if (autoExclude(registry, record, 'archived', { dryRun })) excluded += 1;
      continue;
    }
    if (evaluation.verdict === 'excluded:empty') {
      if (autoExclude(registry, record, 'empty repository', { dryRun })) excluded += 1;
      continue;
    }
    if (evaluation.verdict === 'excluded:name-collision') {
      if (autoExclude(registry, record, 'name collision only: no luotianyi signal in description/topics/readme', { dryRun })) excluded += 1;
      continue;
    }
    if (evaluation.verdict === 'excluded:aggregator') {
      // Guards against index repos: they name every project they list, so a keyword hit says
      // nothing about the repo's own subject.
      if (autoExclude(registry, record, 'aggregator: README indexes many unrelated repositories', { dryRun })) excluded += 1;
      continue;
    }
    if (evaluation.score < rules.thresholds.queue) continue;
    if (rules.owner_denylist && rules.owner_denylist.some((owner) => record.full_name.toLowerCase().startsWith(owner.toLowerCase() + '/'))) {
      if (autoExclude(registry, record, 'owner denylist', { dryRun })) excluded += 1;
      continue;
    }
    const out = enqueue(registry, rules, record, evaluation, { source: 'catalog', evidence: mergeEvidence(evidence, evaluation.signals) });
    if (out.created) queued += 1;
    results.push({ full_name: record.full_name, score: evaluation.score, signals: evaluation.signals }); 
  }

  if (!dryRun) {
    registry.state.watermark[watermarkKey] = nowIso().slice(0, 10);
    registry.state.lastRun = nowIso();
    saveRegistry(registry, { dryRun });
    saveState(registry, { dryRun });
    logChange(registry, { action: 'catalog-scan', scanned: seenMap.size, queued, excluded, updated, water: registry.state.watermark[watermarkKey] }, { dryRun });
  }

  console.log(JSON.stringify({
    dryRun,
    scanned: seenMap.size,
    processed,
    queued,
    excluded,
    updated,
    queueSize: registry.queue.entries.length,
    listed: registry.listed.entries.length,
    excludedTotal: registry.excluded.entries.length,
    requests: client.stats.requests,
    watermark: registry.state.watermark[watermarkKey],
    top: results.sort((a, b) => b.score - a.score).slice(0, 12)
  }, null, 2));
}

main().catch((err) => {
  console.error('[scan-catalog] failed: ' + err.message);
  process.exit(err.name === 'RateLimitError' ? 2 : 1);
});
