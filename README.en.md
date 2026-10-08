# HANAMA · Atmospheric Flower Arranging

[中文](README.md) · [English](README.en.md) · [日本語](README.ja.md)

A hands-on flower-arranging studio for placing botanicals, pruning stems, choosing vessels, and shaping the mood of a composition. Try it at [flowerist.org](https://flowerist.org/).

## Create an arrangement

1. Browse by material type, color, or name. Color filtering checks every pose of a botanical family and shows matching variants.
2. Choose a vessel and place materials on the canvas. Move, rotate, scale, flip, and reorder layers. On mobile, use two fingers to rotate and scale. Dragging a flower swings its stem around the vessel mouth; drag the base dot to move the whole stem. Stems that leave the vessel are marked and can be seated again in one step, and a cut-off piece goes back in by its real cut end.
3. Cut a stem into two independently movable layers, or refine a detail with the eraser. Adjust stem length separately from the size of the flower or foliage.
4. Name the work and choose its light and setting; the Light chip adds morning, midday, evening or moonlight through a window, with the arrangement's shadow on the wall following every change. Then export a generation pack. Use its draft and short prompt in your own image-generation tool; import the result into your gallery afterward.

Every material appears at its true size (the canvas is a 100 cm square), and size stays within 80–125% of life. Drawn stems follow each species' real thickness, colour and cut length, and enter the vessel mouth, kenzan or opening; shallow basins show their water. New stems land in a shin / soe / hikae position with automatic depth, and the Ikebana proportion guide in the toolbar draws the three lines and targets for the chosen vessel (upright or slanting, left- or right-handed), with a one-tap "Put on this line". An empty canvas offers three ways to start.

Zoom the canvas with a trackpad pinch, Ctrl+scroll or the buttons beside it, or double-tap the paper on a phone; Shift+scroll turns the selected stem and Alt+scroll sizes it. In the library, In season filters by the current season and Recent re-adds the exact pose.

The canvas supports up to 24 material layers. The current library has **78 botanical families, 171 poses, and 31 vessels**. The inspiration book contains **50 editable studies**, browsable by arrangement scale, season, and school influence; each one opens directly in the atelier. The interface supports Chinese, English, and Japanese.

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
