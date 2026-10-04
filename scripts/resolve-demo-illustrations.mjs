// Refresh build metadata using only the designs selected in the demo template.
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { getAssetSource } from '@ranx729/medieval-ornaments/resources';
const { version } = createRequire(import.meta.url)('@ranx729/medieval-ornaments/package.json');

const root = new URL('../', import.meta.url);
const template = await readFile(new URL('src/template.html', root), 'utf8');
const manifests = new Map();
const records = [];
const hash = bytes => createHash('sha256').update(bytes).digest('hex');

async function resourceManifest(source) {
  if (!manifests.has(source.id)) {
    const url = source.base + 'resource-manifest.json';
    const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (hash(bytes) !== source.manifestSha256) throw new Error(`Resource manifest integrity mismatch: ${url}`);
    const manifest = JSON.parse(bytes);
    if (manifest.package !== source.package || manifest.version !== source.version) {
      throw new Error(`Resource identity mismatch: ${url}`);
    }
    manifests.set(source.id, manifest);
  }
  return manifests.get(source.id);
}

for (const [tag, name] of template.matchAll(/<img\b[^>]*\bdata-illustration="([a-z0-9-]+)"[^>]*>/g)) {
  if (records.some(record => record.name === name)) throw new Error(`Duplicate illustration: ${name}`);
  const displayWidth = Number(tag.match(/\bwidth="(\d+)"/)?.[1]);
  if (!displayWidth) throw new Error(`Missing display width: ${name}`);
  const { ornament, resolveOrnament } = await import(`@ranx729/medieval-ornaments/designs/${name}`);
  const source = getAssetSource(name);
  const manifest = await resourceManifest(source);
  // The runtime's size is CSS height. Use the exact aspect ratio so a rounded
  // display height cannot accidentally select the next larger raster variant.
  const size = displayWidth * ornament.height / ornament.width;
  const variants = [1, 2].map(pixelRatio => {
    const { asset } = resolveOrnament('image', { size, pixelRatio, format: 'webp' });
    const file = manifest.files[asset.path];
    if (!file || asset.resolutionLimited) throw new Error(`Missing adequate raster: ${name} at ${pixelRatio}x`);
    return {
      pixelRatio, source: asset.url, path: asset.path,
      width: asset.width, height: asset.height, bytes: file.bytes, sha256: file.sha256
    };
  });
  records.push({
    name, description: ornament.description, displayWidth,
    package: source.package, version: source.version, variants
  });
}
if (!records.length) throw new Error('No demo illustrations found');
await writeFile(new URL('demo-assets/illustrations/sources.json', root), JSON.stringify({
  runtime: { package: '@ranx729/medieval-ornaments', version }, illustrations: records
}, null, 2) + '\n');
console.log(`Resolved ${records.length} demo illustrations; downloaded resource metadata only.`);
