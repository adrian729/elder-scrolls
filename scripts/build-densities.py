"""Smaller copies of the shipped artwork for lower screen densities. Needs Pillow and cwebp.

The originals in assets/ are never changed and keep serving the densest screens: paper atlases are
3x art (drawn at their scale of 1/3) and table images 2x art (twice their tile size). For every
density below an original's this writes <name>-<density>x.webp beside it, and src/densities.json
records each original's SHA-256, so a test notices an original that changed without its variants.
Run it after changing any artwork, then scripts/build-library.py.
"""
from pathlib import Path
import hashlib
import json
import subprocess
import tempfile

from PIL import Image

root = Path(__file__).resolve().parents[1]
papers = json.loads((root / 'src/themes.json').read_text())
backgrounds = json.loads((root / 'src/backgrounds.json').read_text())

sources = [(paper['atlas'], round(1 / paper['scale'])) for paper in papers]
for item in backgrounds:
    if item['image']:
        sources.append((item['image'], round(Image.open(root / item['image']).width / item['tileSize'])))

manifest = {}
for path, native in sources:
    original = root / path
    image = Image.open(original)
    image.load()
    variants = {}
    for density in range(1, native):
        size = (round(image.width * density / native), round(image.height * density / native))
        # Area averaging matches the browser's own downscaling at 1x; Lanczos keeps the grain at 2x.
        resized = image.resize(size, Image.BOX if density == 1 else Image.LANCZOS)
        target = original.with_name(f'{original.stem}-{density}x.webp')
        with tempfile.TemporaryDirectory() as tmp:
            png = Path(tmp) / 'variant.png'
            resized.save(png)
            subprocess.run(['cwebp', '-quiet', '-q', '92', '-alpha_q', '100', '-m', '6', '-exact', str(png), '-o', str(target)], check=True)
        variants[str(density)] = target.relative_to(root).as_posix()
    manifest[path] = {'sha256': hashlib.sha256(original.read_bytes()).hexdigest(), 'variants': variants}

(root / 'src/densities.json').write_text(json.dumps(manifest, indent=2) + '\n')
print(f'{sum(len(entry["variants"]) for entry in manifest.values())} variants for {len(manifest)} originals')
