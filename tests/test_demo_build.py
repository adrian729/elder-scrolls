"""Check selective artwork downloads, cache integrity and offline behavior."""
import base64
import hashlib
import io
import runpy
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

render = runpy.run_path(str(Path(__file__).resolve().parents[1] / 'scripts/demo-illustrations.py'))['render_illustrations']


class IllustrationBuildTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.cache = Path(self.directory.name) / 'cache'
        self.data = b'selected image bytes'
        self.digest = hashlib.sha256(self.data).hexdigest()
        self.records = [{
            'name': 'snail', 'displayWidth': 120, 'variants': [
                {'pixelRatio': 1, 'width': 128, 'source': 'https://example.test/snail-128.webp'},
                {'pixelRatio': 2, 'width': 256, 'source': 'https://example.test/snail-256.webp',
                 'bytes': len(self.data), 'sha256': self.digest}
            ]
        }]
        self.markup = '<img data-illustration="snail" width="120" height="60" loading="lazy" alt="">'

    def build(self, *, linked=False, offline=False):
        return render(self.markup, self.records, linked=linked, cache=self.cache, offline=offline)

    def test_linked_build_never_fetches_artwork(self):
        with patch.dict(render.__globals__, {'urlopen': unittest.mock.Mock(side_effect=AssertionError('Network request'))}):
            output = self.build(linked=True)
        self.assertIn('snail-128.webp 128w', output)
        self.assertIn('snail-256.webp 256w', output)
        self.assertIn('sizes="120px"', output)
        self.assertIn('loading="lazy"', output)
        self.assertNotIn('data-illustration', output)
        self.assertFalse(self.cache.exists())

    def test_downloads_only_selected_2x_image_then_rebuilds_offline(self):
        fetch = unittest.mock.Mock(return_value=io.BytesIO(self.data))
        with patch.dict(render.__globals__, {'urlopen': fetch}):
            initial = self.build()
        fetch.assert_called_once_with('https://example.test/snail-256.webp', timeout=30)
        self.assertIn(base64.b64encode(self.data).decode(), initial)
        self.assertNotIn('srcset', initial)
        with patch.dict(render.__globals__, {'urlopen': unittest.mock.Mock(side_effect=AssertionError('Network request'))}):
            self.assertEqual(initial, self.build(offline=True))
        self.assertEqual([self.digest + '.webp'], [file.name for file in self.cache.iterdir()])

    def test_offline_requires_valid_cache(self):
        with patch.dict(render.__globals__, {'urlopen': unittest.mock.Mock(side_effect=AssertionError('Network request'))}):
            with self.assertRaisesRegex(ValueError, 'Missing or invalid illustration cache'):
                self.build(offline=True)
            self.cache.mkdir()
            (self.cache / (self.digest + '.webp')).write_bytes(b'corrupted')
            with self.assertRaisesRegex(ValueError, 'Missing or invalid illustration cache'):
                self.build(offline=True)

    def test_rejects_corrupted_download_without_caching_it(self):
        with patch.dict(render.__globals__, {'urlopen': unittest.mock.Mock(return_value=io.BytesIO(b'wrong image'))}):
            with self.assertRaisesRegex(ValueError, 'integrity mismatch'):
                self.build()
        self.assertFalse(self.cache.exists())

    def test_changed_display_width_requires_refresh(self):
        self.markup = self.markup.replace('width="120"', 'width="128"')
        with self.assertRaisesRegex(ValueError, 'npm run demo:refresh'):
            self.build(linked=True)


if __name__ == '__main__':
    unittest.main()
