// SPDX-FileCopyrightText: 2026 Marko Sun
// SPDX-License-Identifier: LicenseRef-Hanama-Proprietary
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {wheelPixels,wheelAction,wheelTurn,zoomAbout,isDoubleTap,needsCheckpoint} from '../dist/editor-state.js?v=hn3';
import {dist} from './helpers/catalog.mjs';

const wheel=(o={})=>({deltaX:0,deltaY:0,deltaMode:0,ctrlKey:false,shiftKey:false,altKey:false,metaKey:false,...o});
const near=(a,b,eps=1e-9)=>Math.abs(a-b)<=eps;

test('wheelPixels: line and page deltas become CSS px',()=>{
 assert.deepEqual(wheelPixels(wheel({deltaY:3,deltaMode:1})),{x:0,y:48});
 assert.deepEqual(wheelPixels(wheel({deltaX:-1,deltaMode:2}),700),{x:-700,y:0});
 assert.deepEqual(wheelPixels(wheel({deltaY:-12.5})),{x:0,y:-12.5});
});

test('wheelAction: a pinch or Ctrl+wheel zooms about the pointer, gently per event, never the page',()=>{
 const pinchIn=wheelAction(wheel({deltaY:-4,ctrlKey:true}));
 assert.equal(pinchIn.type,'zoom');assert.ok(near(pinchIn.factor,Math.exp(.04)),'Chrome encodes a pinch as exp(−deltaY/100)');
 const notch=wheelAction(wheel({deltaY:100,ctrlKey:true}));
 assert.ok(notch.factor<1&&notch.factor>.8,'a mouse notch is one step, not a jump');
 assert.ok(wheelAction(wheel({deltaY:-3,deltaMode:1,ctrlKey:true})).factor<1.25,'Firefox line mode is clamped too');
 assert.equal(wheelAction(wheel({deltaY:-4,ctrlKey:true}),{zoomed:false,stem:false}).type,'zoom','zoom works at 1× and without a stem');
 assert.equal(wheelAction(wheel({deltaX:5,ctrlKey:true})),null,'nothing to zoom');
});

test('wheelAction: a plain wheel pans only a zoomed canvas, else the page scrolls',()=>{
 assert.equal(wheelAction(wheel({deltaY:40})),null);
 assert.equal(wheelAction(wheel({deltaY:40}),{zoomed:false,stem:true}),null);
 assert.deepEqual(wheelAction(wheel({deltaX:-10,deltaY:40}),{zoomed:true}),{type:'pan',dx:10,dy:-40});
 assert.equal(wheelAction(wheel({deltaY:40,metaKey:true}),{zoomed:true}),null,'⌘+wheel is left to the browser');
});

test('wheelAction: Shift turns and Alt sizes the selected stem, and only when there is one',()=>{
 assert.equal(wheelAction(wheel({deltaY:100,shiftKey:true})),null);
 assert.deepEqual(wheelAction(wheel({deltaY:100,shiftKey:true}),{stem:true}),{type:'turn',deg:2});
 assert.deepEqual(wheelAction(wheel({deltaX:-100,shiftKey:true}),{stem:true}),{type:'turn',deg:-2},'macOS sends Shift+wheel as a horizontal scroll');
 const grow=wheelAction(wheel({deltaY:-100,altKey:true}),{stem:true});
 assert.equal(grow.type,'size');assert.ok(near(grow.ratio,1.02),'wheel up: 2% larger');
 assert.ok(near(wheelAction(wheel({deltaY:100,altKey:true}),{stem:true}).ratio,.98));
 assert.equal(wheelAction(wheel({deltaY:100,altKey:true,shiftKey:true}),{stem:true,zoomed:true}),null,'Shift+Alt does nothing');
 assert.equal(wheelAction(wheel({deltaY:100,altKey:true,ctrlKey:true}),{stem:true}),null,'AltGr / Ctrl+Alt is left alone');
});

test('wheelTurn: ±2° a notch, smooth and bounded for trackpads',()=>{
 assert.equal(wheelTurn(100),2);assert.equal(wheelTurn(-100),-2);
 assert.equal(wheelTurn(48),2,'three Firefox lines are one notch');
 assert.equal(wheelTurn(200),4);assert.equal(wheelTurn(1000),6,'at most 6° per event');
 assert.equal(wheelTurn(10),1);assert.equal(wheelTurn(-3),-.3);assert.equal(wheelTurn(0),0);
 // Five notches inside one burst are one undo step (keyStep uses needsCheckpoint with a 500 ms gap for the wheel).
 let last=null,checkpoints=0;
 for(let k=0;k<5;k++){const next={kind:'wheel-turn',id:'a',mark:'m',now:k*120};if(needsCheckpoint(last,next,500))checkpoints++;last={...next,time:next.now}}
 assert.equal(checkpoints,1);
 assert.ok(needsCheckpoint(last,{kind:'wheel-turn',id:'a',mark:'m',now:last.time+501},500),'a pause starts a new step');
});

test('zoomAbout keeps the stage point under the pointer still',()=>{
 // Stage drawn as translate(pan) scale(zoom) about its centre; a stage point u (from the centre) shows at pan + zoom·u.
 const check=(from,to,pan,at)=>{
  const u=[(at[0]-pan[0])/from,(at[1]-pan[1])/from],next=zoomAbout({from,to,pan,at});
  assert.ok(near(next[0]+to*u[0],at[0],1e-9)&&near(next[1]+to*u[1],at[1],1e-9),`${from}→${to} about ${at}`);
 };
 check(1,2,[0,0],[120,-80]);check(1.5,3,[-40,25],[-200,90]);check(3,1.2,[100,-60],[10,10]);
 assert.deepEqual(zoomAbout({from:1,to:2,pan:[0,0],at:[0,0]}),[0,0],'about the centre the pan stays');
 assert.deepEqual(zoomAbout({from:2,to:3,pan:[10,-20],at:[0,0]}),[15,-30],'about the centre the pan scales, as the old buttons did');
});

test('isDoubleTap: a second tap close in time and place',()=>{
 const a={time:1000,x:50,y:50};
 assert.ok(isDoubleTap(a,{time:1250,x:60,y:58}));
 assert.ok(!isDoubleTap(a,{time:1400,x:50,y:50}),'too slow');
 assert.ok(!isDoubleTap(a,{time:1100,x:90,y:50}),'too far');
 assert.ok(!isDoubleTap(null,a));
});

test('app.js: one non-passive wheel listener that acts only when it can, pinch and double-tap zoom, zoom reset on a new canvas',()=>{
 const app=readFileSync(`${dist}app.js`,'utf8');
 assert.match(app,/\$\('#canvas-viewport'\)\.addEventListener\('wheel',e=>\{[\s\S]*?\},\{passive:false\}\);/,'non-passive wheel on the viewport');
 const body=app.slice(app.indexOf("$('#canvas-viewport').addEventListener('wheel'"),app.indexOf('},{passive:false});',app.indexOf("$('#canvas-viewport').addEventListener('wheel'")));
 assert.match(body,/if\(!act\)return;/,'no action, no preventDefault');
 assert.match(body,/if\(zoomPanX!==x\|\|zoomPanY!==y\)e\.preventDefault\(\)/,'a pan at the edge lets the page scroll');
 assert.match(body,/keyStep\('wheel-turn',[\s\S]*?,500\)/);assert.match(body,/keyStep\('wheel-size',[\s\S]*?,500\)/);
 assert.match(body,/editSizeBounds\(a,item\.h\)/,'Alt+wheel uses the editable range and preserves saved sizes');
 for(const type of ['gesturestart','gesturechange','gestureend'])assert.ok(app.includes(`['${type}'`),type);
 assert.match(app,/isDoubleTap\(lastPaperTap,now\)/);
 assert.match(app,/function pinchPaper\(\)/);
 assert.match(app,/setEditMode\('move'\);zoomLevel=1;zoomPanX=zoomPanY=0;renderAll\(\)/,'activateCanvas resets zoom');
 assert.match(app,/function scheduleZoomRedraw\(\)\{if\(zoomFrame\)return;zoomFrame=requestAnimationFrame\(/,'stem canvases redraw at most once a frame while zooming');
 assert.match(app,/\$\('#zoom-in'\)\.onclick=\(\)=>setCanvasZoom\(zoomLevel\+\.25,zoomTarget\(\)\)/,'+ zooms toward the selected tip');
});
