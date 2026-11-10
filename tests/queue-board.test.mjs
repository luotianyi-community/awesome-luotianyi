import test from 'node:test';
import assert from 'node:assert/strict';
import { boardBody } from '../scripts/queue-board.mjs';

function registryWith(entries) {
  return {
    queue: { entries },
    taxonomy: { categories: [{ id: 'desktop-pet', zh: '桌面宠物' }, { id: 'data-tools', zh: '数据·知识库·工具链' }] }
  };
}

test('an empty queue says so instead of rendering an empty table', () => {
  const body = boardBody(registryWith([]));
  assert.match(body, /当前候选：0 个/);
  assert.match(body, /目前没有待审的候选/);
  assert.doesNotMatch(body, /\| 仓库 \|/);
});

test('candidates are listed with score, signals and a readable category', () => {
  const body = boardBody(registryWith([
    { full_name: 'a/pet', score: 40, signals: ['description:strong'], desc: '桌宠', category_suggestion: 'desktop-pet' }
  ]));
  assert.match(body, /当前候选：1 个/);
  assert.match(body, /\[a\/pet\]\(https:\/\/github\.com\/a\/pet\)/);
  assert.match(body, /桌面宠物/);
  assert.doesNotMatch(body, /desktop-pet \|/);
});

test('candidates are ordered by score so the strongest is on top', () => {
  const body = boardBody(registryWith([
    { full_name: 'low/x', score: 31, signals: [], desc: '', category_suggestion: 'data-tools' },
    { full_name: 'high/y', score: 44, signals: [], desc: '', category_suggestion: 'data-tools' }
  ]));
  assert.ok(body.indexOf('high/y') < body.indexOf('low/x'));
});

test('a pipe in a description cannot break the table', () => {
  const body = boardBody(registryWith([
    { full_name: 'a/b', score: 33, signals: [], desc: 'a | b', category_suggestion: 'data-tools' }
  ]));
  const row = body.split('\n').find((l) => l.includes('[a/b]'));
  assert.equal(row.split('|').length, 7, 'exactly five cells plus the two edge pipes');
});

test('the board carries its marker so it can be found and updated', () => {
  assert.match(boardBody(registryWith([])), /<!-- luotianyi-queue-board -->/);
});