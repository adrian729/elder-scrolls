# Plan: parchment that grows without scaling with page width

Status: implemented for all four materials. This document retains the original proposal. The final renderer uses native SVG crops and patterns around one shared photographic atlas per material, rather than separate raster slices and CSS background files. See `../README.md` for the actual geometry, verification, and remaining limits.

## Finding in the current implementation

`src/template.html` gives cap images `width: 100%` and cap containers a width-dependent aspect ratio. Each cap crop is 23.5% of scroll width in height. Body tiles also have width-dependent height and use width-sized background images. The body already repeats vertically, but its grain, edge width, cap height, and overlap all change with page width. The 1024×1536 cap assets are finite-resolution images.

## Recommended construction

Use a coordinated material kit with a two-dimensional repeating paper field, narrow vertical edge strips, and separate three-part rolls. Use ordinary CSS backgrounds and a small, fixed set of decorative elements around normal HTML content. Grow the area covered by the material, rather than the size of the material details.

| Part | Width behavior | Height behavior | Required art |
| --- | --- | --- | --- |
| Paper field | Repeat horizontally at a fixed CSS tile size | Repeat vertically at the same fixed size | Seamless tile in both axes; quiet grain and modest mottling |
| Left/right paper edges | Fixed decorative strip width | Repeat vertically, clipping the last repeat | Transparent outer silhouette, matching material, seamless vertical wrap |
| Left/right ends of each roll | Fixed dimensions | Fixed dimensions | Finials or curls, paper shoulders and corner shading |
| Middle of each roll | Repeat horizontally, clipping partial repeats | Fixed roll thickness | Horizontally seamless photographic roll strip |
| Roll-to-page transition | Fill the material span | Short, fixed overlap depth | Matched fold/contact shading and a feathered inner join |
| Live content | Reflow within available paper width | Determine document height | Ordinary HTML; normal browser scrolling |

Prototype starting dimensions could be a 512 CSS px square paper tile and an approximately 64 CSS px roll thickness. These are calibration examples, not final art dimensions. Increasing page width must not increase either dimension. If small containers need thinner rolls, choose a deliberate smaller size at a container breakpoint rather than making roll height proportional to all page widths. Avoid percentage-based decorative widths and overlaps. Content spacing can remain responsive, with a maximum where appropriate.

This is conceptually nine-slice construction. Prefer explicit layers to one full-scroll `border-image`: the paper field, edges, roll centers, corner shapes, and transitions need independent sizing, anchoring, and overlaps. `border-image` remains an option for a simple frame, but does not repair incompatible source art. Prefer `repeat`, not `round` (rescales tiles to fit) or `space` (inserts gaps).

## Asset preparation and seam control

The existing art is the visual reference, not a ready-to-repeat atlas. Its prominent foxing, creases, uneven illumination, and silhouettes would produce visible patterns or joins if blindly cropped and repeated. Some end details may be reusable, but the tileable field and strips need purpose-built preparation and inspection.

Prepare all pieces for one material together, at a consistent grain scale and light direction. Keep strong stains and creases out of the frequently repeating grain tile. If the result is too uniform, evaluate one restrained larger-scale mottling layer only after the basic assembly works.

Paper tiles must wrap horizontally and vertically; side strips must wrap vertically; roll strips must wrap horizontally. Check actual repeated assemblies, including partial tiles. An image generator's claim of seamlessness is insufficient verification.

Use a continuous base paper field wherever feasible. Place fold shadows and edge wear above it, with feathering toward the interior. Match structural attachment points between roll ends and paper edges. Author the outside silhouette with transparency; stop the rectangular base inside the edge strips so it cannot fill the torn-out areas. Prefer pre-authored alpha in long edge strips and local masks at the short cap joins to a mask or filter covering the entire long page.

Transparency softens residual joins; it cannot fix incompatible color, grain scale, lighting, or attachment geometry. Test edges on both light and dark backgrounds to detect halos. Bake matching alpha and color into WebP assets; keep text above decorations.

## Resolution and performance

Keep CSS dimensions constant and supply true 1x/2x artwork, with higher density if testing justifies it. For example, a 1024×1024 image can represent a 512×512 CSS px tile at 2x. Use `image-set()` for CSS backgrounds and `srcset` for image elements where applicable. Enlarging an existing low-resolution crop does not create additional detail.

CSS backgrounds paint repeated images without one DOM element per repetition. Replace the current tile-element count and its ResizeObserver with native background repetition. Theme loading can retain its existing coordinated swap and race guard. Content addition and resizing should require no decorative geometry calculations in JavaScript.

Keep the decorative element count fixed. Avoid per-scroll JavaScript, canvas repainting, animated noise, full-document filters, and forced full-document compositing. Tiling still has paint and image-decoding costs; constant DOM count does not prove constant total memory or smooth scrolling. Measure those on the eventual assets and browsers.

Use external, cacheable assets in an application, loading the active material set. An embedded standalone file may remain available for the demo. Record compressed bytes and decoded image dimensions; a small compressed file can still decode to substantial memory.

## Matched variants

Separate material identity from roll design in the manifest. A material owns its body tile and edge strips; a compatible roll design owns its top/bottom ends, repeating strips, transition artwork, and attachment dimensions. Bind approved combinations explicitly. Sharing wood details is possible, but paper-covered pieces must match their material. Do not recolor every piece independently at runtime and assume the result will match.

## Implementation sequence, when authorized

1. Preserve the last working renderer in a Git commit before changing it.
2. Prepare one coordinated material and roll set, initially the cool vellum/oak design because it exercises both paper and wooden end joins. Inspect tiled asset assemblies before replacing the current renderer.
3. Build the CSS construction for that one set in the working tree, retaining normal document flow and the demo's content/width controls. Remove width-dependent cap sizing and tile-count JavaScript.
4. Check joins and texture scale through continuous resizing and changing content height. Resolve the art and geometry before multiplying variants.
5. Add the other material/design combinations using the same manifest contract. Verify density selection, loading behavior, and performance; document asset limits and final geometry.

## Acceptance checks

- At 320, 375, 768, 1440, and 1920 CSS px, no horizontal overflow; text remains on the usable paper.
- Between wider viewports, roll thickness, end dimensions, edge width, grain scale, and overlap depth remain unchanged. Any narrow-container adjustment is deliberate and bounded.
- Check awkward non-tile-multiple widths and page heights, plus live resizing and browser zoom; no exposed gaps, repeated seam lines, dark/bright joins, or stretched grain.
- Short, long, and dynamically extended content all move the bottom roll to the actual document end. No internal scrolling pane.
- High-density screens select adequate assets; screenshots compare grain and sharpness at the same CSS scale.
- Light and dark surrounding backgrounds reveal no matte fringes or rectangular fill beyond torn edges.
- Decorative element count does not increase with document height. Inspect scrolling, decoded-image memory, loading, and resize behavior on Chromium, Firefox, Safari, and a representative mobile device. Set measured budgets before claiming performance equivalence.

## References

- [W3C CSS Backgrounds and Borders](https://www.w3.org/TR/css-backgrounds-3/): background repetition, sizing, and border-image behavior.
- [MDN background-repeat](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/background-repeat): repeat, partial tile clipping, round rescaling, and space gaps.
- [MDN border-image-slice](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/border-image-slice): the nine regions of a sliced frame.
- [MDN image-set](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/image/image-set): supplying alternative image densities.
- [MDN mask-image](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/mask-image): alpha-mask behavior.
