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
 return JSON.stringify({...v,id:'',title:group>=0?`#t${group}`:v.title,intention:intentionPresets.includes(v.intention)?'#i':v.intention});
}

/** Raw local drafts waiting to be filed into My Works after a share link replaced them (oldest first). */
export function readStash(text){
 try{const list=JSON.parse(text||'[]');return Array.isArray(list)?list.filter(entry=>typeof entry==='string'&&entry.length>0):[]}catch{return []}
}
/** The stash with `raw` appended (skipping an exact duplicate), keeping the newest `max`. */
export function addToStash(text,raw,max=3){
 const list=readStash(text).filter(entry=>entry!==raw);if(typeof raw==='string'&&raw)list.push(raw);return list.slice(-max);
}
