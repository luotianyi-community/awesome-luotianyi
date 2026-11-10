import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

test('validate rejects a queue entry that is already excluded', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'lty-'));
  fs.mkdirSync(path.join(root, 'data', 'entries'), { recursive: true });
  fs.mkdirSync(path.join(root, 'data', 'candidates'), { recursive: true });
  fs.mkdirSync(path.join(root, 'data', 'state'), { recursive: true });
  const repo = { full_name: 'a/b', id: 1 };
  fs.writeFileSync(path.join(root, 'data/entries/listed.json'), JSON.stringify({ entries: [] }));
  fs.writeFileSync(path.join(root, 'data/entries/excluded.json'), JSON.stringify({ entries: [{ ...repo, reason: 'nope' }] }));
  fs.writeFileSync(path.join(root, 'data/entries/rejected.json'), JSON.stringify({ entries: [] }));
  fs.writeFileSync(path.join(root, 'data/candidates/queue.json'), JSON.stringify({ entries: [{ ...repo, score: 40, signals: [] }] }));
  fs.writeFileSync(path.join(root, 'data/state/confidence.json'), JSON.stringify({}));
  // validate exits 1 on errors by design; read stdout rather than expecting success.
  let out = '';
  try {
    out = execFileSync(process.execPath, ['scripts/validate.mjs', '--root', root], { cwd: process.cwd(), encoding: 'utf8' });
  } catch (err) {
    out = String(err.stdout || '');
  }
  assert.match(out, /queue entry already excluded/);
});