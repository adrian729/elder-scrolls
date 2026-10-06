"""Build catalog and relative CSS asset declarations; no third-party dependencies."""
from pathlib import Path
import json
root = Path(__file__).resolve().parents[1]
papers = json.loads((root / 'src/themes.json').read_text())
backgrounds = json.loads((root / 'src/backgrounds.json').read_text())
# Lighter copies for each screen density up to the artwork's own (scripts/build-densities.py); the original serves denser screens.
densities = json.loads((root / 'src/densities.json').read_text())
variants = lambda path: densities.get(path, {}).get('variants', {})
for item in [*papers, *backgrounds]:
    item['densities'] = sorted(int(density) for density in variants(item.get('atlas') or item.get('image')))
source = (root / 'src/papers.js').read_text()
source = source.replace('export function createCatalog', 'function createCatalog')
source += '\nexport const papers = createCatalog(' + json.dumps(papers, ensure_ascii=False) + ');\n'
source += 'export const backgrounds = Object.freeze(' + json.dumps(backgrounds) + '.map(item => Object.freeze(item)));\n'
(root / 'lib/catalog.js').write_text('// Generated from src/themes.json and src/backgrounds.json.\n' + source)
css = ['/* Asset properties are declared here so native browsers resolve URLs against this stylesheet. */']
def declare(host, item_id, path):
    css.append('.' + host + ' > .es-asset-probe[data-es-asset="' + item_id + '"] { background-image:url("../' + path + '"); }')
    for density, variant in variants(path).items():
        css.append('.' + host + ' > .es-asset-probe[data-es-asset="' + item_id + '@' + density + 'x"] { background-image:url("../' + variant + '"); }')
for paper in papers:
    declare('es-parchment', paper['id'], paper['atlas'])
for item in backgrounds:
    if item['image']:
        declare('es-table', item['id'], item['image'])
(root / 'lib/assets.css').write_text('\n'.join(css) + '\n')
