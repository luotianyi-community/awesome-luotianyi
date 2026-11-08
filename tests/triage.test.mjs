import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCommand, parseTitle } from '../scripts/triage-issue.mjs';

test('recognises the three decision commands', () => {
  assert.deepEqual(parseCommand('/approve live2d'), { action: 'approve', argument: 'live2d', reason: 'live2d' });
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
