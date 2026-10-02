'use client';
import { createElement as h, useEffect, useRef } from 'react';
import { attachParchment, createTableSurface } from './core.js';

// DOM access occurs only in effects. Server rendering emits stable content and
// empty artwork slots; hydration does not recreate the application's children.
export function Parchment({ children, paper = 'ivory', top = 'roll', bottom = 'roll', maxWidth = 900, shadow = true, assetsBase, onReady, onError, className = '', ...props }) {
  const root = useRef(null), instance = useRef(null), previous = useRef(null);
  const callbacks = useRef({ onReady, onError });
  callbacks.current = { onReady, onError };
  const options = { paper, top, bottom, maxWidth, shadow, assetsBase };
  function report(promise, live) {
    promise.then(applied => { if (live() && applied) callbacks.current.onReady?.(); })
      .catch(error => { if (live()) callbacks.current.onError ? callbacks.current.onError(error) : console.error(error); });
  }
  useEffect(() => {
    let live = true;
    try {
      instance.current = attachParchment(root.current, options);
      previous.current = options;
      report(instance.current.ready, () => live);
    }
    catch (error) { callbacks.current.onError ? callbacks.current.onError(error) : console.error(error); }
    return () => { live = false; instance.current?.destroy(); instance.current = null; };
  }, []);
  useEffect(() => {
    let live = true;
    if (instance.current && Object.keys(options).some(key => options[key] !== previous.current[key])) {
      previous.current = options;
      try { report(instance.current.update(options), () => live); }
      catch (error) { callbacks.current.onError ? callbacks.current.onError(error) : console.error(error); }
    }
    return () => { live = false; };
  }, [paper, top, bottom, maxWidth, shadow, assetsBase]);
  return h('div', { ...props, ref: root, className: 'es-parchment ' + className },
    h('div', { className: 'mr-scroll' },
      h('svg', { className: 'mr-definitions', width: 0, height: 0, 'aria-hidden': true, focusable: false }, h('defs')),
      h('div', { className: 'mr-cap mr-top', 'aria-hidden': true }),
      h('div', { className: 'mr-body' }, h('div', { className: 'mr-texture', 'aria-hidden': true }), h('div', { className: 'mr-content' }, children)),
      h('div', { className: 'mr-cap mr-bottom', 'aria-hidden': true })));
}

export function TableSurface({ children, surface = 'walnut', assetsBase, onReady, onError, className = '', ...props }) {
  const root = useRef(null), instance = useRef(null), previous = useRef(null);
  const callbacks = useRef({ onReady, onError });
  callbacks.current = { onReady, onError };
  useEffect(() => {
    let live = true;
    try {
      instance.current = createTableSurface(root.current, { surface, assetsBase });
      previous.current = { surface, assetsBase };
      instance.current.ready.then(applied => { if (live && applied) callbacks.current.onReady?.(); })
        .catch(error => { if (live) callbacks.current.onError ? callbacks.current.onError(error) : console.error(error); });
    }
    catch (error) { callbacks.current.onError ? callbacks.current.onError(error) : console.error(error); }
    return () => { live = false; instance.current?.destroy(); instance.current = null; };
  }, []);
  useEffect(() => {
    let live = true;
    if (instance.current && (surface !== previous.current.surface || assetsBase !== previous.current.assetsBase)) {
      previous.current = { surface, assetsBase };
      try {
        instance.current.update({ surface, assetsBase }).then(applied => { if (live && applied) callbacks.current.onReady?.(); })
          .catch(error => { if (live) callbacks.current.onError ? callbacks.current.onError(error) : console.error(error); });
      } catch (error) { callbacks.current.onError ? callbacks.current.onError(error) : console.error(error); }
    }
    return () => { live = false; };
  }, [surface, assetsBase]);
  return h('div', { ...props, ref: root, className: 'es-table ' + className }, children);
}
