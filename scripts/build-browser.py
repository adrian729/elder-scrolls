"""Create the downloadable browser distribution, with no npm or bundler needed."""
from pathlib import Path
import shutil, runpy, zipfile
root = Path(__file__).resolve().parents[1]
runpy.run_path(str(root / 'scripts/build-library.py'))
folder = root / 'dist/browser'
folder.mkdir(parents=True, exist_ok=True)
for name in ['lib', 'assets']:
    shutil.copytree(root / name, folder / name, dirs_exist_ok=True)
(folder / 'elder-scrolls.js').write_text(runpy.run_path(str(root / 'scripts/browser-bundle.py'))['bundle']())
html = (root / 'examples/vanilla/index.html').read_text().replace('../../lib/', './lib/')
(folder / 'index.html').write_text(html)
(folder / 'docs').mkdir(exist_ok=True)
shutil.copy2(root / 'docs/INTEGRATION.md', folder / 'docs/INTEGRATION.md')
for name in ['LICENSE', 'README.md']:
    shutil.copy2(root / name, folder / name)
archive = root / 'dist/elder-scrolls-browser.zip'
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as zipped:
    for file in sorted(folder.rglob('*')):
        if file.is_file(): zipped.write(file, Path('elder-scrolls-browser') / file.relative_to(folder))
print('Saved:', archive)
