# Changelog

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
