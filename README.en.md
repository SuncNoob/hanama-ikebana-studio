# HANAMA · Atmospheric Flower Arranging

[中文](README.md) · [English](README.en.md) · [日本語](README.ja.md)

A hands-on flower-arranging studio for placing botanicals, pruning stems, choosing vessels, and shaping the mood of a composition. Try it at [flowerist.org](https://flowerist.org/).

## Create an arrangement

1. Browse by material type, color, or name. Color filtering checks every pose of a botanical family and shows matching variants.
2. Choose a vessel and place materials on the canvas. Move, rotate, scale, flip, and reorder layers. On mobile, use two fingers to rotate and scale.
3. Cut a stem into two independently movable layers, or refine a detail with the eraser. Adjust stem length separately from the size of the flower or foliage.
4. Name the work, choose its light and setting, then export a generation pack. Use its draft and short prompt in your own image-generation tool; import the result into your gallery afterward.

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

The current draft is stored in browser localStorage, while the gallery uses IndexedDB. Clearing browser data removes those local copies, so download `composition.json` for a restorable backup. A draft-sharing link carries composition and pruning data, but not the generated final image.

The generation pack includes `draft.png`, an optional `composition-guide.png`, `prompt.txt`, `composition.json`, and instructions. Its short prompt preserves the materials, main structure, vessel, and overall light while allowing small physical corrections. The site does not call an image-generation API or contain API keys.

## Assets and rights

The library combines original generated artwork, adaptations from the user-supplied *The Flower Book*, and separately credited third-party images. Book-derived assets are not independent original photography. Making this repository public does not grant a new reuse license for third-party images. See the [asset record](docs/asset-sources.md), [book extraction record](docs/book-photo-extraction.md), and [trilingual asset notice](docs/ASSET-NOTICE.md).

Ikebana schools and *The Flower Book* are creative references. The on-screen guidance is not formal school instruction or botanical identification advice.
