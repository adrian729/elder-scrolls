import { papers, backgrounds } from './catalog.js';
import { renderSurface } from './renderer.js';
import { createEndings } from './endings.js';
import { createShadow } from './shadow.js';

const mounted = new WeakMap();
const decoded = new Map();
let sequence = 0;
const defaults = Object.freeze({ paper: 'ivory', top: 'roll', bottom: 'roll', maxWidth: 900, shadow: true });

function validate(options) {
  papers.get(options.paper);
  for (const side of ['top', 'bottom']) {
    if (!['roll', 'paper'].includes(options[side])) throw new TypeError(`Unknown ${side} ending: ${options[side]}`);
  }
  if (options.maxWidth !== 'fluid' && !(Number.isFinite(options.maxWidth) && options.maxWidth > 0)) {
    throw new TypeError('maxWidth must be a positive number or "fluid"');
  }
  if (typeof options.shadow !== 'boolean') throw new TypeError('shadow must be a boolean');
  if (options.assetsBase !== undefined && typeof options.assetsBase !== 'string') throw new TypeError('assetsBase must be a URL string');
  return options;
}

function elementCheck(element) {
  if (!element || element.nodeType !== 1 || !element.ownerDocument.defaultView) throw new TypeError('Expected a mounted HTML element');
  if (mounted.has(element)) throw new Error('This element already has an Elder Scrolls controller');
}

const unquote = quoted => quoted.startsWith('"') ? JSON.parse(quoted) : quoted.replace(/^'|'$/g, '');
const resolvedArtwork = new WeakMap();

// The asset rules as the loaded stylesheets declare them, after any bundler rewrote their URLs.
// Reading CSSOM rules never forces a style recalculation, unlike a computed-style probe while the
// application has just inserted a new page. Cross-origin sheets cannot be read; the probe covers them.
function stylesheetArtwork(document) {
  const urls = new Map();
  const visit = (rules, base) => {
    for (const rule of rules) {
      if (rule.styleSheet) {
        try { visit(rule.styleSheet.cssRules, rule.styleSheet.href ?? base); } catch { /* Unreadable import. */ }
        continue;
      }
      const id = rule.selectorText && /\.es-asset-probe\[data-es-asset="?([\w@-]+)"?\]/.exec(rule.selectorText)?.[1];
      const value = id && /^url\((.*)\)$/.exec(rule.style.backgroundImage)?.[1];
      if (value && !urls.has(id)) urls.set(id, new URL(unquote(value), base).href);
      if (rule.cssRules) visit(rule.cssRules, base);
    }
  };
  for (const sheet of document.styleSheets) {
    try { visit(sheet.cssRules, sheet.href ?? document.baseURI); } catch { /* Cross-origin stylesheet. */ }
  }
  return urls;
}

// The smallest copy made for this screen's pixel density (the catalog's `densities`, from
// scripts/build-densities.py), or the original artwork, which serves any denser screen. Each copy is
// declared in assets.css as "<id>@<density>x" beside its original.
function forScreen(element, id, path, densities = []) {
  const ratio = element.ownerDocument.defaultView?.devicePixelRatio || 1;
  const density = densities.find(candidate => candidate >= ratio);
  const filename = path.split('/').at(-1);
  return density ? [id + '@' + density + 'x', filename.replace(/\.webp$/, '-' + density + 'x.webp')] : [id, filename];
}

// CSS resolves relative asset URLs for native browsers and for bundlers. URLs are read once per
// document from the stylesheet; the hidden probe, which never paints a background, is the fallback.
function artwork(element, id, filename, assetsBase) {
  const document = element.ownerDocument;
  if (assetsBase !== undefined) {
    return new URL(filename, new URL(assetsBase.replace(/\/?$/, '/'), document.baseURI)).href;
  }
  let known = resolvedArtwork.get(document);
  if (!known?.has(id)) resolvedArtwork.set(document, known = new Map([...(known ?? []), ...stylesheetArtwork(document)]));
  if (known.has(id)) return known.get(id);
  const probe = document.createElement('span');
  probe.className = 'es-asset-probe';
  probe.dataset.esAsset = id;
  probe.style.display = 'none';
  // A preloading host is detached until the probe needs computed styles.
  const detached = !element.isConnected;
  if (detached) document.body.append(element);
  element.append(probe);
  const value = document.defaultView.getComputedStyle(probe).backgroundImage;
  probe.remove();
  if (detached) element.remove();
  const match = /^url\((.*)\)$/.exec(value);
  if (!match) throw new Error('Elder Scrolls artwork URL is missing. Load elder-scrolls/styles.css before mounting, or provide assetsBase.');
  const url = new URL(unquote(match[1]), document.baseURI).href;
  known.set(id, url);
  return url;
}

function preload(element, source) {
  if (!decoded.has(source)) {
    const image = new element.ownerDocument.defaultView.Image();
    image.src = source;
    const promise = image.decode().catch(error => { decoded.delete(source); throw error; });
    decoded.set(source, promise);
    if (decoded.size > 32) decoded.delete(decoded.keys().next().value);
  }
  return decoded.get(source);
}

/**
 * Fetch and decode artwork before any sheet or table needs it. Sheets and tables mounted afterwards
 * find it in the shared decode cache and apply it within their mounting task, before the next frame.
 * Invalid IDs throw synchronously; loading failures reject.
 */
export function preloadArtwork({ papers: paperIds = [], surfaces = [], assetsBase } = {}) {
  if (assetsBase !== undefined && typeof assetsBase !== 'string') throw new TypeError('assetsBase must be a URL string');
  const document = globalThis.document;
  const sources = [
    ...paperIds.map(id => ['es-parchment', id, papers.get(id).atlas, papers.get(id).densities]),
    ...surfaces.map(id => {
      const item = backgrounds.find(item => item.id === id);
      if (!item) throw new TypeError('Unknown table surface: ' + id);
      return ['es-table', id, item.image, item.densities];
    }),
  ].filter(([, , path]) => path);
  return Promise.all(sources.map(([kind, id, path, densities]) => {
    const host = document.createElement('div');
    host.className = kind;
    host.hidden = true;
    return preload(host, artwork(host, ...forScreen(host, id, path, densities), assetsBase));
  })).then(() => undefined);
}

function attributes(element) {
  const names = ['class', 'style', 'data-theme', 'data-mode', 'data-tone', 'data-family', 'data-shadow', 'data-top-ending', 'data-bottom-ending'];
  const original = names.map(name => [name, element.getAttribute(name)]);
  return () => {
    for (const [name, value] of original) value === null ? element.removeAttribute(name) : element.setAttribute(name, value);
  };
}

/** Internal attachment to a stable scaffold. React owns the content subtree. */
export function attachParchment(root, initial = {}) {
  elementCheck(root);
  let options = validate({ ...defaults, ...initial });
  const restore = attributes(root);
  const scroll = root.querySelector(':scope > .mr-scroll');
  if (!scroll || !scroll.querySelector('.mr-content')) throw new Error('Missing parchment scaffold');
  const prefix = `es-${++sequence}-`;
  root.classList.add('es-parchment');
  const endings = createEndings(root, { top: options.top === 'roll' ? 'default' : 'paper', bottom: options.bottom === 'roll' ? 'default' : 'paper' }, prefix);
  const shadow = createShadow(root, { enabled: options.shadow }, prefix);
  let request = 0, destroyed = false, active = null, applied = null;
  const originalBusy = scroll.getAttribute('aria-busy');
  const controller = {
    ready: null,
    update(patch = {}) {
      if (destroyed) return Promise.reject(new Error('Parchment controller has been destroyed'));
      const next = validate({ ...options, ...patch });
      options = next;
      const version = ++request;
      scroll.setAttribute('aria-busy', 'true');
      controller.ready = (async () => {
        try {
          const material = papers.get(next.paper);
          // Layout-only updates can reuse the resolved artwork URL. In
          // particular, avoid inserting a style probe on every content update.
          const source = active && applied.paper === next.paper && applied.assetsBase === next.assetsBase
            ? active.atlas : artwork(root, ...forScreen(root, next.paper, material.atlas, material.densities), next.assetsBase);
          await preload(root, source);
          if (destroyed || version !== request) return false;
          if (applied && ['paper', 'assetsBase', 'top', 'bottom', 'maxWidth', 'shadow'].every(key => applied[key] === next[key])) return true;
          if (!applied || applied.maxWidth !== next.maxWidth) root.style.setProperty('--mr-width', next.maxWidth === 'fluid' ? 'none' : next.maxWidth + 'px');
          const changed = !active || active.id !== material.id || active.atlas !== source;
          const theme = { ...material, atlas: source };
          if (changed) renderSurface(root, theme, prefix);
          endings.setOptions({ top: next.top === 'roll' ? 'default' : 'paper', bottom: next.bottom === 'roll' ? 'default' : 'paper' });
          shadow.setEnabled(next.shadow);
          // Endings publish the final geometry once. A shadow-only update has
          // no layout event, so refresh it explicitly in that case.
          const layoutChanged = changed ? endings.setPaper(theme) : endings.refresh();
          if (!layoutChanged) shadow.refresh();
          active = theme;
          applied = next;
          if (changed) root.dataset.theme = theme.id;
          return true;
        } catch (error) {
          if (destroyed || version !== request) return false;
          throw error;
        } finally {
          if (!destroyed && version === request) scroll.setAttribute('aria-busy', 'false');
        }
      })();
      return controller.ready;
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      request++;
      endings.destroy();
      shadow.destroy();
      for (const selector of ['.mr-definitions defs', '.mr-top', '.mr-bottom', '.mr-texture']) root.querySelector(selector).replaceChildren();
      for (const side of ['top', 'bottom']) delete root.querySelector('.mr-' + side).dataset.style;
      originalBusy === null ? scroll.removeAttribute('aria-busy') : scroll.setAttribute('aria-busy', originalBusy);
      restore();
      mounted.delete(root);
    }
  };
  mounted.set(root, controller);
  controller.update();
  return controller;
}

/** Enhance an element's existing children, preserving their DOM identity. */
export function createParchment(element, options = {}) {
  elementCheck(element);
  validate({ ...defaults, ...options });
  const document = element.ownerDocument;
  const scroll = document.createElement('div');
  scroll.className = 'mr-scroll';
  scroll.innerHTML = '<svg class="mr-definitions" width="0" height="0" aria-hidden="true" focusable="false"><defs></defs></svg><div class="mr-cap mr-top" aria-hidden="true"></div><div class="mr-body"><div class="mr-texture" aria-hidden="true"></div><div class="mr-content"></div></div><div class="mr-cap mr-bottom" aria-hidden="true"></div>';
  const content = scroll.querySelector('.mr-content');
  content.append(...element.childNodes);
  element.append(scroll);
  let controller;
  try { controller = attachParchment(element, options); }
  catch (error) { element.replaceChildren(...content.childNodes); throw error; }
  const release = controller.destroy;
  let destroyed = false;
  controller.content = content;
  controller.destroy = () => {
    if (destroyed) return;
    destroyed = true;
    release();
    element.replaceChildren(...content.childNodes);
  };
  return controller;
}

/** Decorate an explicit container, independently of any parchment. */
export function createTableSurface(element, initial = {}) {
  elementCheck(element);
  const restore = attributes(element);
  const oldSurface = element.getAttribute('data-surface');
  element.classList.add('es-table');
  let options = { surface: 'walnut', ...initial }, request = 0, destroyed = false;
  const controller = {
    ready: null,
    update(patch = {}) {
      if (destroyed) return Promise.reject(new Error('Table surface controller has been destroyed'));
      const next = { ...options, ...patch };
      const item = backgrounds.find(item => item.id === next.surface);
      if (!item) throw new TypeError('Unknown table surface: ' + next.surface);
      if (next.assetsBase !== undefined && typeof next.assetsBase !== 'string') throw new TypeError('assetsBase must be a URL string');
      options = next;
      const version = ++request;
      controller.ready = (async () => {
        try {
        let source;
        if (item.image) {
          source = artwork(element, ...forScreen(element, item.id, item.image, item.densities), next.assetsBase);
          await preload(element, source);
        }
        if (destroyed || version !== request) return false;
        element.style.setProperty('--es-table-color', item.color);
        element.style.setProperty('--es-table-image', source ? `url(${JSON.stringify(source)})` : 'none');
        element.style.setProperty('--es-table-size', source ? item.tileSize + 'px ' + item.tileSize + 'px' : 'auto');
        element.dataset.surface = item.id;
        return true;
        } catch (error) {
          if (destroyed || version !== request) return false;
          throw error;
        }
      })();
      return controller.ready;
    },
    destroy() {
      if (destroyed) return;
      destroyed = true; request++;
      restore();
      oldSurface === null ? element.removeAttribute('data-surface') : element.setAttribute('data-surface', oldSurface);
      mounted.delete(element);
    }
  };
  // Validate before registering, and undo initial styling on a sync failure.
  try { controller.update(); } catch (error) { restore(); throw error; }
  mounted.set(element, controller);
  return controller;
}
