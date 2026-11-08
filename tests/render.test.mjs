import test from 'node:test';
import assert from 'node:assert/strict';
import { renderEntries, renderStats, renderReadme, categoryOrder } from '../scripts/lib/render.mjs';

const BT = String.fromCharCode(96);

const taxonomy = {
  categories: [
    { id: 'desktop-pet', zh: '桌面宠物', en: 'Desktop Pets', emoji: '🐱', order: 1 },
    { id: 'live2d', zh: 'Live2D', en: 'Live2D', emoji: '🎭', order: 2 },
    { id: 'docs', zh: '教程与文档', en: 'Docs', emoji: '📚', order: 3 }
  ],
  fallback: 'desktop-pet'
};

function entry(over) {
  return {
    id: 1,
    full_name: 'alice/pet',
    desc: '一个洛天依桌宠',
    stars: 10,
    language: 'TypeScript',
    pushed_at: '2026-01-05T00:00:00Z',
    category: 'desktop-pet',
    ...over
  };
}

test('entries render under their category, sorted by stars desc', () => {
  const out = renderEntries([entry({ stars: 5, full_name: 'b/five' }), entry({ id: 2, stars: 50, full_name: 'a/fifty' })], taxonomy, 'zh');
  assert.match(out, /### 🐱 桌面宠物 \(2\)/);
  const aIndex = out.indexOf('[a/fifty]');
  const bIndex = out.indexOf('[b/five]');
  assert.ok(aIndex > 0 && aIndex < bIndex, 'higher stars first');
});

test('empty category sections are skipped and empty list falls back to placeholder', () => {
  const out = renderEntries([entry()], taxonomy, 'zh');
  assert.equal(out.includes('### 🎭 Live2D'), false);
  const empty = renderEntries([], taxonomy, 'zh');
  assert.match(empty, /暂无条目/);
});

test('descriptions are flattened, escapes pipes and truncated', () => {
  const long = 'x'.repeat(400);
  const out = renderEntries([entry({ desc: 'line1\nline2 | pipe [bracket] ' + long })], taxonomy, 'zh');
  assert.equal(out.includes('\n- ['), true);
  const line = out.split('\n').find((item) => item.startsWith('- [alice/pet]'));
  assert.equal(line.includes('|'), false);
  assert.equal(line.includes('line1 line2'), true);
  assert.ok(line.length < 260);
  assert.ok(line.includes('…'));
});

test('unknown category entries are collected in an uncategorised section', () => {
  const out = renderEntries([entry({ category: 'ghost' })], taxonomy, 'zh');
  assert.match(out, /### 未分类 \(1\)/);
});

test('stats block reports totals and per-category counts', () => {
  const stats = renderStats([entry(), entry({ id: 2, category: 'live2d' })], taxonomy, 'zh');
  assert.match(stats, /2 个仓库/);
  assert.match(stats, /\| 🐱 桌面宠物 \| 1 \|/);
  assert.match(stats, /数据更新于 2026-01-05/);
});

test('renderReadme only replaces marker blocks and is deterministic', () => {
  const template = '# Title\n\n<!-- BEGIN:STATS -->\nold\n<!-- END:STATS -->\n\ntext\n\n<!-- BEGIN:ENTRIES -->\nold\n<!-- END:ENTRIES -->\n\nfooter\n';
  const registry = { listed: { entries: [entry()] }, taxonomy };
  const once = renderReadme(template, registry, 'zh');
  const twice = renderReadme(once, registry, 'zh');
  assert.equal(once, twice, 'idempotent');
  assert.equal(once.includes('text'), true);
  assert.equal(once.includes('footer'), true);
  assert.equal(once.includes('old'), false);
  assert.ok(once.indexOf('<!-- BEGIN:ENTRIES -->') > once.indexOf('<!-- END:STATS -->'));
});

test('category order follows the order field', () => {
  const order = categoryOrder({ categories: [{ id: 'b', order: 2 }, { id: 'a', order: 1 }] });
  assert.deepEqual(order.map((item) => item.id), ['a', 'b']);
});

test('rendered entry lines use single backticks for metadata', () => {
  const out = renderEntries([entry()], taxonomy, 'zh');
  assert.ok(out.includes(BT + '★10 · TypeScript' + BT));
});
