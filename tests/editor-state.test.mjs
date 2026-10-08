// SPDX-FileCopyrightText: 2026 Marko Sun
// SPDX-License-Identifier: LicenseRef-Hanama-Proprietary
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {keyAction,needsCheckpoint,tolerant,repairDraftShell,canvasSignature,readStash,addToStash} from '../dist/editor-state.js?v=hn3';
import {dist} from './helpers/catalog.mjs';

const key=(k,mods={})=>keyAction({key:k,code:'',metaKey:false,ctrlKey:false,shiftKey:false,altKey:false,...mods});

test('keyAction: undo, redo and duplicate with ⌘ or Ctrl; Alt combinations stay with the browser',()=>{
 assert.deepEqual(key('z',{metaKey:true}),{type:'undo'});
 assert.deepEqual(key('z',{ctrlKey:true}),{type:'undo'});
 assert.deepEqual(key('Z',{metaKey:true,shiftKey:true}),{type:'redo'});
 assert.deepEqual(key('y',{ctrlKey:true}),{type:'redo'});
 assert.deepEqual(key('d',{metaKey:true}),{type:'duplicate'});
 assert.equal(key('z',{ctrlKey:true,altKey:true}),null);
 assert.equal(key('s',{metaKey:true}),null,'other shortcuts pass through');
 assert.deepEqual(keyAction({key:'я',code:'KeyZ',ctrlKey:true}),{type:'undo'},'non-Latin layouts use the key position');
 assert.equal(keyAction({key:'z',code:'KeyY',ctrlKey:true})?.type,'undo','Latin layouts use the letter (QWERTZ)');
});

test('keyAction: stem keys',()=>{
 assert.deepEqual(key('Escape'),{type:'escape'});
 assert.deepEqual(key('Delete'),{type:'remove'});
 assert.deepEqual(key('Backspace'),{type:'remove'});
 assert.deepEqual(key('Enter'),{type:'select'});
 assert.deepEqual(key('ArrowLeft'),{type:'nudge',dx:-.5,dy:0,shift:false,alt:false});
 assert.deepEqual(key('ArrowDown',{shiftKey:true}),{type:'nudge',dx:0,dy:2,shift:true,alt:false});
 assert.deepEqual(key('['),{type:'rotate',deg:-2});
 assert.deepEqual(key(']'),{type:'rotate',deg:2});
 assert.deepEqual(key('{',{shiftKey:true}),{type:'rotate',deg:-10},'Shift+[ arrives as { on US layouts');
 assert.deepEqual(key('}',{shiftKey:true}),{type:'rotate',deg:10});
 assert.deepEqual(key('[',{ctrlKey:true,altKey:true}),{type:'rotate',deg:-2},'AltGr-typed brackets still turn');
 assert.deepEqual(key('ArrowLeft',{altKey:true}),{type:'nudge',dx:-.5,dy:0,shift:false,alt:true},'Alt+arrow moves a seated stem’s base (app.js acts only with a stem selected on the canvas)');
 assert.deepEqual(key('ArrowUp',{altKey:true,shiftKey:true}),{type:'nudge',dx:0,dy:-2,shift:true,alt:true});
 assert.equal(key('ArrowLeft',{ctrlKey:true,altKey:true}),null,'AltGr+arrow stays with the browser');
 assert.equal(key('ArrowLeft',{ctrlKey:true}),null);
 assert.equal(key('Delete',{altKey:true}),null,'other Alt combinations stay with the browser');
 assert.equal(key('ArrowLeft',{metaKey:true}),null);
 assert.equal(key('a'),null);
});

test('a held arrow key is one undo step: checkpoints only between bursts, per kind and stem, and after other edits',()=>{
 let last=null,checkpoints=0;const mark={};
 for(let now=0;now<=2000;now+=33){if(needsCheckpoint(last,{kind:'nudge',id:'a',mark,now}))checkpoints++;last={kind:'nudge',id:'a',mark,time:now}}
 assert.equal(checkpoints,1,'2 s of key repeat');
 assert.equal(needsCheckpoint(last,{kind:'nudge',id:'a',mark,now:2000+701}),true,'a pause longer than 700 ms starts a new step');
 assert.equal(needsCheckpoint(last,{kind:'rotate',id:'a',mark,now:2010}),true);
 assert.equal(needsCheckpoint(last,{kind:'nudge',id:'b',mark,now:2010}),true);
 assert.equal(needsCheckpoint(last,{kind:'nudge',id:'a',mark:{},now:2010}),true,'something else was checkpointed in between');
 assert.equal(needsCheckpoint(null,{kind:'nudge',id:'a',mark,now:0}),true);
});

test('tolerant: strict mode throws the first error, lenient mode skips and counts',()=>{
 const build=n=>{if(n<0)throw Error('bad');return n*2};
 assert.throws(()=>tolerant([1,-1,2],build),/bad/);
 const report={skipped:0};
 assert.deepEqual(tolerant([1,-1,2,-3],build,{lenient:true,report}),[2,4]);
 assert.equal(report.skipped,2);
 assert.deepEqual(tolerant([],build,{lenient:true}),[]);
});

test('repairDraftShell keeps at most 24 items and replaces an unknown vessel or scene',()=>{
 const report={skipped:0},items=Array.from({length:26},(_,n)=>({n}));
 const out=repairDraftShell({version:2,vessel:'gone',scene:'moon',items},{hasVessel:id=>id==='round',hasScene:id=>id==='paper',report});
 assert.equal(out.items.length,24);assert.equal(out.items[0].n,0);
 assert.equal(out.vessel,'round');assert.equal(out.scene,'paper');assert.equal(report.skipped,4);
 const ok={version:2,vessel:'round',scene:'paper',items:[]};
 assert.deepEqual(repairDraftShell(ok,{hasVessel:()=>true,hasScene:()=>true,report:{}}),ok);
 assert.equal(repairDraftShell(null),null);assert.equal(repairDraftShell('x'),'x');
});

test('canvasSignature ignores the id and the language of preset titles and intentions, nothing else',()=>{
 const titleGroups=[['风经过的地方','Where the Wind Passed','風が通り過ぎた場所'],['未命名作品','Untitled Arrangement','タイトルなしの作品']];
 const intentionPresets=['像清晨的风','Like a morning breeze','朝の庭を'];
 const base={version:2,id:'one',title:'风经过的地方',intention:'像清晨的风',vessel:'round',items:[{id:'i1',x:50}]};
 const sig=v=>canvasSignature(v,{titleGroups,intentionPresets});
 assert.equal(sig(base),sig({...base,id:'two',title:'Where the Wind Passed',intention:'Like a morning breeze'}));
 assert.notEqual(sig(base),sig({...base,title:'My title'}));
 assert.notEqual(sig(base),sig({...base,title:'Untitled Arrangement'}));
 assert.notEqual(sig(base),sig({...base,items:[{id:'i1',x:51}]}));
 assert.notEqual(sig(base),sig({...base,intention:'quiet'}));
});

test('the displaced-draft stash is a capped list of raw strings and survives junk',()=>{
 assert.deepEqual(readStash(null),[]);assert.deepEqual(readStash('{'),[]);assert.deepEqual(readStash('"x"'),[]);
 assert.deepEqual(readStash('["a",1,"",null,"b"]'),['a','b']);
 let text=null;for(const raw of ['a','b','c','d'])text=JSON.stringify(addToStash(text,raw));
 assert.deepEqual(readStash(text),['b','c','d']);
 assert.deepEqual(addToStash(JSON.stringify(['a','b']),'a'),['b','a'],'a repeat moves to the end');
});

const app=readFileSync(`${dist}app.js`,'utf8'),html=readFileSync(`${dist}index.html`,'utf8');

test('app.js: undo toasts compare undo entries, not the stack length',()=>{
 const body=app.match(/function undoToast\(msg\)\{[^\n]*\}/)?.[0]||'';
 assert.match(body,/const mark=undoStack\.at\(-1\)/);
 assert.match(body,/undoStack\.at\(-1\)===mark/);
 assert.doesNotMatch(body,/undoStack\.length/);
 // A site's statement: its first line and the indented lines under it (top-level statements start at column 0).
 const statement=site=>{const lines=app.slice(app.indexOf(site)).split('\n'),end=lines.findIndex((line,k)=>k>0&&/^\S/.test(line)&&line!=='}');return lines.slice(0,end<0?lines.length:end).join('\n')};
 for(const site of ['function removeSelected','function duplicateSelected',"$('#reset-button').onclick",'function reseatItem','function seatAll','function switchVessel','function addSpecimen'])
  assert.ok(app.includes(site)&&statement(site).includes('undoToast('),`${site} offers Undo`);
});

test('app.js: leaving the page flushes the debounced save',()=>{
 assert.match(app,/addEventListener\('pagehide',flushPersist\)/);
 assert.match(app,/visibilitychange'.*visibilityState==='hidden'\)flushPersist\(\)/);
});

test('app.js: a share link never replaces the local draft at boot, and only local reads are lenient',()=>{
 // Since B6 a shared draft is decoded aside (bootShare) and offered on the arrival card after the first render; drafts that
 // older versions stashed when their share links replaced the canvas are still filed into My Works.
 assert.match(app,/bootShare=await decodeShare\(hash\)/);
 assert.doesNotMatch(app,/\bstate=await decodeShare\(/,'the boot path does not assign the shared draft to state');
 const drain=app.indexOf('readStash(localStorage.getItem(DISPLACED_STORE))'),boot=app.lastIndexOf('renderAll();refreshCount();afterBoot();');
 assert.ok(drain>0&&boot>drain,'the old displaced-draft stash is still drained after boot');
 assert.match(app,/state=validate\(JSON\.parse\(bootRaw\),\{lenient:true,report:bootReport\}\)/);
 assert.match(app,/return validate\(JSON\.parse\(new TextDecoder\(\)\.decode\(bytes\)\)\)\}/,'share links stay strict');
 assert.match(app,/next=validate\(JSON\.parse\(await file\.text\(\)\)\)/,'imported files stay strict');
 assert.match(app,/activateCanvas\(next,\{clean:true,lenient:true\}\)/,'My Works opens leniently');
 for(const key of ['hanama-draft-v1-unreadable','hanama-draft-v1-displaced','hanama-draft-clean-v1'])assert.ok(app.includes(`'${key}'`),key);
});

test('app.js: one document key map, mask picking everywhere a press selects, no stage hint',()=>{
 assert.doesNotMatch(app,/\$\('#stage'\)\.addEventListener\('keydown'/,'the #stage key handler is merged into the document one');
 assert.match(app,/document\.addEventListener\('keydown',e=>\{/);
 assert.equal((app.match(/pickStem\(e\.clientX,e\.clientY/g)||[]).length,4,'move press, context menu, the cut/erase retarget and the Shift/Alt+wheel target');
 assert.match(app,/pickStem\(hoverAt\[0\],hoverAt\[1\]\)/);
 assert.doesNotMatch(app,/e\.target\.closest\('\.stem'\)/,'no box hit-testing left');
 assert.doesNotMatch(app,/#stage-hint/);
});

test('index.html: the mode pill, a trilingual stage label and the eraser icon on Clear',()=>{
 assert.match(html,/<div id="mode-pill" class="mode-pill" hidden>/);
 assert.match(html,/id="mode-pill-done"[^>]*data-zh="完成" data-en="Done" data-ja="完了"/);
 assert.match(html,/id="stage"[^>]*data-aria-zh="[^"]*Ctrl\/⌘\+Z[^"]*"[^>]*data-aria-en="[^"]*Ctrl\/⌘\+Z[^"]*"[^>]*data-aria-ja="[^"]*Ctrl\/⌘\+Z[^"]*"/);
 assert.match(html,/id="reset-button"[^>]*>\n<span data-icon="eraser">/);
 assert.doesNotMatch(html,/id="stage-hint"/);
 const css=readFileSync(`${dist}style.css`,'utf8')+readFileSync(`${dist}ui-polish.css`,'utf8');
 assert.doesNotMatch(css,/data-tool=lasso/);
 assert.match(css,/\.stage\[data-tool=split\] \.stem:not\(\.selected\)\{opacity:\.55\}/);
 assert.doesNotMatch(css,/\.stage-hint\s*\{\s*display:\s*none/);
 assert.match(css,/\.stem:focus-visible:after\{/);
});
