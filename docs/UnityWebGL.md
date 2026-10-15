# Unity WebGL atelier

The project in `unity/HanamaUnity` uses Unity 6000.3.26f1, the built-in render pipeline and Input System 1.20.1. The site remains static hosting, with the Unity player under `dist/unity`.

Unity owns the canvas renderer, alpha-based picking, direct dragging, the rotation handle, two-finger rotation/scaling, vase-mouth snapping, gesture feedback and pooled particles. The browser owns material selection, localization, the canonical composition JSON, the pruning mask algorithm, IndexedDB/localStorage, export and sharing. A completed gesture is committed back into the existing schema; a gesture has one undo checkpoint. Textures are sent only when the specimen or a scene layer changes. Pointer movement does not call the JavaScript compositor each frame.

`dist/unity-stage.js` owns loading, the lifecycle and the native event bridge. `HanamaGame.cs` implements the game loop and geometry. `HanamaBridge.jslib` passes discrete events back to the browser. Host integration is at the end of `dist/app.js`. Alpha pixels are retained on runtime-loaded textures for picking; texture and mesh resources are destroyed when an item disappears. The game does not require an online account or cloud save.

Free play, a three-step practice checklist, and photo mode use accessible HTML controls. Practice completion is based on committed gestures, chosen light/scene and a completed save, not a quality score. The original canvas remains available if WebGL loading fails. `composition.json`, cut data, work IDs, study links and the existing browser storage names stay compatible.

## Build

Install Unity 6000.3.26f1 with Web Build Support. Open the project once to import it. `HanamaBuild.Prepare` creates the scene/material via Editor APIs. `HanamaBuild.Build` reads `-buildOutput` and builds that scene for WebGL. It sets code stripping, size-oriented IL2CPP/LTO, a 64 MB initial / 512 MB maximum memory budget, and browser frame pacing. Gzip with the JavaScript decompression fallback supports static hosting that does not set Content-Encoding on Unity files. Data caching is enabled. `build.json` maps the generated loader/data/framework/wasm URLs for the site's loader.

Example:

```text
unity build <project-path> --target WebGL --execute-method HanamaBuild.Build --output-path <site>/dist/unity --allow-dirty-build
```

Use the site's existing static preview server, rather than `file://`. Editor, native runtime and browser measurements are different; test the actual WebGL build. Safari/device testing needs a Safari/iOS device and is separate from Chromium desktop/mobile emulation.

On this Windows host the process environment lacked `ALLUSERSPROFILE`. Supplying the correct ProgramData directory in the Editor launch process resolved Package Manager's undefined-path error. No machine-wide environment setting was changed. The original 2D template also pinned incompatible Input System and Collab Proxy packages; `Assets/Editor/Recovery/PackageRecovery.cs` uses PackageManager Client APIs to upgrade Input System and remove unused Collab Proxy.

Do not commit Library, Temp, Logs, UserSettings, generated solution files or live Pipeline state. Build output in dist is intentional so static Sites deployments can use it without a Unity Editor on the server.
