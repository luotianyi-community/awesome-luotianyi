import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from './lib/util.mjs';
import { loadRegistry, readmePath, saveRegistry } from './lib/registry.mjs';
import { renderReadme } from './lib/render.mjs';

function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = path.resolve(args.root || process.cwd());
  const registry = loadRegistry(root);
  const dryRun = !!args['dry-run'];
  const results = [];
  for (const lang of ['zh', 'en']) {
    const file = readmePath(root, lang);
    if (!fs.existsSync(file)) {
      results.push({ file: path.basename(file), status: 'missing-template' });
      continue;
    }
    const template = fs.readFileSync(file, 'utf8');
    const rendered = renderReadme(template, registry, lang);
    const changed = rendered !== template;
    if (changed && !dryRun) fs.writeFileSync(file, rendered, 'utf8');
    results.push({ file: path.basename(file), changed, entries: registry.listed.entries.length });
  }
  if (!dryRun) saveRegistry(registry, { dryRun: false });
  console.log(JSON.stringify({ dryRun, results }, null, 2));
}

main();
