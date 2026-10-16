# HANAMA · Light & Flowers

[中文](README.md) · [English](README.en.md) · [日本語](README.ja.md)

A hands-on flower-arranging studio for placing botanicals, pruning stems, choosing vessels, and shaping the mood of a composition. Try it at [flowerist.org](https://flowerist.org/).

## Unity WebGL atelier

Pull a botanical to bend its stem while the root stays fixed and the crown moves as one form; drag the base to move the whole piece. Amber and green handles rotate and scale, with two-finger gestures on mobile. An eight-segment chain uses six bounded FABRIK passes, neighbouring-curvature smoothing, broader botanical angle limits and frame-independent follow for softer steering. The root and segment lengths stay fixed, and the crown remains rigid. Releasing commits the angles currently visible on screen. The original grab point keeps following the pointer as the crown rotates, including when grabbed at a petal's edge. Damped wind and inertia remain separate; curves follow pruning, mirroring, undo and saved works.

The full default library offers **78 botanical types and 198 poses, including 11 foliage types in 23 poses, plus 35 vessels and 9 backgrounds**. Browse directly by type, colour or name. The 12 new editorial botanicals take priority as covers; earlier flowers, foliage and vessels remain directly available without a More flowers switch. Separate IDs preserve the original images in saved works, and all 50 editable studies remain. The nine backgrounds include three new editorial rooms, three earlier atelier rooms and the three classic Paper, Stone and Night settings. The new editorial series consists of AI-generated photographic artworks directed from one original generated master still life, with shared broad upper-left light, translucent petals and glazed reflections; these are not photographs of physical specimens. The opening arrangement pairs an apricot garden rose, burgundy camellia, cherry branch, calla lily and eucalyptus with a dark-glazed round vase. Original PNG, runtime WebP and exact prompts for the new series are recorded in `dist/assets/editorial/art-direction.json` and `environment-art-direction.json`.

The flower canvas leads the first screen, with eight primary tools always beside it: scissors, eraser, Length, Flip, Copy, Layers, Undo and Redo; mobile uses two rows of full-size buttons. Length opens a slider directly, changing the lower stem while keeping the flower head the same size. Cutting and erasing require no inspector or Done step; tap the active tool again to leave it. Light shows all background and lighting options directly, with independent choices and controls for direction, strength and breeze. The title, saving and advanced adjustments live in Keep, alongside sharing, export and Take a photo, which downloads the current Unity view as a 1600 × 1600 PNG. Stems can remain outside the vase without persistent reseating reminders. Optional sound and system reduced-motion preferences are supported.

The interactive buffer's longest edge is capped at 720 pixels on desktop and 640 on narrow viewports; photos keep a separate 1600-pixel output. Two renderer-stage software-GPU comparisons at an equal 598 × 598 buffer reduced mean frame-scheduling intervals by approximately 21–26%. Those samples predate the current 12-material photographic collection and do not establish its full workload or guarantee a frame rate across devices. Source is in `unity/HanamaUnity`; see [UnityWebGL.md](docs/UnityWebGL.md) for implementation, measurement conditions and building.

## Create an arrangement

1. Open Flowers, browse the complete flower and foliage library by type, colour or name, and select a vessel.
2. Pull the flower to bend, drag its base to place it, and use handles or two fingers for rotation and scale. Detailed controls are under Keep → More → Adjust.
3. Click Length beside the canvas and drag the slider to stretch the lower stem while retaining the flower-head size. The adjacent Undo and Redo buttons reverse or restore edits.
4. Use Flip to mirror a botanical, Copy to add another, and Layers to select pieces and change their order around the vessel.
5. Use scissors to separate a local attachment into an independent piece, or refine details with the eraser; tap the active tool again to leave it. Unbend restores the resting shape.
6. Choose from all backgrounds and lighting options directly in Light, then name, save or photograph the work in Keep. The AI image pack and secondary actions remain in expanded controls.

The stage represents a 100 cm square, with material size constrained to real scale and stem length adjustable separately. It supports up to 24 material layers. Existing poses, vessels, pruning, recipes, sharing, backups and import remain available. The interface supports Chinese, English and Japanese.

## Run locally

The site is static and needs no web dependencies:

```sh
python3 -m http.server 4173 --directory dist
```

Open `http://localhost:4173/`. Run the automated checks with:

```sh
node --test tests/*.test.mjs
```

`dist/` contains the site and all runtime assets; `tests/` covers key interactions and asset integrity; `docs/` records sources and design decisions. The site does not depend on local source-asset archives.

## Saving, generating, and sharing

The current draft is stored in browser localStorage, while the gallery uses IndexedDB. Clearing browser data removes those local copies. In My Works, Back up all works downloads one .zip with every draft, preview and photo; Restore from backup brings it back in any browser, keeping the newer copy of each work. A single draft can also be downloaded as `composition.json`. A draft-sharing link carries composition, pruning and window-light data, but not the generated final image; it opens on an arrival card where the visitor can continue the work or keep it, and a remix credits the work it came from. Every study has its own link (`/?study=<id>`), and Recipe makes a card that says what to buy and how long to cut each stem.

The image pack offers phone wallpaper (9:16, target 1440 × 2560), MacBook wallpaper (16:10, target 2880 × 1800), or a square photo. Choose ChatGPT or Gemini · Nano Banana, hand it the draft and prompt, then bring the resulting photo back to My Works. The prompt seeks natural light, true colour, tactile floral detail and breathing room while retaining the materials, main structure, vessel and overall light. The square draft remains a reference; it is never stretched into the wallpaper frame. The pack includes `draft.png`, an optional `composition-guide.png`, `prompt.txt`, `composition.json` and trilingual instructions. Pixel dimensions are targets and depend on the chosen image tool. The site calls no image-generation API and contains no API keys.

## Copyright and license

Original code, pages, and project documentation © 2026 Marko Sun. All rights reserved. Code files carry `LicenseRef-Hanama-Proprietary`; see [LICENSE](LICENSE) for the full terms. Ordinary use of the hosted site does not grant permission to copy, modify, or redistribute its source. Images and third-party materials are outside this code license.

## Assets and rights

The library combines original generated artwork, adaptations from the user-supplied *The Flower Book*, and separately credited third-party images. Book-derived assets are not independent original photography. Publishing the site or licensing its code does not grant new reuse rights for third-party images. See the [asset record](docs/asset-sources.md), [book extraction record](docs/book-photo-extraction.md), and [trilingual asset notice](docs/ASSET-NOTICE.md).

Ikebana schools and *The Flower Book* are creative references. The on-screen guidance is not formal school instruction or botanical identification advice.
