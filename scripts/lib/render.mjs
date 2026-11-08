import { MARKERS, replaceBlock } from './util.mjs';

const BT = String.fromCharCode(96);

function clean(text, limit) {
  const value = String(text || '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\|/g, '/')
    .replace(/[\[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const cut = limit || 150;
  if (value.length <= cut) return value;
  return value.slice(0, cut - 1).trimEnd() + '…';
}

function label(category, lang) {
  const name = lang === 'en' ? category.en : category.zh;
  return (category.emoji ? category.emoji + ' ' : '') + name;
}

export function categoryOrder(taxonomy) {
  const list = (taxonomy.categories || []).slice();
  list.sort((a, b) => Number(a.order || 0) - Number(b.order || 0) || String(a.id).localeCompare(String(b.id)));
  return list;
}

export function renderEntries(entries, taxonomy, lang) {
  const categories = categoryOrder(taxonomy);
  const known = new Set(categories.map((item) => item.id));
  const lines = [];
  const leftovers = entries.filter((entry) => !known.has(entry.category));
  for (const category of categories) {
    const items = entries
      .filter((entry) => entry.category === category.id)
      .sort((a, b) => (Number(b.stars || 0) - Number(a.stars || 0)) || String(a.full_name).localeCompare(String(b.full_name)));
    if (!items.length) continue;
    lines.push('### ' + label(category, lang) + ' (' + items.length + ')');
    lines.push('');
    for (const item of items) {
      const name = item.full_name || 'unknown';
      const meta = [];
      if (item.stars) meta.push('★' + item.stars);
      if (item.language) meta.push(item.language);
      if (item.archived) meta.push(lang === 'en' ? 'archived' : '已归档');
      const desc = clean(item.desc, 150);
      let line = '- [' + name + '](https://github.com/' + name + ')';
      if (meta.length) line += ' ' + BT + meta.join(' · ') + BT;
      if (desc) line += ' — ' + desc;
      lines.push(line);
    }
    lines.push('');
  }
  if (leftovers.length) {
    lines.push('### ' + (lang === 'en' ? 'Uncategorised' : '未分类') + ' (' + leftovers.length + ')');
    lines.push('');
    for (const item of leftovers) lines.push('- [' + item.full_name + '](https://github.com/' + item.full_name + ')');
    lines.push('');
  }
  if (!lines.length) {
    lines.push(lang === 'en' ? '_No entries yet — the catalog is being seeded._' : '_暂无条目 — 索引正在初始化。_');
    lines.push('');
  }
  return lines.join('\n');
}

export function renderStats(entries, taxonomy, lang) {
  const categories = categoryOrder(taxonomy);
  const total = entries.length;
  const byCategory = new Map();
  for (const entry of entries) byCategory.set(entry.category, (byCategory.get(entry.category) || 0) + 1);
  const languages = new Map();
  for (const entry of entries) {
    const key = entry.language || 'other';
    languages.set(key, (languages.get(key) || 0) + 1);
  }
  const topLanguages = Array.from(languages.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 6);
  let newest = '';
  for (const entry of entries) {
    const stamp = String(entry.pushed_at || '');
    if (stamp && stamp > newest) newest = stamp;
  }
  const day = newest ? newest.slice(0, 10) : '-';
  const activeCategories = categories.filter((category) => byCategory.get(category.id)).length;
  const lines = [];
  if (lang === 'en') {
    lines.push('**' + total + ' repositories · ' + activeCategories + ' categories · data updated ' + day + '**');
    lines.push('');
    lines.push('| Category | Repos |');
    lines.push('| --- | --- |');
  } else {
    lines.push('**' + total + ' 个仓库 · ' + activeCategories + ' 个分类 · 数据更新于 ' + day + '**');
    lines.push('');
    lines.push('| 分类 | 仓库数 |');
    lines.push('| --- | --- |');
  }
  for (const category of categories) {
    const count = byCategory.get(category.id) || 0;
    if (!count) continue;
    lines.push('| ' + label(category, lang) + ' | ' + count + ' |');
  }
  lines.push('');
  lines.push('**' + (lang === 'en' ? 'Primary languages' : '主要语言') + '**：' + topLanguages.map((item) => item[0] + ' (' + item[1] + ')').join(' · '));
  lines.push('');
  return lines.join('\n');
}

export function renderReadme(template, registry, lang) {
  const entries = registry.listed.entries;
  const withStats = replaceBlock(template, MARKERS.statsBegin, MARKERS.statsEnd, renderStats(entries, registry.taxonomy, lang));
  return replaceBlock(withStats, MARKERS.entriesBegin, MARKERS.entriesEnd, renderEntries(entries, registry.taxonomy, lang));
}
