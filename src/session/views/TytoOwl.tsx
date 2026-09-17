// One filled path rather than two stroked outlines. At 18 pixels a stroked
// helmet and a stroked facial disc are concentric rings a pixel or two apart,
// and they fuse into a blob; the fill-rule knocks the disc out of the helmet
// instead, so the face is the gap and the two never touch. It also matches the
// source mark, where the helmet is filled cream rather than drawn.
//
// Filling also sidesteps Obsidian's stroke width. Its ribbon sets stroke-width
// 1.75px on the svg for a 24-unit lucide grid, which on this 100-unit grid
// would be a hairline, and overriding it per-element fights the theme.
//
// The glyph spans 83 of the 100 units, where the lucide icons beside it span
// 75. It is deliberately the larger of the two: the owl is a mark rather than a
// pictogram, and it carries more detail into the same 18 pixels.
//
// It is centred on its ink rather than its bounding box. The shape is widest at
// the crown and narrows to a chin, so centring the box leaves the weight high
// and opens a gap beneath it, which reads as uneven spacing in the ribbon.
//
// The face stops well short of the chin, so the helmet closes below it as a
// band rather than a point. Drawn to the source mark's proportions that band
// renders a fifth of a pixel wide at ribbon size and breaks into a detached
// grey dot; it now carries a full-opacity pixel across its width.
//
// The beak is dropped: at ribbon size it closes the gap between the eyes and
// turns the face back into a blob.
//
// Bare paths, with no wrapper, no viewBox and no dimensions: Obsidian supplies
// its own svg on a 0 0 100 100 viewBox, and the component below supplies one to
// match.
export const TYTO_OWL_PATHS = `
<path fill="currentColor" fill-rule="evenodd" d="M50 11.3C26 11.3 8.5 28.8 8.5 52.8v19.7c0 3.3 2.2 5.5 4.4 6.6l32.8 17.5a8.7 8.7 0 0 0 8.7 0l32.8-17.5c2.2-1.1 4.4-3.3 4.4-6.6V52.8C91.5 28.8 74 11.3 50 11.3ZM50 39.7c-6.6-9.8-19.7-10.9-27.3-3.3-8.7 8.7-9.8 22.9-4.4 34.9 5.5 9.8 17.5 18.6 31.7 20.7 14.2-2.2 26.2-10.9 31.7-20.7 5.5-12 4.4-26.2-4.4-34.9-7.6-7.6-20.7-6.6-27.3 3.3Z"/>
<g fill="currentColor">
  <path d="M26 59.4c7.6-2.2 14.2 0 17.5 4.4 2.2 3.3 2.2 6.6-1.1 7.6-4.4 1.1-9.8-1.1-14.2-4.4-3.3-2.2-5.5-5.5-5.5-6.6 0-1.1 1.1-1.1 3.3-1.1Z"/>
  <path d="M74 59.4c-7.6-2.2-14.2 0-17.5 4.4-2.2 3.3-2.2 6.6 1.1 7.6 4.4 1.1 9.8-1.1 14.2-4.4 3.3-2.2 5.5-5.5 5.5-6.6 0-1.1-1.1-1.1-3.3-1.1Z"/>
</g>
`

// Sized from the font rather than in pixels, so the mark matches whatever text
// it sits beside and follows its colour through currentColor.
export const TytoOwl = () => (
  <svg
    viewBox="0 0 100 100"
    width="1em"
    height="1em"
    role="img"
    dangerouslySetInnerHTML={{ __html: `<title>Tyto owl</title>${TYTO_OWL_PATHS}` }}
  />
)
