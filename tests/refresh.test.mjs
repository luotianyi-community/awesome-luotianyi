import test from 'node:test';
import assert from 'node:assert/strict';
import { hasDesc, isBoilerplate } from '../scripts/refresh-metadata.mjs';

test('a curated short description counts as present', () => {
  // Regression: length was used as the proxy for "has a description", so this 11-char
  // summary counted as missing and was replaced by the README's first sentence.
  assert.equal(hasDesc({ desc: '洛天依百科：单页资料站' }), true);
  assert.equal(hasDesc({ desc: 'x' }), true);
});

test('empty, missing and whitespace descriptions count as absent', () => {
  assert.equal(hasDesc({}), false);
  assert.equal(hasDesc({ desc: '' }), false);
  assert.equal(hasDesc({ desc: '   ' }), false);
  assert.equal(hasDesc({ desc: null }), false);
});

test('github page boilerplate is not taken as a description', () => {
  assert.equal(isBoilerplate('You can use the editor on GitHub to maintain and preview the content for your website in Markdown files.'), true);
  assert.equal(isBoilerplate('This repository is a template.'), true);
  assert.equal(isBoilerplate('Initial commit'), true);
});

test('a real sentence is not mistaken for boilerplate', () => {
  assert.equal(isBoilerplate('洛天依主题的 Live2D 看板娘'), false);
  assert.equal(isBoilerplate('A curated index of repositories related to Luo Tianyi'), false);
});

test('an empty sentence is boilerplate', () => {
  assert.equal(isBoilerplate(''), true);
  assert.equal(isBoilerplate(null), true);
});