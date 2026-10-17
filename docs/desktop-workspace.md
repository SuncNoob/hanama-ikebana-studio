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

## Alignment correction

The left rail now overrides the old cut/erase button sizing and uses equal-width 44px rows, centered 20px icon holders and consistent label typography. The property and layer panels are actual flex children below the right-side controls rather than overlapping sibling grid cells with a fixed 240px offset. Their separator follows the controls' real height, including Japanese labels and font changes. Original mobile positions are restored when leaving desktop or entering immersive mode; the layer dock follows the property panel's current parent.

Browser checks covered 2559×1179, 2048×944, 1440×1000, 1366×768 and 1024×600 in three languages, plus phone layouts. Every visible tool's width, icon center and label center matched; properties and layers start at least 10px below the entrance buttons. Actual Unity WebGL checks also passed in Japanese, including layers and the immersive-mode round trip.
