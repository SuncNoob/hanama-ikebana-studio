# The Flower Book · v8 reading and asset notes

Source: user-supplied PDF of *The Flower Book*, Rachel Siegfried, DK. Printed page numbers below are four less than PDF page numbers. The unrelated advertisements preceding the book were ignored. Only selected botanical images were adapted at the user's explicit request; the PDF and full-page renders remain outside the public website.

## Design interpretation

- pp. 10–11: choose containers by silhouette, opening, material and the movement they allow. Vessel cards now carry short aesthetic pairing cues instead of fixture jargon.
- pp. 12–21: consider form before color; distinguish framework, focal flower, foliage and a final accent. Let flower faces vary in direction and depth. The editor surfaces one relevant sentence at a time.
- pp. 14–15: wire supports and pin holders. Three opaque wide-mouth vessels now use concealed reusable wire cages instead of a misleading “eco floral foam” label. Existing vessel openings and saved arrangements remain compatible.
- pp. 64–67: cherry branches and a substantial pitcher inspired the first editable study.
- pp. 108–111: iris, height variation, a shallow container and visible gaps inspired the second.
- pp. 156–159: lower focal chrysanthemums, silver-green foliage and warm/cool contrast inspired the third. It is an original, much smaller exercise, not a reproduction of the book arrangement.
- Notes for species not profiled in the selected source pages are the atelier's own editorial extensions of those principles, not quotations or cultivar guidance from the book.

The product puts the arrangement first: angle and size stay immediately available, while stem length and pruning open on demand. The three studies use the normal compositor and editable data. Opening a study saves the previous meaningful canvas before replacing it. No automatic aesthetic changes are applied to saved work.

## Photographic botanical adaptations

The user explicitly requested the book images in the material library. Six single-flower photographs spanning facing pages were used as editing targets through the built-in GPT Image tool. Processing removed typography/background, joined the split head, and reconstructed a usable lower stem and foliage. These are **photo-derived AI adaptations**, not pixel-exact extractions, independent original photographs, or a claim of a new license to the source imagery. Original folds, asymmetry and coloration were the visual targets. Source credit remains visible in the variant picker and materials dialog.

| Asset | Printed pages | Appearance |
|---|---|---|
| `dist/assets/book-anemone.png` | 30–31 | Violet-blue anemone, dark center, uneven petal overlap |
| `dist/assets/book-hellebore.png` | 44–45 | Ivory double hellebore with burgundy speckles |
| `dist/assets/book-ranunculus.png` | 68–69 | Deep crimson ranunculus with irregular layered petals |
| `dist/assets/book-tulip.png` | 76–77 | Ivory and green-striped tulip |
| `dist/assets/book-iris.png` | 108–109 | Mauve iris with yellow-white veining |
| `dist/assets/book-peony.png` | 128–129 | Deep pink double peony with soft ruffled petals |

Each PNG retains the generated 1024 × 1536 RGBA data and alpha channel. No digital recoloring was applied. Runtime dimensions, stem extension split and insertion anchor are in `dist/book-catalog.js`; exact processing prompts are in `docs/book-image-prompts.json`. The source images show flower heads, so added stem/leaf details should not be used for scientific identification. Old variants remain selectable and old compositions continue to reference their original assets.

## Generation prompt

The final-arrangement prompt is intentionally short: design identity and flower inventory, small physical corrections, coherent overall light, and one natural botanical variation phrase. It has no individual coordinate/angle lock, no mandatory blemishes, and no paragraph of constraints per stem. The draft is design intent; local forms and shadows may change to make the arrangement physically credible. Generation remains external and its adherence is not guaranteed by the editor.
