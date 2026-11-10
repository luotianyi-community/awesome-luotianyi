import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCommand, parseTitle } from '../scripts/triage-issue.mjs';

test('recognises the three decision commands', () => {
  assert.deepEqual(parseCommand('/approve live2d'), { action: 'approve', argument: 'live2d', target: null, reason: 'live2d' });
  const reject = parseCommand('/reject 这是一个通用框架，与洛天依无关');
  assert.equal(reject.action, 'reject');
  assert.equal(reject.argument, '这是一个通用框架，与洛天依无关');
  assert.equal(parseCommand('/exclude archived').action, 'exclude');
});

test('commands must start with a slash', () => {
  assert.equal(parseCommand('approve live2d'), null);
  assert.equal(parseCommand('请 /approve live2d'), null);
  assert.equal(parseCommand(''), null);
});

test('command matching is case insensitive and tolerates leading spaces', () => {
  assert.equal(parseCommand('   /APPROVE docs').action, 'approve');
  assert.equal(parseCommand('   /APPROVE docs').argument, 'docs');
});

test('unknown verbs are ignored', () => {
  assert.equal(parseCommand('/merge foo'), null);
  assert.equal(parseCommand('/approvex foo'), null);
});

test('candidate titles round-trip', () => {
  assert.equal(parseTitle('[candidate] alice/pet'), 'alice/pet');
  assert.equal(parseTitle('[candidate]  alice/pet  '), 'alice/pet');
  assert.equal(parseTitle('feat: something'), null);
  assert.equal(parseTitle('[candidate] no-slash'), null);
});

test('approve without a category falls back to an empty argument', () => {
  const parsed = parseCommand('/approve');
  assert.equal(parsed.action, 'approve');
  assert.equal(parsed.argument, '');
});

test('a command may name its repo, so the queue board can be one decision surface', () => {
  const approve = parseCommand('/approve alice/pet desktop-pet');
  assert.equal(approve.action, 'approve');
  assert.equal(approve.target, 'alice/pet');
  assert.equal(approve.argument, 'desktop-pet', 'category is the token after the repo');

  const reject = parseCommand('/reject alice/pet 与洛天依无关');
  assert.equal(reject.target, 'alice/pet');
  assert.equal(reject.reason, '与洛天依无关');

  assert.equal(parseCommand('/approve https://github.com/alice/pet live2d').target, 'alice/pet');
});

test('a plain command is never mistaken for a repo target', () => {
  assert.equal(parseCommand('/approve live2d').target, null);
  assert.equal(parseCommand('/reject 通用框架').target, null);
  assert.equal(parseCommand('/exclude archived').target, null);
});
