# Use Elder Scrolls in an application

Elder Scrolls decorates real HTML. Paper grain tiles at a fixed physical scale; content determines the height; the browser scrolls the document. No internal content scroller or font choice is imposed.

## Install

```sh
npm install @ranx729/elder-scrolls
```

For a checkout or a release not yet published, run `npm pack` in the library repository and install the resulting `.tgz` in your application. Consumers do not need Python; it is used only to build and package this repository.

```sh
npm install /path/to/ranx729-elder-scrolls-0.1.3.tgz
```

The core has no runtime dependencies. React is an optional peer dependency, required only by the `/react` entry point. Published code is ESM, with TypeScript declarations.

### Upgrading from 0.1.x to 0.1.3

Run `npm install @ranx729/elder-scrolls@0.1.3` and rebuild your application. No code migration is needed: JavaScript imports, React props, options, stylesheets, and asset paths are unchanged. The existing SVG renderer automatically reuses decorative nodes and skips unchanged updates, and mounting no longer forces style or layout recalculation. Responsive sizing, artwork, and native HTML content are preserved; no renderer selection or extra assets are required.

## Plain JavaScript with a bundler

```html
<article id="page">
  <h1>My page</h1>
  <p>Your normal, selectable HTML.</p>
</article>
```

```js
import { createParchment, createTableSurface } from '@ranx729/elder-scrolls';
import '@ranx729/elder-scrolls/styles.css';

const table = createTableSurface(document.body, { surface: 'walnut' });
const page = createParchment(document.getElementById('page'), {
  paper: 'ivory',
  top: 'roll',
  bottom: 'paper',
  maxWidth: 900,
  shadow: true
});

try {
  await Promise.all([page.ready, table.ready]);
} catch (error) {
  console.error('Artwork could not load', error);
}
```

The stylesheet must be loaded before mounting. The library moves existing children into its content slot once, keeping the same DOM nodes and their event listeners. Subsequent option changes never recreate your content.

```js
await page.update({ paper: 'ivory-dark', shadow: false });
await page.update({ top: 'paper', bottom: 'roll', maxWidth: 'fluid' });
await table.update({ surface: 'marble' });

// Add content through the content slot, or modify existing descendants.
const section = document.createElement('section');
section.textContent = 'More content';
page.content.append(section);

// On route teardown. Safe to call more than once.
page.destroy();
table.destroy();
```

`destroy()` disconnects observers, cancels layout callbacks, invalidates pending loads, and removes generated decorations. Vanilla parchment cleanup unwraps the *current* content, including additions, and restores the root attributes captured at mount. Do not remove the generated wrapper yourself before calling `destroy()`.

For content already owned by a framework, use its wrapper or a stable scaffold integration. Do not call the vanilla enhancer on a React-owned subtree: React should own the content structure.

## React

```jsx
import { Parchment, TableSurface } from '@ranx729/elder-scrolls/react';
import '@ranx729/elder-scrolls/styles.css';

export function ReadingPage() {
  return (
    <TableSurface surface="walnut" className="reading-table">
      <Parchment
        paper="ivory"
        top="roll"
        bottom="paper"
        maxWidth={900}
        shadow
        onError={error => console.error(error)}
      >
        <h1>My page</h1>
        <MyApplicationContent />
      </Parchment>
    </TableSurface>
  );
}
```

```css
.reading-table { min-height: 100vh; padding: 24px 8px; }
```

Both components accept normal `div` attributes, including `className`, `style`, `id`, and ARIA attributes. Their wrappers are neutral `div` elements, so your application can supply its own `main`, `article`, headings, and landmarks. The component's `onError` receives an artwork/setup error, rather than a DOM error event. `onReady` runs after a successful current artwork/options update; it does not wait for application fonts or every later content resize.

React retains ownership of the content and form state. Updating props changes the decoration. Unmounting releases the renderer; development Strict Mode's setup/cleanup/setup cycle is supported. No extra effects or renderer extraction are needed in your application.

The `/react` module has a `use client` directive. Imports and server rendering do not access the DOM; the server emits readable content with empty artwork slots, which are filled after hydration. Import the CSS through your framework's permitted stylesheet entry point. Vite client builds and React server-render/hydration behavior are covered by checks; this is not a claim of certification for every server framework.

## Plain HTML without npm or a bundler

Download the [browser ZIP](https://adrian729.github.io/elder-scrolls/elder-scrolls-browser.zip). Keep `lib/` and `assets/` in their supplied relative locations.

Native module version:

```html
<link rel="stylesheet" href="./lib/styles.css">
<article id="page"><h1>My page</h1><p>Normal HTML.</p></article>
<script type="module">
  import { createParchment } from './lib/index.js';
  const page = createParchment(document.getElementById('page'));
  page.ready.catch(console.error);
</script>
```

Serve the folder over HTTP, for example with `python3 -m http.server 8000`. Native module imports are restricted for `file://` documents.

A classic-script build is also included:

```html
<link rel="stylesheet" href="./lib/styles.css">
<article id="page"><h1>My page</h1><p>Normal HTML.</p></article>
<script src="./elder-scrolls.js"></script>
<script>
  const page = ElderScrolls.createParchment(document.getElementById('page'));
  page.ready.catch(console.error);
</script>
```

That build exposes the same core API through `ElderScrolls` and does not include React. The ZIP's `index.html` is a complete interactive plain-JavaScript example.

## Options and defaults

| Parchment option | Default | Accepted values |
| --- | --- | --- |
| `paper` | `ivory` | A paper ID from the catalog below |
| `top`, `bottom` | `roll` | `roll`, `paper`, independently |
| `maxWidth` | `900` | Positive number of CSS pixels, or `fluid` |
| `shadow` | `true` | Boolean |
| `assetsBase` | Automatic CSS URLs | Directory URL containing the texture files, with their `-1x`, `-2x` and `-3x` copies, under their original names |

A numeric width is a **maximum**: the sheet shrinks to its container. Grain, edges, and roll thickness retain their fixed size. Avoid applying CSS transforms to scale the complete parchment. Original rolled artwork stays matched to each paper; wooden knobs are not interchangeable.

Table options are `surface` (`walnut` by default; `oak`, `walnut`, `marble`, `plain`) and optional `assetsBase`. Tables are independent of parchments. They decorate only the supplied element and do not reset document margins or add their own scrolling container.

`update()` merges options with the previous request. Validate IDs and endings before applying a change; invalid options throw synchronously. Asset-loading failures reject the returned promise. `ready` holds the latest update promise. An update resolves `true` when applied or `false` when superseded/destroyed before application. Always handle loading rejections, including the initial `ready` promise. Failed loads can be retried; they do not permanently poison the asset cache.

## Preloading artwork

A sheet shows its paper once the artwork is decoded. When a sheet mounts later, for example a sidebar that appears on navigation, decode its artwork ahead of time so it appears fully painted:

```js
import { preloadArtwork } from '@ranx729/elder-scrolls';

preloadArtwork({ papers: ['ivory'], surfaces: ['walnut'] }).catch(console.error);
```

Sheets and tables mounted after it resolves apply the artwork within their mounting task, before the next frame. It shares the renderer's decode cache (capped at 32 URLs), accepts the same `assetsBase` as the components, and needs the stylesheet loaded first. Invalid IDs throw synchronously; loading failures reject.

## Choosing paper tones

| Family | Mode / tone | Papers |
| --- | --- | --- |
| Light | light / neutral | `ivory`, `sage` |
| Warm / burnt | light / warm | `original`, `rag` |
| Dark neutral | dark / neutral | `ivory-dark`, `sage-dark` |
| Dark warm / burnt | dark / warm | `original-dark`, `rag-dark` |

```js
import { papers, backgrounds, families } from '@ranx729/elder-scrolls';

const options = papers.list({ mode: 'dark', tone: 'warm' });
const darkIvory = papers.resolve({ paper: 'ivory', mode: 'dark' });
await page.update({ paper: darkIvory.id });
```

`resolve()` preserves the material pair when it exists in the requested mode/tone, otherwise chooses the first matching paper. Application preferences control mode; the library does not attach a system-mode listener automatically. Use your existing theme state to choose the paper.

## Styles and fonts

Geometry CSS is scoped to `.es-parchment`; it does not set application heading sizes, fonts, link styles, or justified alignment. Each instance exposes its matching palette:

```css
.my-parchment a { color: var(--es-link); }
.my-parchment .caption { color: var(--es-muted); }
.my-parchment { --es-content-gutter: 24px; --es-content-block-padding: 32px; }
```

The gutter is added to the fixed safe paper inset; it does not resize the artwork. Wide content such as tables or code blocks should have application-appropriate wrapping or local overflow behavior. Keep the parchment itself in normal document flow; do not fix its height or add an internal page scroller.

The demo's fonts are optional:

```js
import '@ranx729/elder-scrolls/typography.css';
```

Add `es-typography` to your parchment's `className` (React) or root `class` (vanilla). This opts into Junicode prose, Texturina headings, and EB Garamond caption/initial styles. Font licenses are bundled under `assets/fonts/`. Applications with their own typography do not need this import.

The demo's justified paragraphs and manuscript illustrations are demo content, not part of the renderer or npm package.

## Asset delivery

The package stylesheet declares relative texture URLs on hidden asset-probe selectors. Bundlers can copy/hash these files and rewrite their CSS URLs; the renderer reads the resolved URLs from the loaded stylesheet once per document, falling back to an unpainted CSS probe for stylesheets it cannot read. Only selected assets are preloaded and rendered. It does not fetch every paper merely because all paths are listed in CSS.

Each texture ships as its original plus lighter copies for every density up to its own (`-1x`, `-2x`, and `-3x` for papers); a screen loads the smallest copy that covers its `devicePixelRatio`, or the densest copy on a denser screen, where the original would add bytes but no detail. For custom hosting, copy all the WebP files, copies included, to your asset directory and supply `assetsBase`, for example `/my-app/textures/` or `https://cdn.example.com/textures/`. Preserve filenames. URLs may be relative to the document or absolute. No runtime dependency on GitHub or an external CDN is required.

Parchment atlases are 1254×1254 pixels (about 6 MiB decoded RGBA each). The table tiles are the same size. Switching through many materials may leave browser-cached artwork in memory; the library's shared decode-promise cache is capped at 32 URLs. Cleanup prevents later rendering but does not promise to cancel a browser image download already in progress.

The library uses one body ResizeObserver per parchment, whose reported sizes drive ending geometry without forced layout, and fixed-size SVG patterns. There are no scroll handlers. Shadows retain small local filter regions; the full long page is never blurred. The React adapter introduces no separate rendering engine.

## Examples and release checks

See [the runnable examples](https://github.com/adrian729/elder-scrolls/blob/main/examples/README.md). Repository development dependencies are separate from the dependency-free core.

```sh
npm ci
npm test
npm run test:types
npm run test:integration
npm run build
npm run build:browser
npm pack
```

Repository checks require Node 22.12+ or 24+; consumers need only a modern browser with SVG patterns, masks, and ResizeObserver. The browser integration checks require a Chromium executable (`google-chrome` by default; override with `CHROME_BIN`). They install the packed archive in an isolated temporary application, test plain JS, build the React/Vite consumer beneath a deployment subpath, and exercise development Strict Mode and hydration.
