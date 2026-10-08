// SPDX-FileCopyrightText: 2026 Marko Sun
// SPDX-License-Identifier: LicenseRef-Hanama-Proprietary
/**
 * The editor's keyboard map, undo coalescing and draft-safety rules, kept DOM-free so node --test covers them.
 * app.js owns the effects (checkpoint, persist, toasts); these functions only decide.
 */

const letter=(e,name)=>String(e.key||'').toLowerCase()===name||(e.code===`Key${name.toUpperCase()}`&&!/^[a-z]$/i.test(String(e.key||'')));

/**
 * The studio action for a keydown, or null. `e` needs key/code and the modifier flags.
 *  Mod+Z undo · Shift+Mod+Z, Mod+Y redo · Mod+D duplicate (Mod = ⌘ or Ctrl) · Esc · Delete/Backspace remove ·
 *  arrows nudge 0.5 (Shift 2) stage % · [ ] turn 2° (Shift 10°) · Enter select the focused stem.
 * Arrows also report `shift` and `alt`: app.js turns and lengthens a stem standing in the vessel with plain arrows and moves
 * its base with Alt+arrows (the editor acts, and prevents the browser's Alt+← history step, only while the canvas has focus
 * and a stem is selected). AltGr arrives as Ctrl+Alt, so other shortcuts with Alt, and AltGr+arrows, are left to the browser;
 * bracket keys typed with AltGr still turn.
 */
export function keyAction(e){
 const mod=!!(e.metaKey||e.ctrlKey),alt=!!e.altKey,shift=!!e.shiftKey,key=String(e.key||'');
 if(mod&&!alt){
  if(letter(e,'z'))return {type:shift?'redo':'undo'};
  if(letter(e,'y')&&!shift)return {type:'redo'};
  if(letter(e,'d')&&!shift)return {type:'duplicate'};
  return null;
 }
 if(key==='Escape')return {type:'escape'};
 if(e.metaKey||(e.ctrlKey&&!alt))return null;
 if(key==='['||key==='{'||key===']'||key==='}')return {type:'rotate',deg:(key==='['||key==='{'?-1:1)*(shift?10:2)};
 const step=shift?2:.5,arrows={ArrowLeft:[-step,0],ArrowRight:[step,0],ArrowUp:[0,-step],ArrowDown:[0,step]};
 if(arrows[key])return e.ctrlKey?null:{type:'nudge',dx:arrows[key][0],dy:arrows[key][1],shift,alt};
 if(alt)return null;
 if(key==='Delete'||key==='Backspace')return {type:'remove'};
 if(key==='Enter')return {type:'select'};
 return null;
}

/**
 * Held arrow keys and bracket turns make one undo step: a new checkpoint only when the previous step was another kind,
 * another stem, more than `gap` ms ago, or something else has been checkpointed since (`mark` = the undo stack's top entry).
 */
export function needsCheckpoint(last,next,gap=700){
 return !last||last.kind!==next.kind||last.id!==next.id||last.mark!==next.mark||!(next.now-last.time<=gap);
}

/** A wheel event's deltas in CSS px: line mode (Firefox) × 16, page mode × `page` (the viewport height). */
export function wheelPixels(e,page=800){
 const k=e.deltaMode===1?16:e.deltaMode===2?page:1;
 return {x:(+e.deltaX||0)*k,y:(+e.deltaY||0)*k};
}
/**
 * What a wheel over the canvas does (B7), or null to leave it to the page (so the page scrolls):
 *  Ctrl (a trackpad pinch arrives as Ctrl+wheel, as does Ctrl+mouse wheel) zoom about the pointer · Shift turn the selected stem ·
 *  Alt size it · a plain wheel pans while the canvas is zoomed. `stem`: a stem can be adjusted (one is selected, move mode).
 *  zoom.factor multiplies the zoom (exp(−y/100), as Chrome encodes a pinch, at most about ±22% per event so a mouse notch is
 *  one step); pan.dx/dy move the stage against the scroll; turn.deg (Shift+wheel: macOS sends it as a horizontal scroll, so
 *  the larger of deltaX and deltaY counts); size.ratio multiplies the stem's size.
 */
export function wheelAction(e,{zoomed=false,stem=false,page=800}={}){
 const {x,y}=wheelPixels(e,page),major=Math.abs(x)>Math.abs(y)?x:y;
 if(e.ctrlKey&&!e.altKey&&!e.shiftKey){if(!y)return null;return {type:'zoom',factor:Math.exp(-Math.max(-20,Math.min(20,y))/100)}}
 if(e.ctrlKey||e.metaKey)return null;
 if(e.shiftKey&&!e.altKey){const deg=wheelTurn(major);return stem&&deg?{type:'turn',deg}:null}
 if(e.altKey&&!e.shiftKey){const deg=wheelTurn(major);return stem&&deg?{type:'size',ratio:1-deg/100}:null}
 if(e.altKey||e.shiftKey)return null;
 return zoomed&&(x||y)?{type:'pan',dx:-x,dy:-y}:null;
}
/** Degrees for a Shift+wheel turn: ±2° per wheel notch (≥40 px: about 100 px a notch, 3 lines in Firefox), a trackpad's small
 deltas turn smoothly (2° per 20 px); at most 6° per event. Positive (scrolling down) turns clockwise. */
export function wheelTurn(px){
 const a=Math.abs(+px||0);if(!a)return 0;
 const deg=a>=40?2*Math.max(1,Math.round(a/100)):a/10;
 return Math.sign(px)*Math.min(6,Math.round(deg*10)/10);
}
/**
 * Pan (CSS px) that keeps the stage point under `at` still while the zoom goes from `from` to `to`. The stage is drawn as
 * translate(pan) scale(zoom) about its centre, and `at` is measured from that unzoomed centre (client point − centre).
 */
export function zoomAbout({from,to,pan:[x,y],at:[ax,ay]}){
 const k=to/(from||1);
 return [ax-k*(ax-x),ay-k*(ay-y)];
}
/** A second tap within `ms` and `px` of the first (double-tap to zoom on touch). */
export const isDoubleTap=(last,next,{ms=320,px=24}={})=>!!last&&!!next&&next.time-last.time>=0&&next.time-last.time<=ms&&Math.hypot(next.x-last.x,next.y-last.y)<=px;

/** Map `list` through `build`. Strict mode rethrows the first error; lenient mode skips that entry and counts it in report.skipped. */
export function tolerant(list,build,{lenient=false,report=null}={}){
 const out=[];
 for(const entry of list){try{out.push(build(entry))}catch(err){if(!lenient)throw err;if(report)report.skipped=(report.skipped||0)+1}}
 return out;
}

/**
 * Lenient top-level repair for a draft read back from this device (localStorage or My Works): at most `maxItems` items,
 * an unknown vessel or scene replaced by the fallback. Anything that is not a draft-shaped object is returned unchanged
 * for validate() to reject.
 */
export function repairDraftShell(v,{hasVessel,hasScene,vessel='round',scene='paper',maxItems=24,report=null}={}){
 if(!v||typeof v!=='object'||!Array.isArray(v.items))return v;
 let skipped=0;const out={...v};
 if(out.items.length>maxItems){skipped+=out.items.length-maxItems;out.items=out.items.slice(0,maxItems)}
 if(hasVessel&&!hasVessel(out.vessel)){out.vessel=vessel;skipped++}
 if(hasScene&&!hasScene(out.scene)){out.scene=scene;skipped++}
 if(report&&skipped)report.skipped=(report.skipped||0)+skipped;
 return out;
}

/**
 * A canvas's content without its identity, to tell an untouched study or saved work from an edited one: the id blanked,
 * preset titles reduced to their group and the preset intention to one key, so switching language is not an edit.
 * `v` must already be validated (validate() fills defaults and drops unknown fields).
 */
export function canvasSignature(v,{titleGroups=[],intentionPresets=[]}={}){
 const group=titleGroups.findIndex(titles=>titles.includes(v.title));
 return JSON.stringify({...v,id:'',lineage:undefined,title:group>=0?`#t${group}`:v.title,intention:intentionPresets.includes(v.intention)?'#i':v.intention});
}

/**
 * Where a remix came from (B6): at most `max` entries {t, s?}, oldest first. `t` is a title (control characters and runs of
 * space folded, at most 40 characters); `s` a study id, kept only when `isStudy(s)`. Anything malformed is dropped, never
 * thrown, and only the last few entries of a long list are read.
 */
export function cleanLineage(list,{isStudy=()=>false,max=3}={}){
 if(!Array.isArray(list))return [];
 const out=[];
 for(const entry of list.slice(-8)){
  if(!entry||typeof entry!=='object'||typeof entry.t!=='string')continue;
  const t=[...entry.t.replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/g,' ').replace(/\s+/g,' ').trim()].slice(0,40).join('').trim();
  if(!t)continue;
  const s=typeof entry.s==='string'&&/^[a-z0-9-]{1,60}$/.test(entry.s)&&isStudy(entry.s)?entry.s:null;
  out.push(s?{t,s}:{t});
 }
 return out.slice(-max);
}
/** `lineage` with `entry` appended (an entry equal to the last one is not repeated), cleaned as cleanLineage does. */
export function extendLineage(lineage,entry,options={}){
 const list=cleanLineage(lineage,options),[next]=cleanLineage([entry],options);
 if(!next)return list;
 const last=list.at(-1);if(last&&last.t===next.t&&last.s===next.s)return list;
 return [...list,next].slice(-(options.max||3));
}

/** Raw local drafts waiting to be filed into My Works after a share link replaced them (oldest first). */
export function readStash(text){
 try{const list=JSON.parse(text||'[]');return Array.isArray(list)?list.filter(entry=>typeof entry==='string'&&entry.length>0):[]}catch{return []}
}
/** The stash with `raw` appended (skipping an exact duplicate), keeping the newest `max`. */
export function addToStash(text,raw,max=3){
 const list=readStash(text).filter(entry=>entry!==raw);if(typeof raw==='string'&&raw)list.push(raw);return list.slice(-max);
}
