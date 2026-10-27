// Refresh build metadata using only the illustrations selected in the demo template.
// Reads the installed @ranx729/ducktape-assets index package (metadata only); no image bytes are downloaded.
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { createNodeResolver } from '@ranx729/ducktape-assets/node';

const require = createRequire(import.meta.url);
const { version } = require('@ranx729/ducktape-assets/package.json');
const root = new URL('../', import.meta.url);
const template = await readFile(new URL('src/template.html', root), 'utf8');

// Demo name -> library id. Names are the old medieval-ornaments names; all moved to medieval-cutouts unchanged.
const SET = 'medieval-cutouts';
// AVIF first, WebP last: the resolver's `file` is the last format (the <img> fallback), `files` carries both.
const assets = await createNodeResolver({ formats: ['avif', 'webp'] });
const fileRecord = file => ({
  source: file.url, path: file.path, width: file.width, height: file.height, bytes: file.bytes, sha256: file.sha256
});

const records = [];
for (const [tag, name] of template.matchAll(/<img\b[^>]*\bdata-illustration="([a-z0-9-]+)"[^>]*>/g)) {
  if (records.some(record => record.name === name)) throw new Error(`Duplicate illustration: ${name}`);
  const displayWidth = Number(tag.match(/\bwidth="(\d+)"/)?.[1]);
  if (!displayWidth) throw new Error(`Missing display width: ${name}`);
  const id = `${SET}/${name}`;
  const { asset, manifest } = await assets.get(id);
  const ratio = asset.height / asset.width;
  // With dpr 1 the resolver's `src` is the smallest rung at or above the requested pixel width, never upscaled.
  const resolved = await Promise.all([1, 2].map(pixelRatio =>
    assets.image(id, { width: displayWidth * pixelRatio, dpr: 1, placeholder: false })));
  records.push({
    name, id, description: asset.description, displayWidth,
    package: manifest.package, version: manifest.version,
    license: resolved[0].license.artwork,
    attribution: resolved[0].attribution,
    licenseNotes: resolved[0].license.notes,
    variants: resolved.map((image, index) => {
      const pixelRatio = index + 1;
      if (image.resolutionLimited) throw new Error(`Missing adequate raster: ${name} at ${pixelRatio}x`);
      const { file } = image;
      // The rung must keep the artwork's exact proportions (within rounding of one pixel).
      if (Math.abs(file.height - file.width * ratio) > 1) throw new Error(`Rung changes aspect ratio: ${file.path}`);
      if (file.format !== 'webp') throw new Error(`Fallback must be WebP: ${file.path}`);
      // The AVIF rung of the same width, when the set publishes one (about a third smaller); WebP stays the fallback.
      const avif = image.files.find(candidate => candidate.format === 'avif' && candidate.width === file.width);
      return { pixelRatio, ...fileRecord(file), ...(avif ? { avif: fileRecord(avif) } : {}) };
    })
  });
}
if (!records.length) throw new Error('No demo illustrations found');
await writeFile(new URL('demo-assets/illustrations/sources.json', root), JSON.stringify({
  runtime: { package: '@ranx729/ducktape-assets', version }, illustrations: records
}, null, 2) + '\n');
console.log(`Resolved ${records.length} demo illustrations; index metadata only, no downloads.`);
