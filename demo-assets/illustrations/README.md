# Demo illustrations

Four illustrations from [adrian729/medieval-ornaments](https://github.com/adrian729/medieval-ornaments), following its [resource migration guide](https://github.com/adrian729/medieval-ornaments/blob/main/docs/RESOURCE-MIGRATION.md). This directory contains only source metadata. See [sources.json](sources.json) for exact CDN URLs, runtime/resource versions, paths, dimensions, descriptions, byte counts, and SHA-256 hashes for the selected 128px and 256px WebP variants.

The linked demo emits ordinary `<img>` elements with version-pinned CDN `src`/`srcset` URLs and fixed display widths in `sizes`. Browsers choose the adequate variant for their display density: all four 128px files total 51,108 bytes, versus 162,908 bytes for the 256px files. The rabbit loads eagerly; the other illustrations use native lazy loading. No ornaments runtime, catalog or resource archive is shipped in the demo JavaScript or library distributions.

The single-file offline demo embeds only the four 256px files. Its first build downloads and verifies them against the recorded byte counts and SHA-256 hashes, then caches them under ignored `tmp/illustrations/`. Cached bytes are verified before reuse. `python3 build.py --offline` rejects missing/corrupt cache entries without network requests; run once without that flag to populate or repair the cache. `--illustration-cache <directory>` overrides the location. Linked builds never download artwork or need this cache; viewing them requires CDN access.

To refresh source metadata after changing selections, display widths or the runtime version:

```sh
npm ci
npm run demo:refresh
```

The refresh script reads `data-illustration` names and display widths from `src/template.html`, imports each design's individual resolver and uses `getAssetSource(name)` from `@ranx729/medieval-ornaments/resources`. It selects 1×/2× WebP variants using the exact image proportions and downloads only resource manifests, verifying their hashes against the runtime's pins. Review the generated `sources.json`; artwork is fetched only when viewed or embedded. Normal Python builds consume this committed metadata and need no npm install. Resource assignments can change, so packages are resolved per design rather than inferred from image type. Raw main-branch and public Pages image URLs are retired upstream.

These manuscript-style illustrations are demo content, separate from the generated parchment textures. They are excluded from the npm library. The source collection has no established blanket artwork license; Elder Scrolls' MIT license does not grant a separate license to these illustrations.
