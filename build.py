"""Build the single current demo entry point; embed artwork by default."""
from pathlib import Path
import argparse
import base64
import json
import shutil
import re

parser = argparse.ArgumentParser()
parser.add_argument('--linked', action='store_true', help='Reference assets/ instead of embedding images')
parser.add_argument('--output', type=Path, help='Output HTML path (default: index.html next to build.py)')
args = parser.parse_args()

root = Path(__file__).resolve().parent
themes = json.loads((root / 'src/themes.json').read_text())
families = {'light': ('light', 'neutral'), 'burnt': ('light', 'warm'),
            'dark': ('dark', 'neutral'), 'dark-burnt': ('dark', 'warm')}
by_id = {theme['id']: theme for theme in themes}
if len(by_id) != len(themes):
    raise ValueError('Paper IDs must be unique')
for theme in themes:
    if families.get(theme['family']) != (theme['mode'], theme['tone']):
        raise ValueError('Inconsistent paper family: ' + theme['id'])
    partner = by_id.get(theme['counterpart'])
    if not partner or partner['counterpart'] != theme['id'] or partner['pair'] != theme['pair'] or partner['tone'] != theme['tone'] or partner['mode'] == theme['mode']:
        raise ValueError('Invalid light/dark counterpart: ' + theme['id'])
    if not all(key in theme['palette'] for key in ('surface', 'ink', 'muted', 'link')):
        raise ValueError('Incomplete paper palette: ' + theme['id'])
    if not (root / theme['atlas']).is_file():
        raise ValueError('Missing artwork: ' + theme['atlas'])
for family in families:
    if sum(theme['family'] == family for theme in themes) < 2:
        raise ValueError('Each paper family needs at least two options: ' + family)
template = (root / 'src/template.html').read_text()
shell = (root / 'src/shell.html').read_text()
fonts_css = (root / 'src/fonts.css').read_text()
def font_url(match):
    source = (root / 'src' / match.group(1)).resolve()
    if root / 'assets/fonts' not in source.parents or not source.is_file():
        raise ValueError('Missing or invalid font asset: ' + match.group(1))
    if args.linked:
        url = source.relative_to(root).as_posix()
    else:
        url = 'data:font/woff2;base64,' + base64.b64encode(source.read_bytes()).decode()
    return 'url("' + url + '")'
fonts_css = re.sub(r"url\(['\"]?([^)'\"]+)['\"]?\)", font_url, fonts_css)
shell = shell.replace('__FONTS_CSS__', fonts_css)

cache = {}
backgrounds = json.loads((root / 'src/backgrounds.json').read_text())
if len({item['id'] for item in backgrounds}) != len(backgrounds):
    raise ValueError('Background IDs must be unique')
for item in backgrounds:
    source = item.get('image')
    if source:
        if not (root / source).is_file():
            raise ValueError('Missing background: ' + source)
        if not args.linked:
            item['image'] = 'data:image/webp;base64,' + base64.b64encode((root / source).read_bytes()).decode()
for theme in themes:
    for key in ['atlas']:
        source = theme[key]
        if not args.linked:
            if source not in cache:
                cache[source] = 'data:image/webp;base64,' + base64.b64encode((root / source).read_bytes()).decode()
            theme[key] = cache[source]
markup = template.replace('__SCROLL_THEMES__', json.dumps(themes, ensure_ascii=False).replace('<', r'\u003c'))
markup = markup.replace('__SURFACE_JS__', (root / 'src/surface.js').read_text())
markup = markup.replace('__PAPERS_JS__', (root / 'src/papers.js').read_text())
markup = markup.replace('__ENDINGS_JS__', (root / 'src/endings.js').read_text())
markup = markup.replace('__SHADOW_JS__', (root / 'src/shadow.js').read_text())
markup = markup.replace('__BACKGROUND_DATA__', json.dumps(backgrounds, ensure_ascii=False).replace('<', r'\u003c'))
markup = markup.replace('__BACKGROUNDS_JS__', (root / 'src/backgrounds.js').read_text())
target = args.output.resolve() if args.output else root / 'index.html'
target.parent.mkdir(parents=True, exist_ok=True)
if args.linked and target.parent != root:
    shutil.copytree(root / 'assets', target.parent / 'assets', dirs_exist_ok=True)
target.write_text(shell.replace('<!--__SCROLL_PAGE__-->', markup))
print('Saved:', target)
