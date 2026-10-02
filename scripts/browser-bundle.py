"""Bundle our small dependency-free ESM core as a classic browser script."""
from pathlib import Path
import re
root = Path(__file__).resolve().parents[1]
def bundle():
    chunks = []
    for name in ['catalog.js', 'renderer.js', 'endings.js', 'shadow.js', 'core.js']:
        source = (root / 'lib' / name).read_text()
        source = re.sub(r'^import .*?;\n', '', source, flags=re.M)
        source = re.sub(r'^export ', '', source, flags=re.M)
        chunks.append(source)
    return 'globalThis.ElderScrolls = (() => {\n' + '\n'.join(chunks) + '\nreturn Object.freeze({createParchment, createTableSurface, papers, backgrounds, families});\n})();\n'
if __name__ == '__main__':
    print(bundle(), end='')
