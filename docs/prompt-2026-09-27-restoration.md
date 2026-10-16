# 2026-09-27 photographic prompt restoration

Historical record: the natural-light and tracing instructions below were superseded on 2026-10-16 by the user-requested [physical reconstruction comparison](prompt-realism-comparison.md). Material counts, refinement modes and format support remain. The current generation prompt is in `dist/prompt.js`.

The photographic direction in `dist/prompt.js` was restored from the repository's actual September 27 source, following the request to return to that prompt. It is not a newly invented approximation of the old style.

## Historical source

- Last commit on September 27: `108095d6339be06c7b4631dc8a55ff784ff3402e`, 2026-09-27 17:08:07 +0800 (`Export editable Compositor layer projects`).
- Last change to `dist/prompt.js` that day: `1014bda564d474666693f1d4c15322f9bf828983`, 2026-09-27 14:20:44 +0800 (`Make artwork naming and image pack flow clearer`).
- Both commits contain prompt blob `61e368731b4ca1e11a6f8966fa979b1bce4e8855`.
- To inspect the original: `git show 108095d6339be06c7b4631dc8a55ff784ff3402e:dist/prompt.js`.

## Restored wording

The square-output opening is restored verbatim:

> Create an image from the attached draft image: a square professional photograph of a real floral arrangement. Keep the draft's recognizable composition, selected flowers and count, vessel and main negative spaces.

All three historical refinement phrases are restored: “Make a gentle florist refinement.”, “Gently refine the stem rhythm and depth within the same design.”, and “Make only the small corrections needed for physical realism.”

The central natural reconstruction and light instructions are restored verbatim:

> Treat the draft as design intent, not a tracing. Allow small shifts in flower facing, stem curves and depth for natural growth and gravity.

> Keep the overall lighting and atmosphere; let local shadows and reflections follow the real forms.

The original species-appropriate individuality phrasing, four botanical detail variations, “Poetic theme” label, and user-note precedence sentence are also restored. The later editorial/wallpaper-worthiness treatment, rigid flower-angle instructions and explicit window-patch geometry are removed. Canvas light remains visible in the reference image; the text no longer requires the generator to reconstruct a hardcoded window pattern.

## Compatibility retained

This restores the photographic direction, rather than replacing the entire module with its older, smaller API. The following later functionality stays available:

- Phone, MacBook and square output sizes. Only the opening's shape word changes to portrait or landscape for the corresponding format; output dimensions are specified separately.
- ChatGPT and Gemini handoff, the generation ZIP, multilingual readmes and file names.
- One accurate material list, florist units, color names and one count per original stem even after scissors create multiple pieces.
- Real vessel supports, shallow water around kenzan, visible stems through glass, and measured scale information when valid.
- Leaf/bark detail for foliage-only arrangements, instead of requesting petals on branches.
- Front-of-rim relationships and the optional layout-guide explanation.
- An untouched first-run intention remains a translated mood cue; explicit user notes retain the historical priority over setting and light.
- The night-scene spring-mood correction remains, avoiding a simultaneous request for morning light.

`tests/prompt.test.mjs` covers the restored wording, all studies and modes, counts, supports, dimensions and handoff. `tests/ambience.test.mjs` verifies that every canvas-light selection uses the historical natural-light sentence without introducing an invented window patch. These checks establish what the pack contains; final image appearance depends on the external image generator.
