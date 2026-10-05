# Changelog

## 0.1.2 — 2026-10-05

Mounting a parchment or table no longer forces the browser to recalculate styles or layout of the page around it. Appearance, responsive geometry, native HTML behavior, and the public API are unchanged.

- Read texture URLs from the loaded stylesheet once per document instead of probing computed styles on every mount. The unpainted probe remains the fallback for stylesheets that cannot be read, such as cross-origin ones.
- Take paper-ending geometry from the body's ResizeObserver reports and render it before paint. A sheet whose artwork is already decoded at mount still measures once, so `ready` keeps meaning complete geometry.

In a React/Vite application with two sheets per page (Chrome, 4× CPU throttling, median of six runs), main-thread time for a route change that remounts both sheets dropped from 301 ms to 239 ms, and for the initial page load from 668 ms to 626 ms. These are application timings, not INP or real-device measurements.

**Upgrade:** `npm install @ranx729/elder-scrolls@0.1.2`, then rebuild your application. No changes to JavaScript imports, React props, CSS imports, asset hosting, or renderer configuration are needed.

## 0.1.1 — 2026-10-03

Parchment updates now reuse existing SVG artwork instead of rebuilding decorations unnecessarily. Appearance, responsive geometry, native HTML behavior, and the public API are unchanged.

- Skip decoration work and artwork URL probes when options are unchanged.
- Retain roll caps across content growth and switches back from paper endings.
- Keep paper outlines during height changes; update the bottom texture phase to preserve alignment.
- Retain shadow pieces during content growth and refresh shadows once after ending/width changes.
- Add browser regression checks for retained nodes, shadow updates, and responsive geometry.
- Keep one lightweight preview with background, paper, ending, shadow, width, and content-length controls. Remove the experimental tile/Canvas renderers and comparison assets.

In the controlled comparison (Chrome, 4× CPU throttling, median of three runs), a batch of 40 unchanged updates dropped from 319.1 ms to 0.9 ms; ending, width, and theme update batches were approximately 23%, 17%, and 14% faster. The optimized artwork matched the original pixel-for-pixel in 40 screenshot comparisons. These are controller update timings, not INP or real-device FPS measurements. The isolated loading fixture already scored 100 in Lighthouse before and after; this release does not claim a loading-score improvement.

**Upgrade:** `npm install @ranx729/elder-scrolls@0.1.1`, then rebuild your application. No changes to JavaScript imports, React props, CSS imports, asset hosting, or renderer configuration are needed. No runtime dependencies or new image assets were added.
