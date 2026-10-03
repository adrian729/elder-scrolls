# Isolated performance and responsive preview

From the repository root, run `python3 -m http.server 8000`, then open:

- [Interactive preview with walnut background](http://localhost:8000/examples/performance/?surface=walnut&width=900)
- [Isolated parchment on plain gray](http://localhost:8000/examples/performance/)
- [Long sheet without controls](http://localhost:8000/examples/performance/?length=60&controls=off)
- [Long paper endings without shadows](http://localhost:8000/examples/performance/?length=60&top=paper&bottom=paper&shadow=off&controls=off)

The same [preview is hosted on GitHub Pages](https://adrian729.github.io/elder-scrolls/examples/performance/?surface=walnut&width=900). It uses the shipped SVG renderer, system fonts, deterministic text, an editable input, and native document scrolling. No framework, custom fonts, or illustrations are involved. The original showcase and integration examples remain available.

The controls change background, paper, each ending, shadow visibility, maximum width, and content length without reloading or recreating your content. Select **Plain gray (isolated)** to measure parchment performance without a table texture. Numeric width settings are maximums: the sheet still fits smaller viewports. Resize the browser as well as changing the width control to check responsive layout.

Settings are saved in the URL:

| Parameter | Values |
| --- | --- |
| `surface` | `none` (default), `oak`, `walnut`, `marble`, `plain` |
| `paper` | Catalog paper ID, such as `ivory` or `rag-dark` |
| `top`, `bottom` | `roll` or `paper` |
| `shadow` | `on` or `off` |
| `width` | `320`, `480`, `640`, `900` (default), `1200`, `fluid` |
| `length` | 1–100 sections; default 4 |
| `controls` | `off` to hide controls before first paint |

Reload to measure initialization with those settings; use a fresh browser context for a cold cache. Earlier comparison URLs containing `renderer` still open this preview; only the shipped SVG renderer remains.

For automation, `window.fixture` exposes `controller`, `ready`, and `changeLength(count)`. `ready` waits for initial parchment and background initialization. The `fixture:mount-to-controller-ready` performance measure includes parchment artwork resolution/decode and synchronous initialization, but not module loading or background completion. It is **not time to visible paint**. Height changes use the library's ResizeObserver; await settling frames before screenshots or measurements. The fixture runs no continuous measurement loop.

Compare cold/warm mounting, content growth, width changes, theme changes, and scrolling separately. Test shadows and endings independently. Browser traces distinguish JavaScript, layout, paint, and raster work; Lighthouse assesses loading, while real interactions need their own latency measurements. Keep viewport, display density, throttling, and content consistent. Real-device measurements are needed for GPU and memory conclusions.

The renderer comparison is complete. The original baseline, prepared tiles, Canvas prototypes, generated images, and comparison scripts have been removed. The selected implementation and measured improvements are recorded in [the changelog](../../CHANGELOG.md); local investigation reports remain under `tmp/`, outside version control and the npm package.
