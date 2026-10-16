# Photographic reconstruction and vessel insertion — 2026-10-16

The request is to reduce the generated image's cutout appearance and correct impossible stem-to-vessel joins. The user supplied a Gemini critique as a hypothesis, then rejected the first generated samples because the right-hand stems still appeared attached to the outer rim.

## Comparison performed

One unchanged 1600 × 1600 exported first-run draft was used for every image. It contains cherry blossom, calla lily, eucalyptus, garden rose and camellia in the aubergine round vase. All prompts request a square image, the same inventory, vessel and recognizable composition. Images were generated with the built-in image generation tool; these are not Gemini outputs. No fixed random seed is available. Comparisons are qualitative samples, not a benchmark or a guarantee.

| Variant | Change | Observed result |
| --- | --- | --- |
| A | Existing September 27 direction with current scene metadata | Retains the layout, but the right-side insertion remains ambiguous/outside the lip. |
| B | Adds gravity, support, shared side light, bounce and contact shadows | Shadows improve; the right-side stem still reaches the edge of the neck. Rejected for insertion. |
| C | Rebuilds a single photographed scene; permits depth and proportion corrections | Softer depth and more consistent surfaces; connection remains too close to the rim. Not selected. |
| D | C plus an explicit construction priority before style: reroute lower stems through the interior ellipse with clearance, then hide descending bases behind the front lip | Lower stems converge inside the opening rather than ending on the exterior glaze. Selected as the stronger direction. |
| D repeat | Same D prompt and same original draft | Again shows the lower stems entering the inner opening. Still only one repeated composition, not proof of reliability for all arrangements. |

The first repeat attempt encountered a generation connection failure; the retry completed. No generated images were manually painted or retouched.

## Production behavior

- Physical attachment takes priority over copying an inaccurate draft, in all three refinement modes.
- Necked/tall vessels explicitly require lower stems within the opening and clearance from its inner edges.
- Wide bowls retain distributed interior support; multiple openings stay separate.
- Kenzan preserve pins and shallow water; transparent glass preserves submerged stems and refraction. Neither receives the opaque-neck hiding rule.
- Layer annotations describe upper growth toward the viewer, never bases attached outside the vessel.
- Reconstruct one lighting environment across plants, vessel and surface, with weaker room bounce, contact shadows and depth-sensitive edges. Do not preserve highlights baked into the sprites.
- Measured dimensions remain approximate physical references. Invalid scale does not create fictitious measurements.
- Species-specific stiffness remains: flexible stems can bend under their own weight; woody branches are not automatically made limp. Nothing requires every branch to touch the table.
- Materials and origin counts, split pieces, user notes, three refinement modes, three image formats and both manual provider handoffs are retained.

The editor's artwork and source material sizes are unchanged. This changes the instructions exported in the image pack; the site still does not call an image generation API.

## Verification

- Prompt tests cover all studies and modes, origin counts, calibration references, guide semantics and all catalog vessel support types.
- Browser QA checked the phone's direct ZIP, all three prompt modes and the dialog ZIP with Gemini and square format selected.
- Both archives contain the new priority and photographic reconstruction instructions. The optional layout-guide sentence only appears in the ZIP prompt.
- The selected D prompt is byte-for-byte equal to `buildPrompt()` for the comparison snapshot and options.

Original images, raw draft, exact A/B/C/D prompts and a side-by-side HTML viewer are saved under `outputs/prompt-comparison` in the task workspace. They are evaluation artifacts, not new website library assets.
