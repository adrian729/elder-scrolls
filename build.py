"""Build the single current demo entry point; embed artwork by default."""
from pathlib import Path
import argparse
import base64
import json
import shutil
import re
import runpy

parser = argparse.ArgumentParser()
parser.add_argument('--linked', action='store_true', help='Reference assets/ instead of embedding images')
parser.add_argument('--output', type=Path, help='Output HTML path (default: index.html next to build.py)')
args = parser.parse_args()

root = Path(__file__).resolve().parent
runpy.run_path(str(root / 'scripts/build-library.py'))
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

backgrounds = json.loads((root / 'src/backgrounds.json').read_text())
if len({item['id'] for item in backgrounds}) != len(backgrounds):
    raise ValueError('Background IDs must be unique')
for item in backgrounds:
    if item.get('image') and not (root / item['image']).is_file():
        raise ValueError('Missing background: ' + item['image'])
bundle = runpy.run_path(str(root / 'scripts/browser-bundle.py'))['bundle']()
styles = (root / 'lib/styles.css').read_text().replace('@import "./assets.css";', (root / 'lib/assets.css').read_text())
def texture_url(match):
    source = root / match.group(1)
    if args.linked:
        url = source.relative_to(root).as_posix()
    else:
        url = 'data:image/webp;base64,' + base64.b64encode(source.read_bytes()).decode()
    return 'url("' + url + '")'
styles = re.sub(r'url\("\.\./([^"\)]+)"\)', texture_url, styles)
markup = '<style>\n' + styles + '\n</style>\n' + template
markup = markup.replace('__LIBRARY_JS__', bundle)
markup = markup.replace('__DEMO_JS__', (root / 'src/demo.js').read_text())
if not args.linked:
    def illustration_url(match):
        source = root / match.group(1)
        return 'src="data:image/webp;base64,' + base64.b64encode(source.read_bytes()).decode() + '"'
    markup = re.sub(r'src="(demo-assets/illustrations/[^"\s]+\.webp)"', illustration_url, markup)
target = args.output.resolve() if args.output else root / 'index.html'
target.parent.mkdir(parents=True, exist_ok=True)
if args.linked and target.parent != root:
    shutil.copytree(root / 'assets', target.parent / 'assets', dirs_exist_ok=True)
    shutil.copytree(root / 'demo-assets', target.parent / 'demo-assets', dirs_exist_ok=True)
target.write_text(shell.replace('<!--__SCROLL_PAGE__-->', markup))
print('Saved:', target)
if args.linked and target.parent != root:
    shutil.copytree(root / 'lib', target.parent / 'lib', dirs_exist_ok=True)
    shutil.copytree(root / 'examples/vanilla', target.parent / 'examples/vanilla', dirs_exist_ok=True)
    shutil.copytree(root / 'examples/performance', target.parent / 'examples/performance', dirs_exist_ok=True)
    runpy.run_path(str(root / 'scripts/build-browser.py'))
    if (root / 'dist/elder-scrolls-browser.zip').resolve() != (target.parent / 'elder-scrolls-browser.zip').resolve():
        shutil.copy2(root / 'dist/elder-scrolls-browser.zip', target.parent / 'elder-scrolls-browser.zip')
