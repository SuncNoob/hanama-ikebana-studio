# Desktop canvas workspace — 2026-10-17

Canvas zoom had been moved into Works → More, and the native canvas stopped wheel events before the host could zoom. Stacking every desktop control below a square canvas also consumed its usable height.

The desktop workspace (at least 1024 × 600 CSS pixels) now has a left tool rail, a central canvas, and a right column for direct stem controls, material entrances and the existing property/layer panels. Existing elements are moved between desktop and mobile containers rather than duplicated. On smaller screens the original tool rows return. Photo mode returns the elements to the immersive layout, then restores the desktop workspace on exit.

The canvas zoom controls are always on the workbench. View scale spans 50–300%; clicking its percentage fits the unzoomed canvas to the available work area. Ctrl+wheel or trackpad pinch zooms around the pointer; Ctrl/Cmd with +, − or 0 provides keyboard zoom and fit. Space+drag and middle-button drag pan the view without editing stems. Native Shift/Alt+wheel retains its original stem operations, avoiding duplicate host/native edits.

## Verification

- DOM/bridge QA: desktop 1440×1000, 1366×768 and 1024×600; phones 390×844 and 320×568; short landscape 568×320; Chinese, English and Japanese. Title, pack download, zoom, size, flower/vessel entrances and common tools remain reachable without horizontal overflow.
- The desktop canvas is 810px at 1440×1000 and 578px at 1366×768, compared with the former 650px and 418px respectively. It stays square; enlargement does not alter flower sizes or the exported artwork.
- Actual Unity WebGL QA: desktop layout, Ctrl+wheel, 75% view, fit, Space panning without changing the composition, right-side layer panel, immersive-mode round trip and phone zoom controls.
- Full existing test suite: 247 passed, one pre-existing skip.

Only host layout/view navigation changed; this release does not rebuild the native Unity binary. Desktop and mobile canvas buffers keep their existing pixel budgets.
