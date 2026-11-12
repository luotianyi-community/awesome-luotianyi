import fs from 'node:fs';
import path from 'node:path';

export function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    if (fallback !== undefined) return structuredClone(fallback);
    throw new Error('failed to read JSON ' + file + ': ' + err.message);
  }
}

export function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const text = JSON.stringify(value, null, 2) + '\n';
  fs.writeFileSync(file, text, 'utf8');
  return text;
}

export function appendJsonl(file, record) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.appendFileSync(file, JSON.stringify(record) + '\n', 'utf8');
}

export function readJsonl(file) {
  try {
    return fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((line) => JSON.parse(line));
  } catch {
    return [];
  }
}

export function nowIso() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
}

export function todayIso() {
  return nowIso().slice(0, 10);
}

// GitHub's `pushed:>DATE` and `committer-date:>DATE` compare against the date string,
// not the full timestamp: `pushed:>2026-11-10` excludes everything committed ON
// 2026-11-10. The watermark is written as the day the scan ran, so using it verbatim
// silently skipped that whole day -- Luo-Sandbox, pushed 2026-11-10T19:08, was never
// seen by the scan that ran on 2026-11-10. Rewinding one day is cheap (a handful of
// extra results) and makes the window inclusive.
export function rewindDay(date) {
  const stamp = String(date || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(stamp)) return stamp;
  const d = new Date(stamp + 'T00:00:00Z');
  if (Number.isNaN(d.getTime())) return stamp;
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const MARKERS = {
  entriesBegin: '<!-- BEGIN:ENTRIES -->',
  entriesEnd: '<!-- END:ENTRIES -->',
  statsBegin: '<!-- BEGIN:STATS -->',
  statsEnd: '<!-- END:STATS -->'
};

export function replaceBlock(source, begin, end, payload) {
  const start = source.indexOf(begin);
  const stop = source.indexOf(end);
  if (start === -1 || stop === -1 || stop < start) {
    throw new Error('missing markers: ' + begin + ' / ' + end);
  }
  return source.slice(0, start + begin.length) + '\n' + payload.replace(/^\n+/, '').replace(/\n+$/, '') + '\n' + source.slice(stop);
}

export function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token.startsWith('--')) {
      const key = token.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) {
        args[key] = true;
      } else {
        args[key] = next;
        i += 1;
      }
    } else {
      args._.push(token);
    }
  }
  return args;
}

export function repoRootFrom(url) {
  if (!url) return process.cwd();
  const file = url.startsWith('file:') ? new URL(url).pathname : url;
  return path.dirname(file);
}
