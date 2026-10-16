# Unity WebGL atelier

`unity/HanamaUnity` uses Unity 6000.3.26f1, the built-in render pipeline and Input System 1.20.1. Static hosting serves the player from `dist/unity`; arranging flowers does not require an online account or cloud-save service.

## Renderer and document ownership

Unity owns the 2.5D canvas, alpha-based picking, live stem deformation, gestures and native camera capture. The browser owns material selection, localization, canonical composition JSON, pruning masks, browser storage and portable exports. `dist/atelier.js` manages loading and the event bridge. `HanamaGame.cs` and `OrganicStem.cs` implement rendering and gestures; `HanamaBridge.jslib` sends discrete events to the host at the end of `dist/app.js`.

A completed gesture creates one undo checkpoint. Selection clicks add no history; Escape or pointer cancellation restores the previous transform and curve. The host checks texture keys before rasterization and encoding. Pointer previews send transform/curve data rather than rebuilding scene textures. Removed items release their textures, materials and meshes.

## Editorial photographic artwork and living stems

The main art set contains 12 individually generated transparent botanicals, three backgrounds (blush, ivory and plum), and three vessels. A single original generated master still life directs the shared photographic material response: broad warm upper-left light, thin translucent petals, natural tissue detail and glazed reflections. These are AI-generated photographic artworks, not photographs of physical specimens. The initial five-piece garden combines cherry, calla, eucalyptus, apricot garden rose and burgundy camellia in a dark-glazed round vase. Add shows only the new 12 botanicals and three vessels; More exposes earlier catalogs. New independent `editorial-` IDs preserve saved works on their original images. Original PNG, runtime WebP and exact generation prompts are recorded under `dist/assets/editorial/art-direction.json` and `environment-art-direction.json`. The earlier `dist/assets/atelier/art-direction-v1.json` remains an archive of the previous series.

Each botanical has a 4 × 16 mesh driven by eight equal-length segments. Pulling its upper part uses three bounded FABRIK forward/backward iterations, fixing the root, preserving lengths and constraining botanical angles. `asset.bendLimit` sets the material's bend limit; the upper crown is a rigid form so its petals are moved rather than stretched into the curve. Dragging the base moves the whole piece. Rotation/scale handles and two-finger rotation/scaling remain available, and Unbend restores the resting shape.

`item.flex` stores eight absolute directions in radians from local upward Y, bounded to −0.6…0.6. Missing/zero flex preserves the old geometry path. Chain extent comes from the original source-to-pivot distance, not cropped sprite height. `dist/flex.js`, `geometry.js` and the final Canvas2D compositor share that deformation before mirror/rotation. Pruning masks stay in unbent source coordinates; the Unity texture is not pre-bent. Portable files store the resting curve, not transient wind.

Slow multi-frequency gusts drive damped segment motion with stable phases per stem ID. The target angle scale ranges from 0.026 to 0.052 radians by botanical flexibility and fades in over 0.85 seconds; upper segments share the same wind offset to keep the crown intact. A held stem and all stems during cutting/erasing use their saved resting curves, keeping source-space pruning aligned with the picture. Breeze off, reduced-motion preferences and a hidden studio restore the resting curve. The shader preserves the source image's modeling and adds broad wrapped illumination; flower colour variation is no longer converted into relief normals.

Shadow alpha is downsampled to 128 × 128, padded and separably blurred only when the specimen texture changes. The cached texture follows the stem mesh and costs one fragment texture lookup. The upper silhouette is softer and lighter. `organic-room.js` preloads/decodes the blush, ivory and plum rooms before the host caches its background. The rooms share a frontal viewpoint and a softly lit tabletop; dusk is a gentle grade of the warm room. Ground contact is a separate diffuse pass. Optional vessel `footY` metadata positions the actual source-image foot on the shared table contact at stage y=85.5; transparent source padding no longer determines where a low bowl appears to stand.

The supplied Magnific reference endpoint returned HTTP 403. Only metadata from three publicly accessible pages could be read; their image pixels were not inspected or copied. Art direction therefore uses the project's own newly generated master, not a claimed visual match to inaccessible third-party pictures.

The approach draws on [three.js contact shadows](https://threejs.org/examples/webgl_shadow_contact.html), [PCSS](https://threejs.org/examples/webgl_shadowmap_pcss.html), [THREE.IK](https://github.com/jsantell/THREE.IK) and [Al-ro's low-poly grass](https://al-ro.github.io/projects/grass/). It adapts soft-shadow, constrained-chain and economical deformation ideas to photographic cards; it does not add those JavaScript renderers or a full PCSS shadow-map pipeline to Unity.

## One workbench

The canvas comes first, directly beneath a compact header. One row holds Flowers, scissors, eraser, Undo, Atmosphere and Keep. The work title, gallery and advanced adjustments live in Keep; the canvas has no floating HUD or zoom pill. Cutting and erasing never open the inspector, mode banner or Done flow. A successful split keeps both pieces immediately and returns to arranging; erasing continues until the same tool is tapped again or Escape is pressed. Undo remains adjacent. Atmosphere exposes Breeze directly, with light tuning folded away. Stems may remain outside the vessel without persistent reseating reminders.

Window, Overcast, Evening and Moon are the four atmosphere presets. Generated rooms and gentle shading replace the earlier hard window treatment on the native canvas. Existing gallery, recipe, study links, sharing, JSON import/export and AI image packs remain. Controls support Chinese, English and Japanese.

Take a photo captures the Unity camera at 1600 × 1600, including native shading with editing handles hidden. This resolution is independent of the interactive buffer. Capture/startup failures offer recovery paths; the original canvas remains available if WebGL cannot start.

## Pixel budget and measured limits

The interactive buffer's longest edge is capped at 720 pixels on desktop and 640 when viewport width is at most 900 pixels; device pixel ratio is also capped at two. Stem simulation runs at up to 30 Hz off-gesture, drops to 20 Hz when frame time exceeds 50 ms, reuses arrays/meshes and avoids updates when unchanged. Presentation pauses outside the active studio. Optional synthesized interaction sound starts after user input and is off by default.

An instrumented Edge 152 / ANGLE SwiftShader comparison against `f99454e`, with the same 598 × 598 buffer and compositions, reduced mean requestAnimationFrame intervals from 28.56 to 21.07 ms in the default three-stem scene and from 35.54 to 28.03 ms in the nine-stem spring scene: approximately 26% and 21%. These 7.5-second software-GPU samples predate the current 12-material editorial set. They measure browser scheduling under the earlier workloads, not hardware GPU time, the final five-stem default, all new materials or a guaranteed frame rate. Safari/iPhone hardware needs separate validation.

## Build

Install Unity 6000.3.26f1 with Web Build Support and open the project once to import it. `HanamaBuild.Prepare` creates the scene/material through Editor APIs. `HanamaBuild.Build` reads `-buildOutput` and builds that scene for WebGL. Settings include stripping, size-oriented IL2CPP/LTO, 64 MB initial / 512 MB maximum memory, gzip with JavaScript decompression fallback, and data caching. `build.json` maps loader/data/framework/wasm URLs.

```text
unity build <project-path> --target WebGL --execute-method HanamaBuild.Build --output-path <site>/dist/unity --allow-dirty-build
```

Use HTTP preview instead of `file://`, and test the actual WebGL build. Editor, native-runtime and browser measurements are different.

On this Windows host, supplying the correct ProgramData path as `ALLUSERSPROFILE` in the Editor launch process resolved Package Manager's undefined-path error; no machine-wide environment setting changed. `Assets/Editor/Recovery/PackageRecovery.cs` uses PackageManager Client APIs to upgrade the original template's incompatible Input System package and remove unused Collab Proxy.

Do not commit Library, Temp, Logs, UserSettings, generated solutions or live Pipeline state. Build output under `dist` is intentional so static Sites hosting can run it without a Unity Editor.
