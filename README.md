# Elder Scrolls

Realistic parchment and scroll surfaces for real HTML pages, plain JavaScript, and React. Content stays selectable and accessible. The browser scrolls the whole document; the sheet grows with your content, while grain and roll thickness keep their physical size.

**[Live demo](https://adrian729.github.io/elder-scrolls/)** · **[Integration guide](https://github.com/adrian729/elder-scrolls/blob/main/docs/INTEGRATION.md)** · **[Plain JS example](https://adrian729.github.io/elder-scrolls/examples/vanilla/)** · **[Browser ZIP](https://adrian729.github.io/elder-scrolls/elder-scrolls-browser.zip)**

- Eight papers across light, warm/burnt, and matching dark families.
- Independent original-roll or plain-paper endings at the top and bottom.
- Optional contact shadows and oak, walnut, marble, or plain table surfaces.
- Responsive width, unlimited content-driven height, multiple independent sheets.
- Dependency-free core; optional React wrapper and TypeScript declarations.
- Automatic texture URLs, no renderer extraction or manual crop adjustments.
- Optional artwork preloading, so sheets mounted later appear fully painted.

## Install

```sh
npm install @ranx729/elder-scrolls
```

When testing a checkout, run `npm pack` and install the resulting `.tgz` in your application. Upgrading from 0.1.x to 0.1.3 requires no application code changes; see the [changelog](https://github.com/adrian729/elder-scrolls/blob/main/CHANGELOG.md).

## Plain JavaScript

```js
import { createParchment, createTableSurface } from '@ranx729/elder-scrolls';
import '@ranx729/elder-scrolls/styles.css';

// #page contains your existing HTML.
const page = createParchment(document.getElementById('page'), {
  paper: 'ivory', top: 'roll', bottom: 'paper', maxWidth: 900
});
const table = createTableSurface(document.body, { surface: 'walnut' });
await Promise.all([page.ready, table.ready]); // Handle loading errors in your app.

await page.update({ paper: 'ivory-dark', shadow: false });
// On route teardown:
page.destroy();
table.destroy();
```

React is not required for the core. For plain HTML without npm or a bundler, use the [browser ZIP](https://adrian729.github.io/elder-scrolls/elder-scrolls-browser.zip), which includes native modules, a classic-script build, CSS, textures, and a working example.

## React

```jsx
import { Parchment, TableSurface } from '@ranx729/elder-scrolls/react';
import '@ranx729/elder-scrolls/styles.css';

<TableSurface surface="walnut">
  <Parchment paper="ivory" top="roll" bottom="paper" maxWidth={900}
    onError={error => console.error(error)}>
    <YourPageContent />
  </Parchment>
</TableSurface>
```

The wrapper handles prop changes and cleanup; React owns your content and form state. Add padding/min-height to the table container as appropriate for your layout. Fonts and content styles are yours; demo typography is an optional import.

See the [complete guide](https://github.com/adrian729/elder-scrolls/blob/main/docs/INTEGRATION.md) for options, asset hosting, paper-tone selection, cleanup, typography, server rendering, and both [runnable examples](https://github.com/adrian729/elder-scrolls/blob/main/examples/README.md).

## Run the demo locally

Requires Python 3, with no third-party packages:

```sh
git clone https://github.com/adrian729/elder-scrolls.git
cd elder-scrolls
python3 build.py
```

Open the generated `index.html`. This embeds textures, illustrations, and fonts into one offline HTML file. The first build downloads only four selected, version-pinned illustrations and verifies their hashes; subsequent builds reuse the ignored `tmp/illustrations/` cache. To require a build without network access, run `python3 build.py --offline` after populating that cache.

For cacheable local textures/fonts, CDN illustrations, and the plain-JS example:

```sh
python3 build.py --linked --output dist/index.html
python3 -m http.server 8000 --directory dist
```

Open <http://localhost:8000>. Defaults are **Ivory vellum · Medium content · Original rolls · Max 900px · Dark walnut**, with shadows enabled. Demo prose is justified, with manuscript cutouts including the weird dog. The [implementation guide](https://github.com/adrian729/elder-scrolls/blob/main/docs/GUIDE.md) explains the controls, URL parameters, geometry, decisions, and performance.

## Development and release

```sh
npm ci
npm test
npm run test:demo
npm run test:types
npm run test:integration
npm run build
npm run build:browser
npm pack
```

Integration checks use Chromium (`CHROME_BIN` overrides the executable), install a real package archive, and exercise vanilla HTML plus React development/production builds. React, Vite, TypeScript, and the medieval-ornaments resolver are development dependencies; vanilla consumers do not install them. Consumers do not need Python. Run `npm run demo:refresh` when upgrading medieval-ornaments or changing demo image selections/sizes; it updates the committed source metadata using the runtime's individual resolvers and verified resource manifests.

The GitHub Pages workflow builds the linked demo, native-JS example, and browser download. Generated files are ignored; Git commits provide history.

```text
lib/                    Core API, React adapter, geometry and optional typography
src/                    Demo, document shell, canonical paper/background manifests
assets/                 Runtime paper/table textures and optional licensed fonts
demo-assets/            Demo-only illustration source metadata; no image binaries
examples/               Plain JavaScript and React examples
docs/                   Integration and implementation guides
tests/                  Catalog, server render, types, and packaged browser checks
scripts/                Catalog, density-copy and browser-distribution builders
notes/                  Artwork prompts and verification records
build.py                Offline/linked demo builder
```

## Performance and artwork

Fixed-scale SVG patterns reuse WebP atlases. The originals are 3x art for papers and 2x for tables; each also ships lighter copies for every density up to its own, 1x, 2x and 3x for papers and 1x and 2x for tables (`scripts/build-densities.py`), and a screen loads the smallest one that covers its pixel ratio, or the densest on a denser screen; the originals stay as the source art. One observer per sheet updates layout after content/size changes; there are no scroll handlers. Shadows use local filter regions rather than filtering the long page. Linked applications request selected textures, and optional fonts only load when used.

Unchanged options skip decoration updates. Content growth retains cap and shadow SVG nodes, updating only texture alignment and shadow geometry. Ending and width changes refresh shadows after the final geometry is available. The [isolated preview](https://adrian729.github.io/elder-scrolls/examples/performance/?surface=walnut&width=900) lets you check backgrounds, widths, endings, and growing content without the showcase's fonts or illustrations.

[Performance details and verification limits](https://github.com/adrian729/elder-scrolls/blob/main/docs/GUIDE.md#verification-and-limits) distinguish transfer size, decoded images, and browser painting costs. Recorded Chromium checks are not a real-device FPS benchmark or Firefox/Safari certification.

Parchment/table textures are AI-generated; [prompts and provenance](https://github.com/adrian729/elder-scrolls/blob/main/notes/README.md) are included. Demo illustrations come from [medieval-ornaments](https://github.com/adrian729/medieval-ornaments) through version-pinned CDN URLs; [source records and licensing scope](https://github.com/adrian729/elder-scrolls/blob/main/demo-assets/illustrations/README.md) are separate. They are excluded from the npm package.

## License

[MIT](https://github.com/adrian729/elder-scrolls/blob/main/LICENSE) for code, documentation, and generated parchment/table texture assets. Fonts retain **SIL Open Font License 1.1**; see [font credits](https://github.com/adrian729/elder-scrolls/blob/main/assets/fonts/README.md). Demo cutouts retain their source's licensing status and are outside the MIT grant for generated textures.
