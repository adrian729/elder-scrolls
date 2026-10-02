# Elder Scrolls

Realistic parchment and scroll surfaces for ordinary web pages. Content stays selectable, accessible HTML, and the browser scrolls the entire document. The sheet grows with your content; its grain and rolls keep their physical size as the page width changes.

**[Live demo](https://adrian729.github.io/elder-scrolls/)** · **[Usage and implementation guide](docs/GUIDE.md)**

- Eight papers: two light, two warm/burnt, and matching neutral/warm dark families.
- Independent top and bottom choices: plain paper or the selected material's original roll.
- Aged oak, dark walnut, honed marble, or a plain background.
- Optional contact shadow, native page scrolling, and responsive width.
- Vanilla HTML/CSS/JavaScript, native SVG patterns, and WebP artwork. No runtime dependencies, canvas animation, or scroll handlers.

## Run locally

Requires Python 3; no packages need installing.

```sh
git clone https://github.com/adrian729/elder-scrolls.git
cd elder-scrolls
python3 build.py
```

Open the generated `index.html` in your browser. This default build embeds every texture and works offline as a single file.

For a smaller page with cacheable image files:

```sh
python3 build.py --linked
python3 -m http.server 8000
```

Visit `http://localhost:8000`. The linked demo initially requests only the selected paper and table texture. Try a particular combination with:

```text
?theme=rag-dark&width=900&length=12&top=default&bottom=paper&background=walnut&shadow=on
```

## Use it in your app

Follow [the application integration instructions](docs/GUIDE.md#integrating-real-content-into-an-application). They show the required HTML, renderer extraction, material selection, independent endings, shadow controls, and cleanup. The supplied `surface.js` initializes demo controls and placeholder content; copy its documented rendering function rather than loading the whole demo initializer over your application's content.

The current renderer supports one parchment instance per document. Fonts and application content are yours to style. All original rolled ends use complete matching artwork; wooden parts are not interchangeable between papers.

## Build and publish

```sh
python3 build.py --linked --output dist/index.html
```

This creates `dist/index.html` and copies its `assets/` directory. Serve or deploy that directory as a static site. The [GitHub Pages workflow](.github/workflows/pages.yml) builds and deploys it automatically on pushes to `main`; it can also be run manually. Generated HTML and build directories are ignored by Git. Commits provide history, so there are no `current/` or `prev/` folders.

## Project layout

```text
src/                    HTML/CSS, renderer, controllers, and material catalogs
assets/                 Eight paper atlases and three tabletop textures
docs/GUIDE.md           Usage, design decisions, performance, and integration
notes/                  Generation prompts and recorded verification
build.py                Standard-library-only static page builder
.github/workflows/      GitHub Pages deployment
```

## Performance and artwork

The renderer uses fixed-scale repeating textures and small local masks/shadow filters. One observer updates the ends after content or size changes; there is no JavaScript work during scrolling. The [guide](docs/GUIDE.md#verification-and-limits) records transfer sizes, decoded-image costs, Chromium checks, and limitations. These checks are not a real-device FPS benchmark or Firefox/Safari certification.

The included textures are AI-generated, encoded as WebP, and calibrated for this renderer. [Prompts and provenance](notes/README.md) are included; reference photographs and earlier prototype archives are not distributed.

## License

[MIT](LICENSE), covering the code, documentation, and included texture assets.
