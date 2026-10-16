# Editorial flower reference scale

The generated editorial photographs contained large close-up flowers, but their source frames were assigned the height of an entire florist's stem. This made the flower heads disproportionately large against an unchanged vessel. For example, the white cylinder is 31 cm tall and 9.38 cm wide in the editor; the original rose image placed its principal flower at roughly 20 cm across. The Unity stage received these dimensions directly and did not add an extra enlargement.

These are reference proportions for generated artwork, **not precise botanical measurements or identification of the depicted cultivar**. The corrected source heights use visible principal-flower proportions, the older library's calibrated specimens and horticultural references. Seven close-up flowers are reduced. The other five branch and foliage materials retain their previous size.

| Material | Previous source-frame height (cm) | Reference source-frame height (cm) | Principal visual comparison |
| --- | ---: | ---: | --- |
| Garden rose | 42 | 22 | Main flower approximately 11 cm across; older `photo-rose` head box is 10.4 × 10 cm |
| Camellia | 36 | 21 | Main flower approximately 9–10 cm across |
| Calla | 58 | 36 | Spathe approximately 13–14 cm across; older ivory calla images span 11.2–16.9 cm in their measured head boxes |
| Cosmos | 48 | 17 | Main flower approximately 6 cm across; older `photo-cosmos` is 5 × 4 cm |
| Iris | 48 | 25 | Principal flower approximately 11–12 cm across; older iris references span approximately 9–11 cm |
| Chrysanthemum | 46 | 28 | Principal disbud flower approximately 16 cm across; older `photo-chrysanthemum` is 16 × 15.3 cm |
| Ranunculus | 42 | 18 | Main flower approximately 8 cm across; older `photo-ranunculus` is 7.5 × 7.2 cm |
| Cherry branch | 56 | 56 | Retained |
| Eucalyptus | 52 | 52 | Retained |
| Pine | 64 | 64 | Retained |
| Pampas | 68 | 68 | Retained |
| Maple | 52 | 52 | Retained |

The principal-flower estimates use the visible flower itself, excluding separate buds and leaves where distinguishable. The existing `headCm` field is a coarse upper-region alpha bounding box and can include these other parts, so it is not treated as the precise flower diameter. Its centimetre values are rescaled proportionally to the new source height; measured crown and stem-root UV coordinates remain unchanged.

The [RHS profile for Camellia japonica](https://www.rhs.org.uk/plants/2845/camellia-japonica/details) describes flowers 6–10 cm across. The [North Carolina Extension cosmos profile](https://plants.ces.ncsu.edu/plants/cosmos-bipinnatus/common-name/garden-cosmos/) describes small daisy-like flowers, and the [ranunculus profile](https://plants.ces.ncsu.edu/plants/ranunculus-asiaticus/common-name/persian-buttercup/) lists a typical 1–3 inch size class. These support the general scale choices; a generated image is not evidence of a particular living plant's exact dimensions.

## Geometry and compatibility

- The `editorialScale` table in `real-scale.js` establishes the source-image reference size. It does not rewrite saved item sizes.
- New default compositions and newly inserted materials opt into the existing lower-stem split. Only the lower photographed stem stretches from 60% to 240%; flower-head dimensions stay fixed while placement solves for a useful reach and a seated base.
- Loading old work keeps its saved `h`, crop, trim, length, split and cuts. A photograph with no stored split continues to use the old geometry.
- The ordinary natural range remains 80%–125% for layout and reference-size checks. Interactive editing has a separate 40%–250% range, capped at the document's 95 cm limit and expanded to include the current saved size. A move or rotation at scale 1 cannot force an old item back into a new range.
- The explicit reference-size reset returns a pure patch. For an unpruned editorial item it preserves the lower stem's physical length within the existing stretch limits. For a pruned piece it changes only size, retaining source cut geometry. The caller keeps the root or detached cut end anchored.

The regression tests cover old geometry, scale-1 preservation, flower protection while extending stems, seated new defaults and safe explicit resets.
