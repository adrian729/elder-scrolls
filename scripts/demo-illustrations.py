"""Render selected CDN images, or embed verified cached artwork for offline HTML."""
import base64
import hashlib
import html
import re
import tempfile
from pathlib import Path
from urllib.error import URLError
from urllib.request import urlopen


def image_bytes(asset, cache, offline):
    cache_file = cache / (asset['sha256'] + '.webp')

    def valid(data):
        return len(data) == asset['bytes'] and hashlib.sha256(data).hexdigest() == asset['sha256']

    if cache_file.is_file():
        data = cache_file.read_bytes()
        if valid(data):
            return data
    if offline:
        raise ValueError('Missing or invalid illustration cache: ' + str(cache_file)
                         + '. Run the build once without --offline to populate it.')
    try:
        with urlopen(asset['source'], timeout=30) as response:
            data = response.read(asset['bytes'] + 1)
    except (URLError, TimeoutError) as error:
        raise ValueError('Could not fetch illustration: ' + asset['source']
                         + '. Populate the cache while connected before using --offline.') from error
    if not valid(data):
        raise ValueError('Illustration integrity mismatch: ' + asset['source'])
    cache.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(dir=cache, delete=False) as temporary:
        temporary.write(data)
        temporary_path = Path(temporary.name)
    temporary_path.replace(cache_file)
    return data


def render_illustrations(markup, records, *, linked, cache, offline=False):
    illustrations = {record['name']: record for record in records}
    if len(illustrations) != len(records):
        raise ValueError('Duplicate illustration source records')

    def render(match):
        tag, name = match.group(0), match.group(1)
        if name not in illustrations:
            raise ValueError('Missing illustration source: ' + name)
        record = illustrations[name]
        width = re.search(r'\bwidth="(\d+)"', tag)
        if not width or int(width.group(1)) != record['displayWidth']:
            raise ValueError('Illustration width changed; run npm run demo:refresh: ' + name)
        variants = record['variants']
        fallback = next(asset for asset in variants if asset['pixelRatio'] == 2)
        if linked:
            source = html.escape(fallback['source'], quote=True)
            candidates = ', '.join(html.escape(asset['source'], quote=True) + ' ' + str(asset['width']) + 'w'
                                   for asset in variants)
            attributes = f'src="{source}" srcset="{candidates}" sizes="{record["displayWidth"]}px"'
        else:
            data = image_bytes(fallback, cache, offline)
            attributes = 'src="data:image/webp;base64,' + base64.b64encode(data).decode() + '"'
        return tag.replace('data-illustration="' + name + '"', attributes)

    return re.sub(r'<img\b[^>]*\bdata-illustration="([a-z0-9-]+)"[^>]*>', render, markup)
