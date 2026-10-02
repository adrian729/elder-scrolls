"""Build catalog and relative CSS asset declarations; no third-party dependencies."""
from pathlib import Path
import json
root = Path(__file__).resolve().parents[1]
papers = json.loads((root / 'src/themes.json').read_text())
backgrounds = json.loads((root / 'src/backgrounds.json').read_text())
source = (root / 'src/papers.js').read_text()
source = source.replace('export function createCatalog', 'function createCatalog')
source += '\nexport const papers = createCatalog(' + json.dumps(papers, ensure_ascii=False) + ');\n'
source += 'export const backgrounds = Object.freeze(' + json.dumps(backgrounds) + '.map(item => Object.freeze(item)));\n'
(root / 'lib/catalog.js').write_text('// Generated from src/themes.json and src/backgrounds.json.\n' + source)
css = ['/* Asset properties are declared here so native browsers resolve URLs against this stylesheet. */']
for paper in papers:
    css.append('.es-parchment > .es-asset-probe[data-es-asset="' + paper['id'] + '"] { background-image:url("../' + paper['atlas'] + '"); }')
for item in backgrounds:
    if item['image']:
        css.append('.es-table > .es-asset-probe[data-es-asset="' + item['id'] + '"] { background-image:url("../' + item['image'] + '"); }')
(root / 'lib/assets.css').write_text('\n'.join(css) + '\n')
