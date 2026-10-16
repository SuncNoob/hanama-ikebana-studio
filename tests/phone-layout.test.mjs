// SPDX-FileCopyrightText: 2026 Marko Sun
// SPDX-License-Identifier: LicenseRef-Hanama-Proprietary
// A14: phones and small windows. The layouts themselves are checked in a browser; these tests pin the wiring they rely on.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const readSource=(file,encoding)=>readFileSync(file,encoding).replace(/\r\n/g,'\n');
import {dist} from './helpers/catalog.mjs';

const app=readSource(`${dist}app.js`,'utf8'),html=readSource(`${dist}index.html`,'utf8');
const style=readSource(`${dist}style.css`,'utf8'),polish=readSource(`${dist}ui-polish.css`,'utf8'),drawer=readSource(`${dist}material-drawer.css`,'utf8');
const css=style+drawer+polish;
/** The body of the first `@media <query> {` block whose query matches (balanced braces). */
function mediaBlock(source,query){
 const start=source.search(query);if(start<0)return '';
 let depth=0,i=source.indexOf('{',start);const open=i;
 for(;i<source.length;i++){if(source[i]==='{')depth++;else if(source[i]==='}'&&--depth===0)break}
 return source.slice(open+1,i);
}

test('index.html: one canvas frame holds the canvas, its toolbar, the zoom pill and the cut choice',()=>{
 const frame=html.slice(html.indexOf('<div class="stage-frame">'),html.indexOf('<div id="guide-panel"'));
 assert.ok(frame.startsWith('<div class="stage-frame">\n<div id="canvas-viewport"'),'the frame opens on the canvas');
 for(const part of ['class="stage-tools"','class="zoom-controls"','id="cut-choice"'])assert.ok(frame.includes(part),part);
 assert.match(polish,/\.stage-frame \{ display: contents; \}/,'the frame has no box of its own outside the compact layouts');
 assert.match(html,/<div id="sheet-scrim" class="sheet-scrim" aria-hidden="true">/);
 assert.match(html,/<h2 id="quick-material-title" tabindex="-1" data-zh="挑一枝" data-en="Choose a stem" data-ja="一枝を選ぶ">/);
 assert.match(html,/id="help-button" aria-label="怎么玩" title="怎么玩" data-aria-zh="怎么玩" data-aria-en="Guide" data-aria-ja="使い方" data-title-zh="怎么玩" data-title-en="Guide"/);
 assert.match(html,/href="\/material-drawer\.css\?v=hn3"/);
});

test('CSS: the Guide shows on phones, the stage lets paper swipes scroll, stems keep every touch, hover lifts only with hover',()=>{
 assert.doesNotMatch(style,/#help-button\{display:none\}/);
 assert.match(polish,/\.header-actions > #help-button \{ display: inline-flex;/);
 assert.match(style,/\.stage\{touch-action:pan-y\}\n\.stage:is\(\[data-tool=split\],\[data-tool=brush\]\),\.canvas-viewport\.is-zoomed \.stage\{touch-action:none\}/);
 assert.match(style,/\.stem\{[^}]*touch-action:none\}/);
 assert.match(style,/@media\(pointer:coarse\)\{\.stage \.stem::before\{content:'';position:absolute;inset:-12px\}\}/,'the touch pick margin belongs to the stem');
 assert.match(style,/@media\(hover:hover\)\{\.button:hover\{filter:brightness\(\.94\);transform:translateY\(-1px\)\}\}/);
 assert.match(drawer,/@media\(hover:hover\)\{\.quick-material-open:hover\{[^}]*transform:translateY\(-1px\)\}\}/);
 assert.doesNotMatch(css.replace(/@media ?\(hover: ?hover\) ?\{[^{}]*\{[^}]*\}\s*\}/g,''),/\.material-card:hover/,'material card hover only with hover');
 assert.match(drawer,/body\.material-sheet-open:has\(#studio-view:not\(\[hidden\]\)\)\{overflow:hidden\}/,'the page lock is scoped to the studio');
 assert.doesNotMatch(drawer,/body\.material-sheet-open\{overflow:hidden\}/);
 assert.doesNotMatch(css,/\.zoom-controls[^{]*\{[^}]*display:\s*none/,'zoom controls are never hidden');
});

test('CSS: a 340 px floor on wide screens, the sticky portrait frame and the short-landscape studio',()=>{
 assert.match(polish,/--stage-fit: max\(340px, calc\(100dvh - 350px\)\);/);
 assert.equal((polish.match(/var\(--stage-fit\)/g)||[]).length,4,'canvas, toolbar, zoom and the bar widths');
 assert.doesNotMatch(polish,/\(100dvh - 350px\)\) \/ 2/);
 const portrait=mediaBlock(polish,/@media \(max-width: 900px\) and \(orientation: portrait\) and \(min-height: 600px\)/);
 assert.match(portrait,/#studio-view \.stage-shell \{ display: contents; \}/);
 assert.match(portrait,/#studio-view \.stage-frame \{\s*position: sticky; top: 0; z-index: 600;/);
 assert.match(portrait,/scroll-padding-top: calc\(var\(--frame-h, 0px\) \+ 8px\)/);
 const landscape=mediaBlock(polish,/@media \(orientation: landscape\) and \(max-height: 540px\), \(orientation: landscape\) and \(max-width: 900px\) \{/);
 assert.ok(landscape,'short or narrow landscape windows');
 assert.match(landscape,/\.masthead \{ display: flex; height: 52px;/);
 assert.match(landscape,/\.stage-shell > \.stage-frame \{\s*grid-column: 1; grid-row: 1 \/ -1; position: sticky;/);
 assert.match(landscape,/\.workspace > \.quick-material-drawer:not\(\[hidden\]\) \{\s*position: fixed; inset: 0 0 0 auto; z-index: 950;[^}]*width: min\(420px, 48vw\);[^}]*height: 100dvh;/);
 assert.match(landscape,/\.stage-frame > \.zoom-controls \{/,'zoom stays, as a corner pill');
 // Layers stay under the sheet (950) and the toast (1000); the scrim sits just under the sheet.
 assert.match(polish,/body\.material-sheet-open \.sheet-scrim \{ display: block; position: fixed; inset: 0; z-index: 940;/);
 assert.match(polish,/body:is\(\.material-sheet-open, \.layer-list-open\) \.toast \{ top: max\(12px, env\(safe-area-inset-top\)\); bottom: auto;/);
 assert.match(polish,/@media \(max-width: 600px\) and \(min-height: 740px\) \{\n  \.workspace > \.quick-material-drawer:not\(\[hidden\]\) \{ height: min\(62dvh, 560px\); \}/,'tall phones get a peek sheet');
});

test('CSS: iOS fields at 16 px, 44 px touch targets, and no maximum-scale',()=>{
 const ios=mediaBlock(polish,/@supports \(-webkit-touch-callout: none\)/);
 assert.match(ios,/#quick-material-search, #material-search, #work-subtitle, #intention, #language-select, #generation-mode, #prompt-text \{ font-size: 16px; \}/);
 assert.match(polish,/@media \(pointer: coarse\) \{\n  \.editor-tabs button, #reseat-button, #scale-reset, #restore-cuts, \.work-title-edit,\n  #material-filters button, #vessel-filters button, \.color-filter-bar button, \.quick-material-filters button \{ min-height: 44px; \}\n  input\[type=range\] \{ min-height: 40px; \}\n  \.scene-dot \{ width: 40px; height: 40px; \}/);
 assert.match(html,/<meta name="viewport" content="width=device-width,initial-scale=1">/);
 assert.doesNotMatch(html,/maximum-scale/);
});

test('app.js: stems re-rasterise after a resize, zoom marks the viewport, and the sheet keeps the keyboard down on touch',()=>{
 assert.match(app,/new ResizeObserver\(\(\)=>\{applyCanvasZoom\(\);drawPruneOverlay\(\);mountLayerDock\(\);renderGuide\(\);if\(stage\.getBoundingClientRect\(\)\.width<40\)return;renderVesselLayers\(\);clearTimeout\(stemResizeTimer\);stemResizeTimer=setTimeout\(\(\)=>\{if\(stage\.getBoundingClientRect\(\)\.width>=40\)redrawStemCanvases\(\)\},120\)\}\)\.observe\(\$\('#stage'\)\);/);
 assert.match(app,/document\.documentElement\.style\.setProperty\('--frame-h',`\$\{h\}px`\)\}\)\.observe\(\$\('\.stage-frame'\)\);/);
 assert.match(app,/viewport\.classList\.toggle\('is-zoomed',zoomLevel>1\)/);
 const open=app.slice(app.indexOf('function openQuickMaterialDrawer('),app.indexOf('for(const [id,mode] of',app.indexOf('function openQuickMaterialDrawer(')));
 assert.match(open,/mediaMatches\('\(hover:hover\) and \(pointer:fine\)'\)\?search:\$\('#quick-material-title'\)/,'search focus only with a fine pointer');
 assert.match(open,/window\.scrollBy\(\{top,behavior:'instant'\}\)/,'the canvas comes into view on portrait phones');
 assert.match(app,/function setView\(view\)\{closeQuickMaterialDrawer\(\);closeLayerMenu\(\);/);
 assert.match(app,/\$\('#sheet-scrim'\)\.addEventListener\('click',\(\)=>closeQuickMaterialDrawer\(\{focus:true\}\)\)/);
 assert.match(app,/const close=e\.type==='pointerup'&&sheetDrag\.dy>80;/,'a downward drag of more than 80 px closes the sheet');
 assert.match(app,/document\.body\.classList\.add\('layer-list-open'\)/);
 assert.match(app,/document\.body\.classList\.remove\('layer-list-open'\)/);
});

test('app.js: a touch long-press on paper is not a layer request; the layer tip names the touch gesture; drafts import from My Works',()=>{
 assert.match(app,/if\(!id&&lastStagePointerType==='touch'\)return;if\(id\)selectItem\(id\);openLayerMenu/);
 assert.match(app,/\$\('#stage'\)\.addEventListener\('pointerdown',e=>\{lastStagePointerType=e\.pointerType\|\|'mouse'\},true\);/);
 assert.match(app,/\['用 ↑ ↓ 微调前后；随便放入只改变图层。','Use ↑ ↓ to reorder\. Random placement only changes layers\.','↑ ↓ で順序を調整。ランダム配置はレイヤーのみ変更します。'\]/);
 const gallery=app.slice(app.indexOf('async function renderGallery()'),app.indexOf('async function artPoster('));
 assert.equal((gallery.match(/data-draft-import/g)||[]).length,3,'heading and empty state buttons, plus their wiring');
 assert.equal((gallery.match(/L\('导入草稿','Import draft','下書きを読み込む'\)/g)||[]).length,2);
 assert.match(gallery,/\$\$\('\[data-draft-import\]',\$\('#gallery-view'\)\)\.forEach\(b=>b\.onclick=\(\)=>\$\('#draft-upload'\)\.click\(\)\)/);
});

test('CSS: the sticky portrait page does not jump when the inspector changes, and the English scene line clears the zoom pill',()=>{
 const portrait=mediaBlock(polish,/@media \(max-width: 900px\) and \(orientation: portrait\) and \(min-height: 600px\)/);
 assert.match(portrait,/body:has\(#studio-view:not\(\[hidden\]\)\) \{ overflow-anchor: none; \}/,'closing the sheet or selecting a stem keeps the scroll position');
 assert.match(portrait,/html\[lang="en"\] #studio-view \.scene-label \{ bottom: 54px; \}/,'the scene line sits above the corner zoom pill');
 const landscape=mediaBlock(polish,/@media \(orientation: landscape\) and \(max-height: 540px\), \(orientation: landscape\) and \(max-width: 900px\) \{/);
 assert.match(landscape,/html\[lang="en"\] \.stage-frame \.scene-label \{ display: none; \}/,'no room for the scene line on the small landscape canvas');
});
