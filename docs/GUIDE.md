# Elder Scrolls usage and implementation guide

Try the [live demo](https://adrian729.github.io/elder-scrolls/), or build `index.html` locally for the offline demo. It starts with Ivory vellum, Medium content (five sections), original rolls at both ends, and a responsive 900px maximum page width. Choose top and bottom independently from **Original roll** and **Paper**, for any of the eight papers. It opens on dark walnut; **Surface beneath paper** offers aged oak, dark walnut, honed marble, or a plain background independently of the paper. Content uses normal HTML and browser document scrolling.

This is the main guide for the implementation. Start with [using the demo](#using-the-demo), then [building](#build-and-extend) or the [application integration guide](INTEGRATION.md). The historical [plan](../notes/responsive-texture-plan.md), [generation prompts](../notes/tiled-art-prompts.json), [functional checks](../notes/tiled-verification.json), and [long-page check](../notes/tiled-stress.json) provide supporting detail.

All eight photographic atlases remain unchanged. Original rolls retain their complete matching artwork. The new `lib/endings.js` module replaces a whole cap with a shaped continuation of the selected paper. It does not split or recombine wooden parts. See [paper-ending checks](../notes/paper-endings-verification.json) for this revision; older restoration notes describe the preserved baseline.

## Using the demo

1. Open the [live demo](https://adrian729.github.io/elder-scrolls/) in a modern browser, or open your locally built `index.html`. The default embedded build works offline and does not fetch fonts, libraries, or artwork from a service; fonts and artwork are embedded.
2. Select **Paper tone** to choose a paper within one of the four families. Its texture and suggested text palette change together; your selected top/bottom styles stay selected.
3. The default **Page width** is **Max · 900 px**, which shrinks to fit smaller windows. Select **Fluid · fit window** to fill a wider window. All numeric options are maximum widths, not fixed widths.
4. Select **Short**, **Medium**, or **Long** to display 1, 5, or 12 placeholder sections. **Add content** appends a section; **Go to bottom** scrolls the browser document to the footer. Resizing the window reflows content and exposes more or less texture without enlarging its grain or rolls.
5. Choose **Surface beneath paper** independently of the paper and its end choices. Choose **Max 900 px** or **Max 1100 px** if you want to see a wider area of the tabletop on a large display; fluid width is unchanged.
6. Toggle **Contact shadow** to compare the paper sitting on the surface with the original unshadowed rendering. The toggle does not change layout or paper color.
7. Choose **Top ending** and **Bottom ending** independently. Paper is a flat sheet edge. Original roll restores that paper’s original cap, including its original wood where applicable.

You can open a particular combination with URL parameters:

```text
index.html?theme=rag&width=900&length=12&top=default&bottom=paper&background=walnut
```

| Parameter | Accepted values | Default |
| --- | --- | --- |
| `theme` | `ivory`, `sage`, `original`, `rag`, and each corresponding `-dark` ID | `ivory` when no mode/tone selection is supplied |
| `mode` | `light`, `dark`, `auto` | Unset; explicit `theme` takes priority |
| `tone` | `neutral`, `warm` | `neutral` when resolving by mode/tone |
| `width` | `fluid`, `640`, `900`, `1100` | `900` |
| `length` | `1`, `5`, `12` | `5` |
| `top` | `default`, `paper` | `default` |
| `bottom` | `default`, `paper` | `default` |
| `background` | `oak`, `walnut`, `marble`, `plain` | `walnut` |
| `shadow` | `on`, `off` | `on` |

Unrecognized parameter values are ignored. An explicit valid `theme` takes priority over `mode` and `tone`. With no explicit theme, `mode=auto` follows `prefers-color-scheme` and responds to system-mode changes; choosing a paper manually stops that automatic following for this visit. Toolbar changes are not saved to the URL or local storage; reloading restores the URL's selection or the defaults. The `#mr-end` anchor points to the footer, while `#mr-start` points to the beginning of the scroll. The bottom decoration follows the footer in normal document flow.

For example, `index.html?mode=dark&tone=warm` opens burnt umber; `index.html?mode=auto&tone=warm` chooses its light or dark counterpart according to the system. The default within each family is its first manifest entry. A direct `theme=rag-dark` selects toasted linen specifically.

## Paper families and choosing a tone

The families describe **paper color**, independently of the end-design metadata:

| Family ID | Mode / tone | Paper options |
| --- | --- | --- |
| `light` | `light` / `neutral` | `ivory` — ivory vellum; `sage` — cool vellum |
| `burnt` | `light` / `warm` | `original` — aged parchment; `rag` — warm linen rag |
| `dark` | `dark` / `neutral` | `ivory-dark` — slate vellum; `sage-dark` — smoke vellum |
| `dark-burnt` | `dark` / `warm` | `original-dark` — burnt umber; `rag-dark` — toasted linen rag |

“Burnt” describes the warm color family; it does not add charred holes or glowing edges. The dark papers are separate generated photographic assets, not runtime inversion, brightness filters, or tinted overlays. Their folds and fibers retain physical shading. End geometry/design is retained from each light partner; the paper on the rolls is recolored to match the body. A dark counterpart is an art-directed adaptation and is not pixel-identical to its light partner.

`src/themes.json` is the catalog. Each entry carries `mode`, `tone`, `family`, `pair`, `counterpart`, and `ends`. For example, `rag` and `rag-dark` share `pair: "rag"` and `ends: "walnut-round"`. `palette` supplies suggested `surface`, `ink`, `muted`, and `link` colors. The renderer applies these as `--mr-surface`, `--mr-ink`, `--mr-muted`, and `--mr-link`; it sets `--mr-scheme` and the root's `data-mode`, `data-tone`, and `data-family` attributes too. The demo uses the Polyhymnia font roles described below; applications can replace those typography rules independently. The colors are starting points for the preview, not a contrast certification for every textured pixel or for your final UI.

The library exports the catalog directly:

```js
import { papers } from '@ranx729/elder-scrolls';
papers.list({ family: 'dark-burnt' });
papers.resolve({ paper: 'rag', mode: 'dark' }); // rag-dark
```

`resolve()` preserves the material pair when possible; otherwise it chooses the first matching entry. It does not load artwork or change the page. Use `page.update({paper: chosen.id})` in vanilla JavaScript, or pass the ID as the React component's `paper` prop. See [choosing paper tones](INTEGRATION.md#choosing-paper-tones) for the complete API. System-mode following is demo behavior; applications should use their existing theme state.

## Demo typography

The example uses the same font roles, Junicode alternates, and raised illuminated capital as [Polyhymnia](https://github.com/adrian729/app):

| Role | Font | Demo use |
| --- | --- | --- |
| Body/UI | Junicode VF | Prose, labels, controls, footer; the app's character variants are applied here only. |
| Display | Texturina Variable | Page `h1` and section `h2`; automatic optical sizing, weight 600. |
| Specimen | EB Garamond Variable | Letter-spaced small-cap caption. |
| Initial | EB Garamond Initials Fill1 / Fill2 | Two stacked glyphs on the title baseline, with blue frame and red letter. |
| Data | JetBrains Mono Variable | `code` / `pre`, if supplied; not downloaded by the default prose-only example. |

`src/fonts.css` defines self-hosted faces, with the app's Unicode ranges and `font-display: swap`. Font declarations are embedded by the builder. The linked version points to `assets/fonts/`; the offline build embeds all WOFF2 files as data URLs, so it remains a single file. The app's full Junicode Roman/Italic files and published normal Fontsource subsets are copied unchanged. The font binaries total **2,716,328 bytes**; unused subsets/faces are not fetched by the linked demo. The offline HTML therefore grows by approximately 4/3 of that size. No font service, runtime package, or network request is required to build.

The title's frame is `aria-hidden` and excluded from selection; its letter is real text. Use the initial layers only for uppercase A–Z, the range carried by the app's subset; leave other leading characters in Texturina. Junicode alternates are reset for headings, small caps, initials, and mono. The initial colors follow the selected paper's light/dark mode. Text fills the available width inside the responsive paper margins and reflows as the parchment grows or shrinks. There is no fixed-width centered text column; choosing a page-width maximum also limits the text width. Font sizes remain legible rather than scaling with the sheet.

Typography is optional application styling. Import `@ranx729/elder-scrolls/typography.css` and add `es-typography` to the parchment root to opt into the supplied font roles. The CSS file's font URLs resolve relative to that CSS file; built inline URLs resolve relative to the HTML. To replace it, change the `--mr-font-*` tokens and remove the decorative initial markup/rules as desired; the paper renderer has no font-family dependency. Keep the body ResizeObserver so late font loading can update the endings and shadow.

Demo prose uses justified alignment with automatic hyphenation and a start-aligned final line. Decorative cutouts from [medieval-cutouts](https://github.com/adrian729/medieval-cutouts) appear in the introduction, notes, and closing ornament; the weird dog remains in the footer for every content length. Illustrations use small lossless WebP files, transparent backgrounds, explicit dimensions, and responsive positioning. They are demo content, excluded from the npm library. See [illustration sources](../demo-assets/illustrations/README.md).

All font software retains **SIL Open Font License 1.1**, separately from this project's MIT code/artwork license. [Font credits](../assets/fonts/README.md) link to each bundled license text.

## Width and height are independent

The main scroll fills available width, with optional 640/900/1100px maximum widths. Its material is no longer scaled to that width. The paper repeats horizontally and vertically; narrow edges repeat vertically; each roll has fixed-size ends and a horizontally repeating center. The bottom ending follows actual content height.

All eight papers currently share these display dimensions:

| Region | Display size |
| --- | --- |
| Cap container, including roll and paper transition | 100px high |
| Visible photographic cylinder | Approximately 35px thick; fixed across window widths |
| Each end crop | 84px wide |
| Side-edge sample | 40px wide, within the paper margin |
| Paper grain sample | 216×184px |
| Mirrored paper repeat period | 432×368px |
| Roll repeat period | 276px horizontally |
| Cap/body overlap | 30px |

The table describes the original roll rendering. Grain, roll thickness, and wood remain fixed-size from 320px to 1920px viewport widths. Flat paper caps are 56 CSS px tall. Paper cap height and texture size stay fixed as the width changes. A single `ResizeObserver` observes the body; updates are batched into one animation frame when width or content height changes. No scroll handler is attached. Content padding reflows with a bounded CSS clamp. Raster regions are displayed at a constant one-third of source size, providing three source pixels per CSS pixel before browser zoom.

## Renderer and matching artwork

`lib/renderer.js` creates a small fixed SVG structure around live HTML. Each material has one shared `<image>` definition and native SVG crop/`use`/`pattern` references. No raster slicing or bitmap retouching is performed by the build. The same decoded artwork supplies the paper, side edges, original rolls, and the interiors of the new paper endings. This avoids embedding the full image separately for each piece.

The paper sample is mirrored in both axes. The edge samples mirror vertically; the roll center mirrors horizontally. Mirrored neighbors meet at the same sampled boundary. This is a deliberate repeating-material construction, not a claim that generated art is inherently seamless. The quiet center reduces obvious repeating stains, but repeated motifs and mirror symmetry can still be noticed on close inspection.

A one-CSS-pixel overscan inside pattern cells prevents fractional display-density clipping lines while keeping the repeat period fixed. Roll cells have a small transparent vertical guard area so GPU sampling cannot wrap the flat-paper tail into the top of the roll. End crops retain their original photographic geometry. Each side edge has its own local viewport, keeping the repeating texture aligned with its silhouette instead of anchoring its phase to the entire page width.

Edge samples feather inward over the paper field using masks within the small repeat cells. The rectangular field stops inside the edge samples, so it cannot fill the transparent torn-out areas. Original roll caps blend over 30px of the body; new paper caps use a matching 2px overlap. Artwork is decorative and does not intercept pointer events; text sits above it. Subtle material differences may remain at sampled joins.

## Decisions and reasons

| Decision | Reason and tradeoff |
| --- | --- |
| Fixed material scale, independent of page width | Preserves grain, roll thickness, and end shapes on wide pages. The decoration naturally looks smaller relative to a very wide sheet. |
| One photographic atlas per matching set | Keeps material and lighting consistent, with one source image referenced by every part. Different photographic roll designs require another coordinated atlas; the new flat paper shapes share the selected material. |
| Native SVG crops and patterns | Reuses source regions without generating many separate bitmap files or duplicating their embedded bytes. This is ordinary SVG painting around HTML content, not an animated canvas renderer. |
| Mirrored repetition | Makes sampled boundaries meet without relying on the image generator to produce a mathematically seamless tile. Repetition and symmetry remain possible visual tells. |
| Local edge feathering and short cap overlap | Hides small sampling differences while preserving a transparent outer silhouette. Larger mismatches still need better artwork or crop calibration. |
| Overscan and transparent roll guard area | Corrects the thin lines observed at fractional screen density without changing the material's repeat size. |
| Native document flow | Supports real links, selectable text, arbitrary HTML, and content-driven height. There is no fixed-height page or internal content scrollbar. |
| Self-hosted Polyhymnia fonts and placeholder text | Gives the demo manuscript typography while keeping application fonts and content customizable. WOFF2 files add transfer/decode cost; linked builds fetch only faces/subsets used by the text. |

This version still downsamples each raster region once, by a constant `scale` value; it does **not** scale those regions as the viewport grows. Browser zoom is separate and can eventually exceed the available raster detail.

## How the new paper endings work

Each replacement covers the **whole** top or bottom section. No cylinder or wood is rendered at that end. The cap interior uses the existing `mr-paper` photographic pattern and the same photographic side strips as the body. Its pattern phase is anchored to the body: the top cap uses its height minus a 2px join overlap as the offset, and the bottom uses 2px minus the measured body height. This preserves the grain at the boundary when content grows. Plain paper caps have a 2 CSS px overlap to prevent antialiased gaps at fractional display density. Both textures sample identical coordinates in that overlap; no crossfade is required. Original rolls retain their original 30px overlap/fade.

A local SVG clipping path defines the flat edge. Only this outline changes with width; the photograph stays at the existing scale. Small deterministic irregularities are spaced in CSS pixels, so their size does not grow with the page width. Several low-opacity strokes inside the boundary simulate edge darkening. These strokes are a procedural approximation, not newly photographed torn edges. Dark papers use dark edge shading independently of their pale text ink. There are no new raster assets, canvas loops, blur filters, animation, or full-page clipping masks. Content remains in the rectangular body.

The observer updates the caps after body width/height changes, including content insertion and font/image reflow. A dimension-and-style signature skips unchanged work. The number of decorative elements is bounded by the chosen end styles; the number of outline coordinates grows with width, not page length. Observing the body avoids a loop caused by changes to cap height. Calling `destroy()` disconnects the observer and cancels a pending animation frame.

The main visual compromise is that new edges combine photographic interiors with procedural silhouettes and shading. Their outline is not a reproduction of every fold in the reference photograph. Future silhouette refinements can stay in `endings.js` without changing the eight paper atlases or the original roll renderer.

## Surfaces beneath the paper

The background is one ordinary CSS image on the document root, repeated in both directions with `background-attachment: scroll`. The background itself has no per-tile elements, mirrored texture copies, resize/scroll handlers, animation, parallax, or filters. The optional contact shadow is rendered separately; the original paper artwork is unchanged. The demo toolbar has an opaque neutral backing to remain readable on every surface; application controls can be styled independently.

| ID | Surface | Image | Compressed bytes |
| --- | --- | --- | --- |
| `oak` | Aged oak | `assets/background-oak.webp` | 555,874 |
| `walnut` | Dark walnut | `assets/background-walnut.webp` | 359,390 |
| `marble` | Honed marble | `assets/background-marble.webp` | 475,140 |
| `plain` | Solid neutral background | No image | 0 |

Each texture is 1254×1254 RGB, displayed at a fixed **627×627 CSS px** repeat size. Two source pixels supply each CSS pixel before display zoom. The texture size does not grow with page width or height. Ordinary CSS repetition is used; no stretching to the entire document or runtime stitching is performed. Generated textures were inspected in repeated browser previews. Their natural motifs still repeat; the prompts are not a mathematical guarantee that every edge pixel is identical. Edge-difference diagnostics are recorded for transparency, not treated as a seamlessness certificate.

The surfaces were generated with the built-in image generation tool and converted to opaque WebP at quality 90, method 6. No bitmap retouching, mirroring, or pixel resizing was performed. Exact prompts, tool mode, original locations, and final asset paths are in [background prompts](../notes/background-prompts.json) and [artwork details](../notes/background-artwork.json).

The three compressed surfaces total **1,390,404 bytes**. A selected texture represents 6,290,064 bytes of raw RGBA pixel data if decoded to four channels; that is arithmetic, not a measurement of full browser graphics memory. Browsers may cache previously selected images and paint surfaces. The linked build initially requests one paper atlas and one background; unselected textures are not prefetched by the script. The embedded build includes all three textures in its HTML regardless of selection. Prefer linked, cacheable assets in a real application.

Applications use `createTableSurface(element, {surface:'walnut'})` or React's `<TableSurface surface="walnut">`. The helper decorates the explicit container rather than assuming document ownership. CSS handles repetition; decoding and request guards handle updates. See [integration](INTEGRATION.md) for setup and cleanup.

## Optional contact shadow

The **Contact shadow** checkbox starts enabled; `?shadow=off` starts with it hidden. It applies to every paper, end combination, and underlying surface. The toggle changes neither content layout nor the artwork. Disabling it hides the entire added shadow layer with `display:none`; shadow geometry is refreshed from the current layout when re-enabled. Existing shading baked into the photographic artwork remains part of the artwork.

A small shadow is rendered from the decoration’s alpha (transparency), following the ragged edges and wooden roll ends. It is a shadow-only layer behind the artwork, never a shadow on the text. The SVG effect blurs source alpha with a 1.6px standard deviation, offsets it 1px right and 2px down, then colors it dark brown-black at 26% opacity. This is a close contact shadow rather than a large elevated-card effect. [SVG filter effects](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorials/SVG_from_scratch/Filter_effects) describes the source-alpha approach.

The long body is **not filtered**. Its left/right shadows are native repeating patterns whose pattern periods are 56×384 CSS px and filter regions are limited to 56×400 CSS px (including vertical guard samples), using the same photographic edge alpha as the body. Each input includes extra vertical samples so blurring at a repeat boundary does not create a stripe. Top/bottom caps use their existing SVG artwork through `use` references and receive independent local filters, with 8px of extra room around each cap. Original rolls retain their existing join fade in the shadow source. This avoids a filter region spanning the entire document.

`lib/endings.js` emits `parchment-surface-layout` after a paper/style/width/content-height change. Height-only changes retain the cap SVGs and update the bottom paper texture phase. The internal shadow controller listens to the final geometry event, so it needs no additional ResizeObserver or scroll listener. It retains its three decorative pieces during height-only changes and updates their positions and sizes; shape/material changes rebuild them once. Shadow-only option changes explicitly refresh the current geometry. It reuses the existing atlas/patterns and adds no image download. The long body still requires ordinary painting, and native filters/paint caches use browser resources; these bounds do not establish a universal FPS or graphics-memory guarantee.

The public API handles the shadow controller automatically. Set `shadow: false` through `page.update()` or React props to hide it. Each instance has its own SVG ID namespace; multiple parchments and their shadows can share a document. Destroying an instance removes its event listener, generated layers, and layout observer.

[Shadow checks](../notes/contact-shadow-verification.json) cover on/off layout, all paper/end artwork with shadows disabled, changes made while disabled, long-page filter bounds, and native scrolling. Browser screenshots were reviewed on wood/marble and at fractional display density.

## Assets and provenance

All eight source atlases were made with the built-in image generation tool. They were encoded to WebP at quality 92, method 6, preserving generated alpha. Raster content was not edited with Python. Prompts requested a quieter center, consistent lighting and straight roll geometry; the renderer calibrates the actual outputs rather than assuming exact prompt compliance.

| Material/end set | Final asset | Compressed bytes |
| --- | --- | --- |
| Aged parchment; wooden top spindle and bare paper bottom | `assets/original-material-atlas.webp` | 404,776 |
| Ivory vellum; bare curls at both ends | `assets/ivory-material-atlas.webp` | 284,924 |
| Warm rag paper; walnut knobs at both ends | `assets/rag-material-atlas.webp` | 433,006 |
| Cool vellum; pointed oak finials at both ends | `assets/sage-material-atlas.webp` | 358,394 |
| Slate vellum; bare curls at both ends | `assets/ivory-dark-material-atlas.webp` | 254,840 |
| Smoke vellum; pointed oak finials at both ends | `assets/sage-dark-material-atlas.webp` | 330,716 |
| Burnt umber; wooden top spindle and bare paper bottom | `assets/original-dark-material-atlas.webp` | 397,230 |
| Toasted linen rag; walnut knobs at both ends | `assets/rag-dark-material-atlas.webp` | 437,208 |

Each is 1254×1254 RGBA. Exact final prompts, source paths, and tool mode are in `notes/tiled-art-prompts.json` for the original four and [../notes/paper-tone-prompts.json](../notes/paper-tone-prompts.json) for the dark counterparts. `assets/` contains the eight active paper atlases and three opaque background textures. Changes to the published implementation are tracked in Git commits.

## Build and extend

Run `python3 build.py` from the project root. It writes `index.html`, embedding each atlas once. Use `--linked` for adjacent external assets; it writes the same entry point. A real app should normally use cacheable external assets. The embedded demo contains all eight paper atlases and three backgrounds and is approximately 9.62MB including embedded fonts; a linked app initially loads only the selected paper atlas and surface.

The builder requires Python 3 and its standard library only; Pillow and the image-generation tool are not needed to rebuild existing assets. No npm install or bundler is required. From this repository's root:

```sh
# Self-contained HTML; eight paper atlases and three surfaces embedded once.
python3 build.py

# Smaller HTML; artwork remains in the adjacent assets/ directory.
python3 build.py --linked
```

To build a separate deployment directory, run `python3 build.py --linked --output dist/index.html`. The builder copies the linked assets next to that HTML automatically. GitHub Pages runs this command and publishes only `dist/` on each push to `main`; the source, guide, and development notes are available in the repository, not in the site artifact. Its workflow follows the [GitHub Pages custom-workflow setup](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

Both commands overwrite the **same** root `index.html`. Rebuild without `--linked` to restore the self-contained version. Generated HTML is ignored by Git; edit the source and rebuild. Edit the source files and rebuild; edits made only to generated `index.html` are lost on the next build.

For deployment, an embedded build needs only `index.html`. A linked demo needs `index.html`, `assets/`, and `demo-assets/`. The deployment builder also includes `lib/`, the plain-JavaScript example, and the browser ZIP. A relative URL such as `assets/sage-material-atlas.webp` resolves against the **HTML page URL**, not the JavaScript file's location. Keep that directory structure when serving the standalone page.

`src/template.html` and `src/demo.js` hold demo content, typography, controls, and URL behavior. `lib/renderer.js`, `lib/endings.js`, and `lib/shadow.js` preserve the fixed-scale artwork pipeline. `lib/core.js` supplies mounting, scoped IDs, loading, updates, and cleanup; `lib/react.js` is its optional React adapter. `lib/styles.css` contains scoped geometry; `lib/typography.css` is optional. `scripts/build-library.py` generates the catalog and CSS asset declarations from `src/themes.json` and `src/backgrounds.json`. `src/shell.html` holds the standalone document shell. The builder validates unique IDs, complete palettes, family/mode/tone consistency, reciprocal light/dark pairs, existing assets, and at least two options per family, along with unique background IDs and existing background assets, before writing the output.

To add a material or a roll design, prepare one matching atlas, inspect its actual dimensions and silhouette, and add an entry with calibrated crop coordinates. Do not assume a new generated image will align with the existing crops. A different roll design in the same material is another coordinated kit; its paper sample can be shared in a future separate-asset manifest if needed. Original roll selection binds complete compatible sets. Plain paper endings reuse each selected atlas directly and therefore need no additional matching color artwork. Atlas decoding finishes before a coordinated theme swap, with a request guard for fast changes.

## Integrating real content into an application

Use the [application integration guide](INTEGRATION.md) for plain JavaScript, React, plain HTML, all public options, automatic asset handling, typography, and cleanup. The renderer no longer requires extracting functions or copying internal markup. The demo uses the same `createParchment()` and `createTableSurface()` public APIs as consumers.

The core has no runtime dependencies. React is an optional peer dependency, isolated behind the `/react` entry point. Multiple instances use distinct SVG namespaces. Server imports are safe; React owns a stable content subtree while the renderer updates only decorative slots.

## Crop-setting reference

All crop coordinates are measured in **source image pixels**. `scale` converts them to CSS pixels. None of these fields depends on viewport width.

| Field | Meaning | Current value |
| --- | --- | --- |
| `id`, `label`, `description` | Paper identifier and selector/status text | Different per set |
| `mode`, `tone`, `family` | Selection categories; not roll designs | See family table |
| `pair`, `counterpart` | Shared material ID and opposite-mode paper ID | e.g. `rag`, `rag-dark` |
| `ends` | End-design metadata, separate from paper tone | `paper-curls`, `oak-points`, `wood-top-paper-bottom`, `walnut-round` |
| `palette` | Suggested `surface`, `ink`, `muted`, `link` colors | Different per paper |
| `atlas` | Local source path; embedded or retained as a URL by the builder | `assets/<material>-material-atlas.webp` |
| `width`, `height` | Actual source dimensions | `1254`, `1254` |
| `scale` | Constant displayed/source size ratio | `1/3` |
| `capHeight` | Height of each cap crop | `300` → 100 CSS px |
| `topOffset` | Top crop starts this far down the source | `48` |
| `bottomOffset` | Bottom crop ends this far above the source bottom | `48` |
| `overlap` | Cap/body overlap depth | `90` → 30 CSS px |
| `endWidth` | Width of each unique left/right cap end | `252` → 84 CSS px |
| `edgeX`, `edgeWidth` | Left edge sample starts at `edgeX`; right starts at `width - edgeX - edgeWidth` | `96`, `120` |
| `edgeY`, `edgeHeight` | Vertical source region repeated for the side edges | `320`, `576` |
| `coreInset` | Paper-field inset from each side of the complete scroll | `168` → 56 CSS px |
| `paperInset` | Content's base safe inset; CSS adds bounded inner padding | `126` → 42 CSS px |
| `bodyCrop` | `[x, y, width, height]` of the quiet paper sample | `[300, 360, 648, 552]` |
| `rollCrop` | `[x, width]` of the repeated roll center; vertical crops follow cap settings | `[420, 414]` |

For the current geometry, the top source region is `y=48..348`; the bottom is `y=906..1206`. The right end begins at `x=1002`. Body mirroring doubles both sample dimensions; side mirroring doubles the vertical period; roll mirroring doubles the horizontal period. The renderer also overlaps the roll center with each end by 8 CSS px, overscans repeat samples by 1 CSS px, and adds a 2 CSS px vertical guard to roll pattern cells. These latter values live in `surface.js`, not the manifest.

When adding artwork, ensure every crop fits the source, allowing for the overscan, and contains the intended flat paper, edge, or cylindrical region. Keep decorative sizes consistent across themes unless the difference is intentional. Check narrow pages, both cap joins, arbitrary final-tile heights, light/dark backgrounds, and fractional display density before adding the entry to the selector. CSS padding should keep content clear of the actual silhouette, not merely inside the source-image rectangle.

## Verification and limits

The current library is checked from an actual npm archive in isolated vanilla and React/Vite consumers: paper/end combinations, responsive widths, content growth, DOM/input preservation, rapid updates, teardown/remount, failed-load recovery, React development Strict Mode, server rendering/hydration, and production asset paths beneath a subdirectory. See [library checks](../notes/library-integration-verification.json).

Current options are limited to plain paper and the original roll. [Option-removal checks](../notes/paper-scroll-options-verification.json) verify all eight papers, both choices for each end, responsive layout, and unchanged plain-paper/original-roll artwork. The earlier [paper-ending verification](../notes/paper-endings-verification.json) records the initial 180-combination checks, including an experimental shape that has since been removed. Its content-growth, fractional-density join, and scroll checks remain historical evidence for the shared renderer.

The earlier paper-ending application extraction was checked without demo controls: custom content remained, content growth moved the ending, theme changes preserved end choices, invalid choices were rejected without changing state, and `destroy()` disconnected layout updates. The linked build, demo startup, and 640px maximum width were also checked. [Application checks](../notes/paper-ending-app-verification.json) record these results. These checks do not measure real-device graphics memory or FPS.

Historical original-roll checks: all four sets passed Chromium headless checks at 320, 375, 768, 997, 1440, and 1920px. Checks confirmed constant cap/end/grain dimensions, no horizontal overflow or internal content scrollbar, native document anchors, and content growth moving the bottom roll. The decorative descendant count remained 78 as page width and length changed. Short/long pages, optional maximum width, rapid theme changes, embedded/linked builds, and the previous snapshot worked without JavaScript errors. Screenshots of top/bottom, mobile, light/dark surroundings, and DPR 1.25/2/3 were inspected. The fractional-density repeat seam found during inspection was corrected. Functional results are in `notes/tiled-verification.json`.

The earlier original-roll application extraction was assembled directly from the previous instructions and checked in Chromium at 375px width. It preserved custom HTML without a toolbar, switched from sage to ivory, kept caps at 100px, and moved the bottom roll by exactly 1300px when that much content height was added, without horizontal overflow or JavaScript errors.

A 320px-wide stress page with 212 content sections reached 145,932px in height. Its paper remained visible near the end, its bottom roll reached the true document end, and its decorative count stayed 78. A scripted scroll smoke check completed with no recorded layout work during scrolling. Results are in `notes/tiled-stress.json`; its timing and JavaScript heap figures do not measure all graphics memory or predict real-device frame rates.

This is not a real-device performance benchmark or Firefox/Safari certification. SVG pattern paint caches and masks still use browser resources. One source image is about 6MiB of raw RGBA pixels; the browser can retain visited materials and additional paint surfaces. Constant DOM count does not mean constant total memory. No full-document filter, forced compositing, canvas loop, or scroll-time JavaScript is used. Extreme zoom can still exceed the source detail, and artwork repetition remains the main visual compromise.

The eight-paper catalog also passed the six-width Chromium matrix, with four groups of two options, unchanged fixed dimensions and 78 decorative descendants. Mode/tone selection, reciprocal material pairs, automatic system-mode changes, manual override, explicit-theme precedence, rapid switching, native anchors, and appended content were checked. The linked build fetched one atlas initially and loaded all eight on selection. The updated application extraction retained custom HTML and applied a dark counterpart and its palette while preserving content-driven height and maximum width. Results are in [../notes/paper-tone-verification.json](../notes/paper-tone-verification.json). Earlier stress figures above describe the four-paper renderer; no new real-device FPS or graphics-memory benchmark is implied.

For performance planning, distinguish transfer size, decoded images, paint surfaces, and application content. All eight compressed atlases total **2,901,094 bytes** before HTML/base64 overhead; the current embedded HTML, including background textures and bundled fonts, is approximately **9.62MB**. One decoded RGBA atlas is **6,290,064 bytes**; that arithmetic is not a measurement of the browser's full graphics memory. The demo's JavaScript decoding map and browser caches may retain previously selected materials, so visiting eight can retain more decoded artwork than visiting four. Only the selected image is initially decoded by the script; the embedded file still transfers all eight. A linked build can fetch only the selected material. The family resolver does not fetch or preload anything. Longer pages still contain more real HTML, and larger visible areas still require painting even though the decorative structure stays fixed.

Use the linked build and cacheable assets for an app; avoid preloading every material unless the UX needs it. Keep the local edge/cap masks local when customizing. Large blur filters, full-page masks, forced compositing, animation, or a full-document canvas would introduce costs that this implementation has not measured. Test Firefox, Safari, a representative phone, display zoom, and the application's actual content before setting a production performance budget.

## Troubleshooting and maintenance

| Symptom | Check |
| --- | --- |
| Artwork unavailable / blank demo surface | The linked `assets/` folder may be missing or the route may resolve its URLs incorrectly. Inspect the image request and status text, or rebuild with embedded assets. |
| Raw `__LIBRARY_JS__` or `__DEMO_JS__` text | You opened the source template or deployed an unbuilt file. Run the builder and use `index.html`. |
| Content disappears or gets duplicated | Use the library API in applications rather than the demo initializer. The React wrapper retains ownership of children. |
| Rolls grow when resizing | A width-dependent image size, aspect ratio, or transform has been reintroduced. Cap/end sizes should follow the fixed manifest values. |
| Rectangular paper fills torn margins | The field's inset no longer overlaps the inner part of the edge sample correctly. Check `coreInset`, `edgeX`, and `edgeWidth`. |
| Thin lines appear between repeats | Preserve the overscan, roll guard, and edge-local viewports; check at fractional screen density as well as 1x. |
| Artwork URL missing | Load `styles.css` before mounting, or supply an `assetsBase` containing the original texture filenames. |

Use Git commits for history and regression comparisons. There are no `current/` or `prev/` snapshot directories in this repository. Make changes in `lib/` or `src/`, rebuild, and check narrow/wide layouts and content growth before committing.
