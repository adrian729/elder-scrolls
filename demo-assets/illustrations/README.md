# Demo illustrations

Four illustrations (`medieval-cutouts/rabbit-reading-book`, `flying-pig`, `snail`, `weird-dog`) from the `medieval-cutouts` set of the Ducktape Assets library ([repository](https://github.com/adrian729/ducktape-assets-medieval-cutouts)), resolved with `@ranx729/ducktape-assets`. This directory contains only source metadata. See [sources.json](sources.json) for exact CDN URLs, index/package versions, paths, dimensions, descriptions, licence and attribution, byte counts, and SHA-256 hashes for the selected 128px and 256px WebP variants.

The linked demo emits ordinary `<img>` elements with version-pinned CDN `src`/`srcset` URLs and fixed display widths in `sizes`. Browsers choose the adequate variant for their display density: all four 128px files total 51,108 bytes, versus 162,908 bytes for the 256px files. The rabbit loads eagerly; the other illustrations use native lazy loading. No ornaments runtime, catalog or resource archive is shipped in the demo JavaScript or library distributions.

The single-file offline demo embeds only the four 256px files. Its first build downloads and verifies them against the recorded byte counts and SHA-256 hashes, then caches them under ignored `tmp/illustrations/`. Cached bytes are verified before reuse. `python3 build.py --offline` rejects missing/corrupt cache entries without network requests; run once without that flag to populate or repair the cache. `--illustration-cache <directory>` overrides the location. Linked builds never download artwork or need this cache; viewing them requires CDN access.

To refresh source metadata after changing selections, display widths or the runtime version:

```sh
npm ci
npm run demo:refresh
```

The refresh script reads `data-illustration` names and display widths from `src/template.html` (each name is an asset in `medieval-cutouts`) and asks the resolver of the installed `@ranx729/ducktape-assets` for the WebP file at each density: the smallest ladder width at or above `displayWidth × pixelRatio`, never upscaled, checked to keep the artwork's exact proportions. Nothing is downloaded: dimensions, byte counts and SHA-256 hashes come from the set manifest shipped in the index package, and the exact-version CDN URLs are built by the resolver. Review the generated `sources.json`; artwork is fetched only when viewed or embedded, and the offline build verifies it against the recorded hashes. Normal Python builds consume this committed metadata and need no npm install. The 128px and 256px rungs of the current ladder happen to match the display widths; if a width changes, a different rung may be selected.

These manuscript-style illustrations are demo content, separate from the generated parchment textures. They are excluded from the npm library. Elder Scrolls' MIT license does not apply to them.

**Licence and attribution.** The four illustrations are licensed [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/); the library records them as an imported set with the note "Origin unrecorded; attribution to adrian729. Removed on any rights claim." Attribution: **Illustrations by adrian729, from the Ducktape Assets `medieval-cutouts` set (CC-BY-4.0).** The same line is in the main README, and `sources.json` carries `license`, `attribution` and `licenseNotes` per illustration. If a rights claim arrives the library removes the artwork, and the demo must drop or replace these four.
