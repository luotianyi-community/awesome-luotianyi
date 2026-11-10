import test from 'node:test';
import assert from 'node:assert/strict';
import { countHits, evaluateRepo, normalize, suggestCategory, loadRules, DEFAULT_RULES } from '../scripts/lib/match.mjs';
import { loadRegistry } from '../scripts/lib/registry.mjs';
import path from 'node:path';

const root = path.resolve('.');
const taxonomy = loadRegistry(root).taxonomy;

function repo(over) {
  return {
    id: 1,
    full_name: 'owner/repo',
    name: 'repo',
    description: '',
    topics: [],
    stargazers_count: 0,
    archived: false,
    fork: false,
    size: 100,
    ...over
  };
}

test('normalize folds width, case and separators', () => {
  assert.equal(normalize('Luo-Tian-Yi'), 'luo tian yi');
  assert.equal(normalize('洛天依'), '洛天依');
  assert.equal(normalize('LORU_ＬＴＹ'), 'loru lty');
});

test('countHits matches cjk and ascii terms', () => {
  const terms = ['洛天依', 'luotianyi'];
  assert.equal(countHits('这是洛天依相关项目', terms) >= 1, true);
  assert.equal(countHits('LuoTianyi desktop pet', terms) >= 1, true);
  assert.equal(countHits('unrelated repository', terms), 0);
});

test('ascii term does not match as substring of another word', () => {
  const terms = ['lty'];
  assert.equal(countHits('lty-lv2d-v3', terms), 1);
  assert.equal(countHits('faulty', terms), 0);
});

test('strong name match with an inspected unrelated readme is a name collision', () => {
  const result = evaluateRepo(
    repo({ full_name: 'LuoTianyi-arm64/printrgb', name: 'printrgb', description: 'print colorful text in the terminal', topics: [] }),
    DEFAULT_RULES,
    { readme: '# printrgb\nPrint ANSI coloured text in a terminal.', readmeChecked: true }
  );
  assert.equal(result.nameCollision, true);
  assert.equal(result.verdict, 'excluded:name-collision');
});

test('owner-only name match with an inspected unrelated readme is also a collision', () => {
  const result = evaluateRepo(
    repo({ full_name: 'Luotianyi-0712/cto', name: 'cto', description: 'OpenAI compatible proxy', topics: ['chat2api'] }),
    DEFAULT_RULES,
    { readme: '# cto\nAn OpenAI compatible proxy server.', readmeChecked: true }
  );
  assert.equal(result.verdict, 'excluded:name-collision');
});

test('absent evidence is not the same as negative evidence', () => {
  const unseen = evaluateRepo(
    repo({ full_name: 'luotianyi-community/mystery', name: 'mystery', description: '', topics: [] }),
    DEFAULT_RULES,
    {}
  );
  assert.equal(unseen.nameCollision, false, 'cannot call it a collision without looking');
  assert.notEqual(unseen.verdict, 'excluded:name-collision');
});

test('third-party api profile is excluded by denylist', () => {
  const rules = { ...DEFAULT_RULES, owner_denylist: ['api-evangelist'], weights: { ...DEFAULT_RULES.weights, owner_denylist: -60 } };
  const result = evaluateRepo(
    repo({ full_name: 'api-evangelist/luotianyi', name: 'luotianyi', owner: { login: 'api-evangelist' }, description: 'third party profile of an api surface', topics: ['company'] }),
    rules,
    {}
  );
  assert.equal(result.signals.includes('owner:denylist'), true);
  assert.ok(result.score < DEFAULT_RULES.thresholds.queue);
});

test('a moderately related repo is surfaced as an issue, not parked', () => {
  // The maintainer's rule: anything with real relevance becomes an issue instead of
  // sitting in a queue. This case scores under the old 55 line but clears 45.
  const result = evaluateRepo(
    repo({ full_name: 'Kotokowa/luotianyiPost', name: 'luotianyiPost', description: 'Luotianyi themed site', topics: [] }),
    DEFAULT_RULES,
    { readme: '洛天依 themed personal site', readmeChecked: true }
  );
  assert.ok(result.score >= DEFAULT_RULES.thresholds.issue);
  assert.equal(result.verdict, 'issue');
});

test('the core signal is recorded so downstream steps can gate on it', () => {
  const strong = evaluateRepo(
    repo({ full_name: 'a/b', name: 'b', description: '洛天依 tool', topics: [] }),
    DEFAULT_RULES,
    { readme: '洛天依', readmeChecked: true }
  );
  assert.equal(strong.signals.includes('core'), true);
  const vague = evaluateRepo(
    repo({ full_name: 'c/d', name: 'd', description: 'a vsinger project', topics: [] }),
    DEFAULT_RULES,
    { readme: 'a vsinger project', readmeChecked: true }
  );
  assert.equal(vague.signals.includes('core'), false);
});

test('url-only mention stays below issue threshold', () => {
  const result = evaluateRepo(
    repo({ full_name: 'SoraKasvgano/YaheiPHP7ProbeByLuminous', name: 'YaheiPHP7ProbeByLuminous', description: 'backup for yaheiphp7 probe by Luminous https://luotianyi.vc/1830.html', topics: [] }),
    DEFAULT_RULES,
    {}
  );
  assert.ok(result.score < DEFAULT_RULES.thresholds.issue);
});

test('clear luotianyi repository reaches issue threshold', () => {
  const result = evaluateRepo(
    repo({ full_name: 'SheepLiu712/Agent-LuoTianyi', name: 'Agent-LuoTianyi', description: '虚拟歌手洛天依智能对话Agent', topics: ['luotianyi', 'vocaloid'] }),
    DEFAULT_RULES,
    {}
  );
  assert.equal(result.verdict, 'issue');
  assert.ok(result.score >= DEFAULT_RULES.thresholds.issue);
});

test('a strong term in the repo name is evidence even without a README', () => {
  // Real case: LuoTianyi_GrubTheme ships only fonts and a screenshot, no textual README body.
  const result = evaluateRepo(
    repo({ full_name: 'Karunari-luoling/LuoTianYi_GrubTheme', name: 'LuoTianYi_GrubTheme', description: '', topics: [] }),
    DEFAULT_RULES,
    { readme: '效果图如下 ![](https://example.com/x.jpg)', readmeChecked: true }
  );
  assert.equal(result.verdict === 'queue' || result.verdict === 'issue', true, 'must stay reviewable, not excluded');
});

test('vsinger alone never opens an issue, only a queue slot', () => {
  // 浠Mizuki and Japan's ななし律歌 both call themselves "Vsinger" with no Luo Tianyi link.
  const result = evaluateRepo(
    repo({ full_name: 'Miyuki1215/Miyuki1215.githhub.io', name: 'Miyuki1215.githhub.io', description: 'All about Mizuki --who is a Vsinger', topics: [] }),
    DEFAULT_RULES,
    { readme: 'All about Mizuki --who is a Vsinger', readmeChecked: true }
  );
  assert.equal(result.coreHits, 0);
  assert.equal(result.verdict, 'queue');
});

test('an unambiguous term restores issue level', () => {
  const result = evaluateRepo(
    repo({ full_name: 'luo-tian-yi/lty_ver', name: 'lty_ver', description: '洛天依殿下包子铺ver2.0', topics: [] }),
    DEFAULT_RULES,
    { readme: '洛天依殿下包子铺ver2.0 live 2d文件', readmeChecked: true }
  );
  assert.ok(result.coreHits > 0);
  assert.equal(result.verdict, 'issue');
});

test('owner-only match is never auto-listed as a candidate', () => {
  const result = evaluateRepo(
    repo({ full_name: 'lty-vsinger/escape', name: 'escape', description: '', topics: [] }),
    DEFAULT_RULES,
    { readme: '# escape\nA small puzzle game.', readmeChecked: true }
  );
  assert.equal(result.verdict, 'excluded:name-collision');
});

test('archived and empty repositories are excluded', () => {
  assert.equal(evaluateRepo(repo({ archived: true, description: '洛天依' }), DEFAULT_RULES, {}).verdict, 'excluded:archived');
  assert.equal(evaluateRepo(repo({ size: 0, description: '洛天依桌宠' }), DEFAULT_RULES, {}).verdict, 'excluded:empty');
});

test('readme text contributes and can lift a weak candidate', () => {
  const base = repo({ full_name: 'someone/widget', name: 'widget', description: 'blog widget' });
  const without = evaluateRepo(base, DEFAULT_RULES, {});
  const withReadme = evaluateRepo(base, DEFAULT_RULES, { readme: '这是一个洛天依 live2d 看板娘插件，支持 LuoTianyi 模型', readmeChecked: true });
  assert.ok(withReadme.score > without.score);
  assert.equal(withReadme.contentHits > 0, true);
});

test('suggestCategory picks the best matching category', () => {
  assert.equal(suggestCategory({ name: 'lty-lv2d-v3', description: 'Live2D widget for blog', topics: [] }, taxonomy), 'live2d');
  assert.equal(suggestCategory({ name: 'gpt-sovits-luotianyi', description: 'GPT-SoVITS 声线模型', topics: [] }, taxonomy), 'tts-ai');
  assert.equal(suggestCategory({ name: 'unknown-thing', description: 'abc', topics: [] }, taxonomy), taxonomy.fallback);
});

test('rules loader merges partial overrides with defaults', () => {
  const merged = loadRules('/nonexistent/file.json');
  assert.equal(merged.thresholds.queue, DEFAULT_RULES.thresholds.queue);
  assert.equal(Array.isArray(merged.search_queries), true);
});
