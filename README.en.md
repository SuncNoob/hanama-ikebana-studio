# HANAMA · Light & Flowers

[中文](README.md) · [English](README.en.md) · [日本語](README.ja.md)

A hands-on flower-arranging studio for placing botanicals, pruning stems, choosing vessels, and shaping the mood of a composition. Try it at [flowerist.org](https://flowerist.org/).

## Unity WebGL atelier

Pull a botanical to bend its stem while the root stays fixed and the crown moves as one form; drag the base to move the whole piece. Amber and green handles rotate and scale, with two-finger gestures on mobile. An eight-segment, fixed-length chain uses constrained FABRIK, material-specific bend limits and damped wind/inertia to preserve flower-head shape. Curves follow pruning, mirroring, undo and saved works.

The main library offers **12 transparent botanicals with a photographic finish, three room backgrounds and three vessels**. These are AI-generated photographic artworks directed from one original generated master still life, with shared broad upper-left light, translucent petals and glazed reflections; they are not photographs of physical specimens. Blush, warm ivory and plum rooms support the collection. The opening arrangement pairs an apricot garden rose, burgundy camellia, cherry branch, calla lily and eucalyptus with a dark-glazed round vase. Add presents the new series; More retains earlier catalogs, separate IDs keep saved works on their original images, and all 50 editable studies remain. Original PNG, runtime WebP and exact prompts are recorded in `dist/assets/editorial/art-direction.json` and `environment-art-direction.json`.

The flower canvas leads the first screen, with Flowers, scissors, eraser and Undo in one compact row. The title, saving and advanced adjustments live in Keep. Cutting and erasing no longer open an inspector or require a Done step; tap the active tool again to leave it. Window, Overcast, Evening and Moon are the four presets. Stems can remain away from a vase without persistent reseating reminders. Keep saves, shares and exports; Take a photo downloads the current Unity view as a 1600 × 1600 PNG. Breeze, optional sound and system reduced-motion preferences are supported.

The interactive buffer's longest edge is capped at 720 pixels on desktop and 640 on narrow viewports; photos keep a separate 1600-pixel output. Two renderer-stage software-GPU comparisons at an equal 598 × 598 buffer reduced mean frame-scheduling intervals by approximately 21–26%. Those samples predate the current 12-material photographic collection and do not establish its full workload or guarantee a frame rate across devices. Source is in `unity/HanamaUnity`; see [UnityWebGL.md](docs/UnityWebGL.md) for implementation, measurement conditions and building.

## Create an arrangement

1. Open Add, choose a curated botanical or browse the full library by type, colour or name, and select a vessel.
2. Pull the flower to bend, drag its base to place it, and use handles or two fingers for rotation and scale. Adjust opens detailed controls.
3. Use scissors to separate a local attachment into an independent piece, or refine details with the eraser. Unbend restores the resting shape.
4. Choose the setting in Atmosphere, then name, save or photograph it in Keep. The AI image pack and secondary actions remain in expanded controls.

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
