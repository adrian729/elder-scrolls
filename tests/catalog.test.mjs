import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { papers, families, createParchment } from '../lib/index.js';

test('all four paper families expose at least two choices', () => {
  assert.equal(families.length, 4);
  for (const family of families) assert.ok(papers.list({family:family.id}).length >= 2);
});
test('changing mode preserves the selected material and round trips', () => {
  for (const paper of papers.list({mode:'light'})) {
    const dark = papers.resolve({paper:paper.id,mode:'dark'});
    assert.equal(dark.counterpart, paper.id);
    assert.equal(papers.resolve({paper:dark.id,mode:'light'}).id, paper.id);
  }
  assert.equal(papers.resolve({paper:'ivory',mode:'dark',tone:'warm'}).id,'original-dark');
});
test('invalid selections fail clearly', () => {
  assert.throws(() => papers.get('missing'), /Unknown parchment/);
  assert.throws(() => papers.resolve({mode:'sepia'}), /Unknown paper mode/);
  assert.throws(() => createParchment(null), /HTML element/);
});
test('core imports without DOM globals', () => {
  assert.equal(typeof globalThis.document, 'undefined');
  assert.equal(typeof createParchment, 'function');
});

test('every paper has density copies, made from its current artwork', () => {
  const root = new URL('..', import.meta.url);
  const manifest = JSON.parse(readFileSync(new URL('src/densities.json', root), 'utf8'));
  for (const paper of papers.list()) {
    assert.ok(manifest[paper.atlas], paper.id + ' has no density copies: run scripts/build-densities.py');
    assert.deepEqual(paper.densities, [1, 2, 3]);
  }
  for (const [path, { sha256, variants }] of Object.entries(manifest)) {
    const current = createHash('sha256').update(readFileSync(new URL(path, root))).digest('hex');
    assert.equal(current, sha256, path + ' changed since its copies were made: run scripts/build-densities.py');
    for (const variant of Object.values(variants)) assert.ok(existsSync(new URL(variant, root)), variant + ' is missing');
  }
});
