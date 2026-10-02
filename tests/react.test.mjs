import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement as h } from 'react';
import { renderToString } from 'react-dom/server';
import { Parchment, TableSurface } from '../lib/react.js';

test('server render retains semantic content without accessing the DOM', () => {
  const html=renderToString(h(TableSurface,{surface:'walnut'}, h(Parchment,{paper:'rag-dark'}, h('article',null,h('h1',null,'Readable before hydration'),h('input',{defaultValue:'Preserved note'})))));
  assert.ok(html.includes('<article><h1>Readable before hydration</h1>'));
  assert.ok(html.includes('value="Preserved note"'));
  assert.ok(html.includes('class="mr-content"'));
  assert.ok(!html.includes('<image'));
});
