# Elder Scrolls usage and implementation guide

Try the [live demo](https://adrian729.github.io/elder-scrolls/), or build `index.html` locally for the offline demo. It starts with Ivory vellum, Medium content (five sections), original rolls at both ends, and a responsive 900px maximum page width. Choose top and bottom independently from **Original roll** and **Paper**, for any of the eight papers. It opens on dark walnut; **Surface beneath paper** offers aged oak, dark walnut, honed marble, or a plain background independently of the paper. Content uses normal HTML and browser document scrolling.

This is the main guide for the implementation. Start with [using the demo](#using-the-demo), then [building](#build-and-extend) or [integrating real content](#integrating-real-content-into-an-application). The historical [plan](../notes/responsive-texture-plan.md), [generation prompts](../notes/tiled-art-prompts.json), [functional checks](../notes/tiled-verification.json), and [long-page check](../notes/tiled-stress.json) provide supporting detail.

All eight photographic atlases remain unchanged. Original rolls retain their complete matching artwork. The new `src/endings.js` module replaces a whole cap with a shaped continuation of the selected paper. It does not split or recombine wooden parts. See [paper-ending checks](../notes/paper-endings-verification.json) for this revision; older restoration notes describe the preserved baseline.

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

For application selection, load `src/papers.js` as a classic script before the initializer. The build embeds it automatically. It defines a small catalog factory; it does not load images or render content:

```js
const catalog = ParchmentPapers.create(
  JSON.parse(document.getElementById('mr-theme-data').textContent)
);

catalog.list({ family: 'dark-burnt' }); // Both warm dark options.
catalog.list({ mode: 'dark', tone: 'neutral' }); // Both neutral dark options.
catalog.get('rag-dark'); // A specific paper, including palette and geometry.
catalog.resolve({ mode: 'dark', tone: 'warm' }); // Default: original-dark.
catalog.resolve({ paper: 'rag', mode: 'dark' }); // Keeps the material: rag-dark.
catalog.resolve({ paper: 'rag-dark', mode: 'light' }); // Returns rag.
```

`resolve()` accepts only `light`/`dark` modes and `neutral`/`warm` tones. Omitted mode/tone come from the preferred paper, or default to light/neutral. It retains the preferred material's `pair` when available in the requested family; otherwise it uses that family's first entry. Unknown paper IDs or invalid mode/tone values throw an error. `list()` returns all matching entries, or an empty array. Neither method changes the page.

To apply a resolved paper in the demo, or in the application adaptation below:

```js
const chosen = catalog.resolve({ paper: 'rag', mode: 'dark' });
document.getElementById('manuscript-realistic').dispatchEvent(
  new CustomEvent('parchment-theme', { detail: chosen.id })
);
```

For a system-controlled application, turn the media preference into an explicit resolver mode. Install this after the application initializer and remove the media listener when the component unmounts:

```js
const preference = matchMedia('(prefers-color-scheme: dark)');
const scrollRoot = document.getElementById('manuscript-realistic');
function applyPreferredMode() {
  const chosen = catalog.resolve({
    paper: scrollRoot.dataset.theme || 'rag',
    mode: preference.matches ? 'dark' : 'light',
    tone: 'warm'
  });
  scrollRoot.dispatchEvent(new CustomEvent('parchment-theme', { detail: chosen.id }));
}
preference.addEventListener('change', applyPreferredMode);
applyPreferredMode();
// On unmount: preference.removeEventListener('change', applyPreferredMode);
```

This application example intentionally keeps following the system; your application decides whether a manual choice should disable it. The demo's `mode=auto` behavior does disable following after a manual choice. For a user-controlled mode or a contextual surface, pass that mode and tone directly to `resolve()` instead.

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

Typography is optional application styling. To reuse it, include `src/fonts.css` (or the built declarations), retain its font assets, and keep the typography rules from the template. The CSS file's font URLs resolve relative to that CSS file; built inline URLs resolve relative to the HTML. To replace it, change the `--mr-font-*` tokens and remove the decorative initial markup/rules as desired; the paper renderer has no font-family dependency. Keep the body ResizeObserver so late font loading can update the endings and shadow.

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

`src/surface.js` creates a small fixed SVG structure around live HTML. Each material has one shared `<image>` definition and native SVG crop/`use`/`pattern` references. No raster slicing or bitmap retouching is performed by the build. The same decoded artwork supplies the paper, side edges, original rolls, and the interiors of the new paper endings. This avoids embedding the full image separately for each piece.

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

To integrate the background without the demo toolbar, load `src/backgrounds.js` as a classic script and supply the catalog from `src/backgrounds.json`. The demo adapter skips initialization when the matching selector is absent. Apply this CSS to the document root (the shell already includes it):

```css
:root {
  background-color: var(--workspace-color, #282925);
  background-image: var(--workspace-image, none);
  background-size: var(--workspace-size, auto);
  background-repeat: repeat;
  background-attachment: scroll;
}
```

With the built template’s `mr-background-data` JSON script retained:

```js
const catalog = JSON.parse(
  document.getElementById('mr-background-data').textContent
);
const backgrounds = ParchmentBackgrounds.create(document.documentElement, catalog);
await backgrounds.set('oak');
await backgrounds.set('marble'); // Paper and end choices stay as selected.
await backgrounds.set('plain'); // Removes the texture; uses its fallback color.
```

In a deployed app you can instead load the catalog through your bundler or server. Linked catalog URLs resolve against the HTML page URL. On nested routes, map them to your static assets before creating the controller, for example:

```js
for (const item of catalog) {
  if (item.image && !item.image.startsWith('data:')) {
    item.image = new URL('/scroll/' + item.image, location.href).href;
  }
}
```

`set(id)` waits for image decoding before replacing the visible surface and resolves `true` when applied. A later request supersedes an earlier one; the superseded request resolves `false`. Unknown IDs and decode failures reject. On load failure, the existing background remains visible (or the initial CSS fallback). Handle rejected promises in your application. `destroy()` invalidates an outstanding decode request; the controller attaches no event listeners. Remove any selector listeners your application adds when unmounting.

To add another surface, place its repeatable WebP in `assets/` and add an entry with a unique ID, label, image path, fallback color, and positive square `tileSize` in CSS pixels. Rebuild the same `index.html`. Check its actual repeats in both axes at mobile and desktop widths before treating it as final artwork.

[Background checks](../notes/background-verification.json) record responsive layout, independence from paper selection, unchanged paper rendering, rapid selection, native document scrolling, and selected-only loading in the linked build. These checks do not establish real-device FPS or certify Firefox/Safari.

## Optional contact shadow

The **Contact shadow** checkbox starts enabled; `?shadow=off` starts with it hidden. It applies to every paper, end combination, and underlying surface. The toggle changes neither content layout nor the artwork. Disabling it hides the entire added shadow layer with `display:none`; shadow geometry is refreshed from the current layout when re-enabled. Existing shading baked into the photographic artwork remains part of the artwork.

A small shadow is rendered from the decoration’s alpha (transparency), following the ragged edges and wooden roll ends. It is a shadow-only layer behind the artwork, never a shadow on the text. The SVG effect blurs source alpha with a 1.6px standard deviation, offsets it 1px right and 2px down, then colors it dark brown-black at 26% opacity. This is a close contact shadow rather than a large elevated-card effect. [SVG filter effects](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorials/SVG_from_scratch/Filter_effects) describes the source-alpha approach.

The long body is **not filtered**. Its left/right shadows are native repeating patterns whose pattern periods are 56×384 CSS px and filter regions are limited to 56×400 CSS px (including vertical guard samples), using the same photographic edge alpha as the body. Each input includes extra vertical samples so blurring at a repeat boundary does not create a stripe. Top/bottom caps use their existing SVG artwork through `use` references and receive independent local filters, with 8px of extra room around each cap. Original rolls retain their existing join fade in the shadow source. This avoids a filter region spanning the entire document.

`src/endings.js` emits `parchment-surface-layout` when it rebuilds the ends after a paper/style/width/content-height change. `ParchmentShadow` listens to that event, so it needs no additional ResizeObserver or scroll listener. It creates three decorative pieces, reuses the existing atlas/patterns, and adds no image download. The long body still requires ordinary painting, and native filters/paint caches use browser resources; these bounds do not establish a universal FPS or graphics-memory guarantee.

For application integration, load `src/shadow.js`, retain the scoped shadow CSS from `template.html`, and create the controller after mounting the markup **before the first `endings.setPaper(theme)` call**:

```js
const shadow = ParchmentShadow.create(root, { enabled: true });
shadow.setEnabled(false);
shadow.setEnabled(true);
// On unmount:
shadow.destroy();
```

The full application initializer below includes this controller. If an application omits shadows entirely, omit the controller and its script. Only one parchment instance per document is supported by the current shared SVG IDs, including shadow IDs. The controller removes its listener and added layer on `destroy()`.

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

Run `python3 build.py` from the project root. It writes `index.html`, embedding each atlas once. Use `--linked` for adjacent external assets; it writes the same entry point. A real app should normally use cacheable external assets. The embedded demo contains all eight paper atlases and three backgrounds and is approximately 9.39MB including embedded fonts; a linked app initially loads only the selected paper atlas and surface.

The builder requires Python 3 and its standard library only; Pillow and the image-generation tool are not needed to rebuild existing assets. No npm install or bundler is required. From this repository's root:

```sh
# Self-contained HTML; eight paper atlases and three surfaces embedded once.
python3 build.py

# Smaller HTML; artwork remains in the adjacent assets/ directory.
python3 build.py --linked
```

To build a separate deployment directory, run `python3 build.py --linked --output dist/index.html`. The builder copies the linked assets next to that HTML automatically. GitHub Pages runs this command and publishes only `dist/` on each push to `main`; the source, guide, and development notes are available in the repository, not in the site artifact. Its workflow follows the [GitHub Pages custom-workflow setup](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

Both commands overwrite the **same** root `index.html`. Rebuild without `--linked` to restore the self-contained version. Generated HTML is ignored by Git; edit the source and rebuild. Edit the source files and rebuild; edits made only to generated `index.html` are lost on the next build.

For deployment, an embedded build needs only `index.html`. A linked build needs `index.html` and the complete adjacent `assets/` directory. A relative URL such as `assets/sage-material-atlas.webp` resolves against the **HTML page URL**, not the JavaScript file's location. Keep that directory structure when serving the standalone page.

`src/template.html` holds the HTML/CSS, `src/surface.js` the pattern construction and controls, `src/endings.js` the plain paper cap renderer, `src/papers.js` the mode/tone resolver, `src/themes.json` the catalog and crop geometry, and `src/shell.html` the document shell and CSS workspace background; `src/backgrounds.json` and `src/backgrounds.js` hold the surface catalog and selector/API; `src/shadow.js` supplies the optional contact shadow. The builder validates unique IDs, complete palettes, family/mode/tone consistency, reciprocal light/dark pairs, existing assets, and at least two options per family, along with unique background IDs and existing background assets, before writing the output.

To add a material or a roll design, prepare one matching atlas, inspect its actual dimensions and silhouette, and add an entry with calibrated crop coordinates. Do not assume a new generated image will align with the existing crops. A different roll design in the same material is another coordinated kit; its paper sample can be shared in a future separate-asset manifest if needed. Original roll selection binds complete compatible sets. Plain paper endings reuse each selected atlas directly and therefore need no additional matching color artwork. Atlas decoding finishes before a coordinated theme swap, with a request guard for fast changes.

## Integrating real content into an application

The supplied `surface.js` is a self-running **demo renderer**, not an exported rendering component. Its initialization expects the toolbar and replaces `.mr-sections` with cloned placeholder sections. Simply deleting the toolbar or inserting app content while retaining that initialization will either break its element lookups or replace your content. The separate `ParchmentPapers` catalog and `ParchmentEndings` APIs are reusable without those controls. Load `src/endings.js` as a classic script before your initializer to use the paper endings. Load `src/shadow.js` before the initializer to include the optional shadow shown below.

Use this extraction procedure for a real app:

1. Copy the geometry CSS from `src/template.html`, or retain its entire first `<style>` block initially. It is scoped to `#manuscript-realistic`. Keep the sizing, masks, stacking order, and `pointer-events` rules; customize typography separately.
2. Retain the `main.mr-scroll` structure shown below inside the root. Replace `.mr-content` with your application's actual content. You can omit the demo header, `.mr-sections`, footer, and toolbar.
3. Copy **only the `function surface(theme) { ... }` definition** from `src/surface.js` into your application initializer. It closes over `root`; define that variable as shown in the initializer below. Do not copy the demo's section cloning, length controls, width controls, or startup `setLength()` call.
4. Supply the theme array from `src/themes.json`, either through your bundler/server or as the `mr-theme-data` JSON script. The initializer below assumes that JSON script is already populated. The existing builder fills the `__SCROLL_THEMES__` token when you retain that script in the template.
5. Run the initializer after the markup is mounted. An application with client-side routing should initialize on mount, not only once when the document first loads. The extracted original surface function does not attach resize or scroll listeners. Loading `endings.js` adds one body ResizeObserver, which must be disconnected on unmount with `endings.destroy()`. The optional shadow controller listens to its layout event and must also be released with `shadow.destroy()`. If you use its optional material-switch listener, retain its callback and remove it when unmounting; do the same for any optional system-mode listener you add.

For a standalone document, retain the shell's `<!doctype html>`, UTF-8 charset, and `<meta name="viewport" content="width=device-width,initial-scale=1">`. The viewport tag is necessary for mobile browsers to use the actual device width. The shell's background and outer gutters are optional application styling.

The required structural HTML is:

```html
<div id="manuscript-realistic">
  <main class="mr-scroll">
    <svg class="mr-definitions" width="0" height="0"
         aria-hidden="true" focusable="false"><defs></defs></svg>
    <div class="mr-cap mr-top" aria-hidden="true"></div>
    <div class="mr-body">
      <div class="mr-texture" aria-hidden="true"></div>
      <div class="mr-content">
        <!-- Your normal HTML or framework-rendered content goes here. -->
      </div>
    </div>
    <div class="mr-cap mr-bottom" aria-hidden="true"></div>
  </main>
</div>
<script type="application/json" id="mr-theme-data">__SCROLL_THEMES__</script>
```

Use the following initializer **with the copied `surface(theme)` function in its indicated position**. This is an application adaptation, not an API already exposed by the current demo:

```js
(() => {
  const root = document.getElementById('manuscript-realistic');
  const themes = JSON.parse(document.getElementById('mr-theme-data').textContent);
  let request = 0;

  // Paste function surface(theme) { ... } from src/surface.js here, unchanged.
  const endings = ParchmentEndings.create(root, {
    top: 'paper', bottom: 'paper'
  });
  const shadow = ParchmentShadow.create(root, { enabled: true });

  async function setPaper(id) {
    const theme = themes.find(item => item.id === id);
    if (!theme) throw new Error('Unknown parchment theme: ' + id);
    const version = ++request;
    const main = root.querySelector('main');
    main.setAttribute('aria-busy', 'true');
    try {
      const image = new Image();
      image.src = theme.atlas;
      await image.decode();
      if (version !== request) return;
      surface(theme);
      endings.setPaper(theme); // Call immediately after rebuilding the original surface.
      root.dataset.theme = theme.id;
    } finally {
      if (version === request) main.setAttribute('aria-busy', 'false');
    }
  }

  // Optional application-controlled material switch.
  root.addEventListener('parchment-theme', event => {
    setPaper(event.detail).catch(console.error);
  });
  setPaper('ivory').catch(console.error);
})();
```

In that adaptation, switch the material with:

```js
document.getElementById('manuscript-realistic').dispatchEvent(
  new CustomEvent('parchment-theme', { detail: 'ivory' })
);
```

Within that initializer, change endings without changing the paper:

```js
endings.setOptions({ top: 'default', bottom: 'paper' });
endings.setOptions({ bottom: 'default' }); // Omitted top stays unchanged.
```

Accepted values are `default` and `paper`. Invalid values throw before changing either selection. The standalone module defaults both to `default`; the application initializer above explicitly chooses paper at both ends; the demo starts with original rolls. `setPaper(theme)` captures the original roll markup, so always call `surface(theme)` immediately before it, including on material changes. Do not call it again merely to change end styles. Call `shadow.destroy()` and `endings.destroy()` on component unmount, and remove any application event listeners you added.

Set a maximum width on the root; use `none` for fluid width:

```css
#manuscript-realistic { --mr-width: 1100px; }
```

No refresh call is needed when content changes. Append or render content inside `.mr-content`; its height determines the body and bottom roll position. Avoid giving `.mr-body` or `.mr-content` a fixed height or `overflow-y: auto`. For very wide tables, code blocks, or media, apply normal responsive layout within the content, for example `max-width: 100%` on images and `overflow-wrap: anywhere` where appropriate.

Remove the template's final `:not([data-theme]) .mr-scroll { visibility:hidden; }` rule in this application adaptation. That rule is a demo loading treatment and would hide real content when artwork cannot load. A simple readable loading/error fallback is:

```css
#manuscript-realistic:not([data-theme]) .mr-body { background: #eee4cc; }
```

For linked assets on nested application routes, map the theme URLs to your static-asset location **in the application initializer**, before calling `setPaper`. For example, if the files live under `/scroll/assets/`:

```js
for (const theme of themes) {
  if (!theme.atlas.startsWith('data:')) {
    theme.atlas = new URL('/scroll/' + theme.atlas, location.href).href;
  }
}
```

Keep source-manifest atlas paths relative if using the existing embedded builder: it interprets them as local file paths. In a framework, manage only `.mr-content` with framework rendering and let this renderer own the decorative containers. Its generated IDs (`mr-atlas`, pattern IDs, and mask IDs) are document-wide, so the unchanged renderer supports **one scroll per document**. Multiple simultaneous scroll instances require unique root and SVG IDs and corresponding reference changes. The standalone build uses inline CSS/JavaScript and, by default, data-image URLs; a deployment with a restrictive content policy needs compatible nonces/hashes or an adaptation to external CSS/JavaScript and linked assets.

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

Current options are limited to plain paper and the original roll. [Option-removal checks](../notes/paper-scroll-options-verification.json) verify all eight papers, both choices for each end, responsive layout, and unchanged plain-paper/original-roll artwork. The earlier [paper-ending verification](../notes/paper-endings-verification.json) records the initial 180-combination checks, including an experimental shape that has since been removed. Its content-growth, fractional-density join, and scroll checks remain historical evidence for the shared renderer.

The earlier paper-ending application extraction was checked without demo controls: custom content remained, content growth moved the ending, theme changes preserved end choices, invalid choices were rejected without changing state, and `destroy()` disconnected layout updates. The linked build, demo startup, and 640px maximum width were also checked. [Application checks](../notes/paper-ending-app-verification.json) record these results. These checks do not measure real-device graphics memory or FPS.

Historical original-roll checks: all four sets passed Chromium headless checks at 320, 375, 768, 997, 1440, and 1920px. Checks confirmed constant cap/end/grain dimensions, no horizontal overflow or internal content scrollbar, native document anchors, and content growth moving the bottom roll. The decorative descendant count remained 78 as page width and length changed. Short/long pages, optional maximum width, rapid theme changes, embedded/linked builds, and the previous snapshot worked without JavaScript errors. Screenshots of top/bottom, mobile, light/dark surroundings, and DPR 1.25/2/3 were inspected. The fractional-density repeat seam found during inspection was corrected. Functional results are in `notes/tiled-verification.json`.

The earlier original-roll application extraction was assembled directly from the previous instructions and checked in Chromium at 375px width. It preserved custom HTML without a toolbar, switched from sage to ivory, kept caps at 100px, and moved the bottom roll by exactly 1300px when that much content height was added, without horizontal overflow or JavaScript errors.

A 320px-wide stress page with 212 content sections reached 145,932px in height. Its paper remained visible near the end, its bottom roll reached the true document end, and its decorative count stayed 78. A scripted scroll smoke check completed with no recorded layout work during scrolling. Results are in `notes/tiled-stress.json`; its timing and JavaScript heap figures do not measure all graphics memory or predict real-device frame rates.

This is not a real-device performance benchmark or Firefox/Safari certification. SVG pattern paint caches and masks still use browser resources. One source image is about 6MiB of raw RGBA pixels; the browser can retain visited materials and additional paint surfaces. Constant DOM count does not mean constant total memory. No full-document filter, forced compositing, canvas loop, or scroll-time JavaScript is used. Extreme zoom can still exceed the source detail, and artwork repetition remains the main visual compromise.

The eight-paper catalog also passed the six-width Chromium matrix, with four groups of two options, unchanged fixed dimensions and 78 decorative descendants. Mode/tone selection, reciprocal material pairs, automatic system-mode changes, manual override, explicit-theme precedence, rapid switching, native anchors, and appended content were checked. The linked build fetched one atlas initially and loaded all eight on selection. The updated application extraction retained custom HTML and applied a dark counterpart and its palette while preserving content-driven height and maximum width. Results are in [../notes/paper-tone-verification.json](../notes/paper-tone-verification.json). Earlier stress figures above describe the four-paper renderer; no new real-device FPS or graphics-memory benchmark is implied.

For performance planning, distinguish transfer size, decoded images, paint surfaces, and application content. All eight compressed atlases total **2,901,094 bytes** before HTML/base64 overhead; the current embedded HTML, including background textures and bundled fonts, is approximately **9.39MB**. One decoded RGBA atlas is **6,290,064 bytes**; that arithmetic is not a measurement of the browser's full graphics memory. The demo's JavaScript decoding map and browser caches may retain previously selected materials, so visiting eight can retain more decoded artwork than visiting four. Only the selected image is initially decoded by the script; the embedded file still transfers all eight. A linked build can fetch only the selected material. The family resolver does not fetch or preload anything. Longer pages still contain more real HTML, and larger visible areas still require painting even though the decorative structure stays fixed.

Use the linked build and cacheable assets for an app; avoid preloading every material unless the UX needs it. Keep the local edge/cap masks local when customizing. Large blur filters, full-page masks, forced compositing, animation, or a full-document canvas would introduce costs that this implementation has not measured. Test Firefox, Safari, a representative phone, display zoom, and the application's actual content before setting a production performance budget.

## Troubleshooting and maintenance

| Symptom | Check |
| --- | --- |
| Artwork unavailable / blank demo surface | The linked `assets/` folder may be missing or the route may resolve its URLs incorrectly. Inspect the image request and status text, or rebuild with embedded assets. |
| Raw `__SCROLL_THEMES__`, `__PAPERS_JS__`, or `__SURFACE_JS__` text | You opened the source template or deployed an unbuilt file. Run the builder and use `index.html`. |
| Content disappears or gets duplicated | The demo's `setLength()`/cloning initialization is still running on app content. Follow the extraction procedure. |
| Rolls grow when resizing | A width-dependent image size, aspect ratio, or transform has been reintroduced. Cap/end sizes should follow the fixed manifest values. |
| Rectangular paper fills torn margins | The field's inset no longer overlaps the inner part of the edge sample correctly. Check `coreInset`, `edgeX`, and `edgeWidth`. |
| Thin lines appear between repeats | Preserve the overscan, roll guard, and edge-local viewports; check at fractional screen density as well as 1x. |
| Two scrolls interfere with each other | The unchanged renderer shares document-wide SVG IDs. Give each component its own complete ID namespace. |

Use Git commits for history and regression comparisons. There are no `current/` or `prev/` snapshot directories in this repository. Make changes in `src/`, rebuild, and check narrow/wide layouts and content growth before committing.
