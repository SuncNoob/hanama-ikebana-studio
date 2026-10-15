// SPDX-FileCopyrightText: 2026 Marko Sun
// SPDX-License-Identifier: LicenseRef-Hanama-Proprietary
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LIGHTS,LIGHT_KEYS,lightOf,lightWorkSize,paintLightAmbient,lightPatch,screenLightPatch,paintLight} from '../dist/ambience.js?v=hn3';
import {HORIZON,LIGHT} from '../dist/compositor.js?v=organic3';
import {compositorLayerPlan} from '../dist/compositor-project.js?v=hn3';
import {buildPrompt,LIGHT_PROMPT} from '../dist/prompt.js?v=hn4';
import {assetById,studies,studyState,initial,scenes,dist} from './helpers/catalog.mjs';

/** A 2D context stand-in that records what is drawn (tests never load a real canvas). */
function fakeCanvas(width,height,log=[]){
 const state={globalCompositeOperation:'source-over',globalAlpha:1,fillStyle:'#000'},stack=[];
 const ctx=new Proxy({},{
  get(_,key){
   if(key in state)return state[key];
   if(key==='save')return()=>stack.push({...state});
   if(key==='restore')return()=>Object.assign(state,stack.pop());
   return(...args)=>log.push({op:key,args,op_mode:state.globalCompositeOperation,alpha:state.globalAlpha,fill:state.fillStyle,canvas:{width,height}});
  },
  set(_,key,value){state[key]=value;return true}
 });
 return {width,height,getContext:()=>ctx,log};
}

test('four window lights, each with a gentle wall grade and a working size of at most 180 px',()=>{
 assert.deepEqual(LIGHT_KEYS,['morning','noon','dusk','moon']);
 for(const key of LIGHT_KEYS){
  const L=LIGHTS[key];
  assert.ok(L.strength>0&&L.strength<=.8,key);
  assert.ok(!L.grade||L.grade[1]<=.1,`${key}: the soft-light grade stays at or under 0.1`);
  assert.ok(L.window.every(v=>v>=0&&v<=1)&&L.window[0]<L.window[2]&&L.window[1]<L.window[3],key);
  assert.ok(Object.isFrozen(L),key);
 }
 assert.ok(LIGHTS.morning.dx>0&&LIGHTS.dusk.dx>LIGHTS.morning.dx,'morning and evening sun come from the left, evening lower and longer');
 assert.ok(LIGHTS.moon.dx<0,'moonlight comes from the right');
 assert.equal(lightWorkSize(1600),180);assert.equal(lightWorkSize(600),150);assert.equal(lightWorkSize(10000),180);assert.ok(lightWorkSize(40)>=24);
});

test('lightOf keeps only a known key: none, unknown and odd values mean no light',()=>{
 for(const key of LIGHT_KEYS)assert.equal(lightOf(key),key);
 for(const v of [undefined,null,'',0,1,'sunset','constructor','__proto__','toString',{},['morning'],'Morning'])assert.equal(lightOf(v),null,String(v));
});

test('without a light nothing is painted, so drafts and previews look exactly as before',()=>{
 const c=fakeCanvas(600,600);
 assert.equal(paintLight(c.getContext(),600,{light:undefined,items:[]},{createCanvas:fakeCanvas}),false);
 assert.equal(paintLight(c.getContext(),600,{light:'sunset',items:[]},{createCanvas:fakeCanvas}),false);
 assert.equal(paintLightAmbient(c.getContext(),600,null),false);
 assert.equal(lightPatch(null,150,null,fakeCanvas),null);
 assert.equal(c.log.length,0);
});

test('the room tone stays on the wall, plus the floor for evening and moonlight except on the night scene',()=>{
 const size=1000,wall=size*HORIZON;
 for(const key of LIGHT_KEYS)for(const night of [false,true]){
  const c=fakeCanvas(size,size);paintLightAmbient(c.getContext(),size,key,{night,horizon:HORIZON});
  const fills=c.log.filter(e=>e.op==='fillRect');
  for(const f of fills){
   const [x,y,w,h]=f.args;assert.equal(x,0);assert.equal(w,size);
   if(f.op_mode==='soft-light'){assert.deepEqual([y,h],[0,wall],`${key}: grade on the wall only`);assert.ok(f.alpha<=.1)}
   else assert.equal(f.op_mode,'multiply');
  }
  const floor=fills.filter(f=>f.args[1]===wall);
  assert.equal(floor.length,LIGHTS[key].floor&&!night?1:0,`${key} night=${night}`);
 }
});

test('the window patch is cut by the arrangement at the light\'s offset, softened at a third of its size, and screened over the wall only',()=>{
 const made=[],create=(w,h)=>{const c=fakeCanvas(w,h);made.push(c);return c};
 const silhouette=fakeCanvas(180,180),patch=lightPatch('dusk',180,silhouette,create);
 const [light,soft,out]=made;
 assert.equal(patch,out);
 assert.deepEqual([light.width,soft.width,out.width],[180,60,180]);
 const cut=light.log.find(e=>e.op==='drawImage');
 assert.equal(cut.op_mode,'destination-out');
 assert.deepEqual(cut.args.slice(1),[LIGHTS.dusk.dx*180,LIGHTS.dusk.dy*180,180,180]);
 assert.equal(light.log.filter(e=>e.op==='lineTo').length,12,'four panes of four corners');
 const target=fakeCanvas(1600,1600);screenLightPatch(target.getContext(),1600,'dusk',patch,{horizon:HORIZON});
 const rect=target.log.find(e=>e.op==='rect'),draw=target.log.find(e=>e.op==='drawImage');
 assert.deepEqual(rect.args,[0,0,1600,1600*HORIZON]);
 assert.equal(draw.op_mode,'screen');assert.equal(draw.alpha,LIGHTS.dusk.strength);
});

test('paintLight hands the silhouette painter the working size and frees its scratch canvases',()=>{
 const made=[],create=(w,h)=>{const c=fakeCanvas(w,h);made.push(c);return c};
 let painted=null;
 const target=fakeCanvas(1200,1200);
 assert.equal(paintLight(target.getContext(),1200,{light:'morning',scene:'paper',items:[]},{createCanvas:create,paintSilhouette:(ctx,S)=>{painted=S}}),true);
 assert.equal(painted,180);
 assert.ok(made.length>=3);
 assert.equal(made[0].width,0,'the silhouette canvas is released');
});

test('paintLight paints the room tone and the patch apart, so the ground shadows can lie between them as on the stage',()=>{
 const run=opts=>{const made=[],target=fakeCanvas(800,800);let silhouette=false;
  const painted=paintLight(target.getContext(),800,{light:'dusk',scene:'paper',items:[]},{createCanvas:(w,h)=>{const c=fakeCanvas(w,h);made.push(c);return c},paintSilhouette:()=>{silhouette=true},...opts});
  return {painted,modes:target.log.filter(e=>e.op==='fillRect'||e.op==='drawImage').map(e=>e.op_mode),made:made.length,silhouette}};
 const both=run({}),tone=run({patch:false}),patch=run({ambient:false});
 assert.deepEqual(tone,{painted:true,modes:['multiply','multiply','soft-light'],made:0,silhouette:false});
 assert.equal(patch.painted,true);assert.deepEqual(patch.modes,['screen']);assert.ok(patch.silhouette);
 assert.deepEqual(both.modes,[...tone.modes,...patch.modes]);
 const app=readFileSync(`${dist}compositor.js`,'utf8').replaceAll('\r\n','\n');
 assert.match(app,/\{patch:false\}\);\n paintGroundPass\(ctx,size,s,assets,images\);\n if\(lit\)paintLightPass\([^\n]*\{ambient:false\}\)/,'the draft: room tone, ground shadows, then the window patch');
});

test('compositor: the light layer sits right above the plain scene and its ground shadows, and only when asked for',()=>{
 const plan=compositorLayerPlan({items:[{id:'a',aboveVessel:false}]},item=>item.id,{light:true,ground:true});
 assert.deepEqual(plan.map(p=>p.kind),['background','ground','light','botanical','vessel','finish']);
 assert.equal(plan[2].name,'Window light');
 assert.deepEqual(compositorLayerPlan({items:[]},()=>'',{light:true}).slice(0,2).map(p=>p.kind),['background','light']);
 assert.ok(!compositorLayerPlan({items:[]},()=>'',{ground:true}).some(p=>p.kind==='light'));
 assert.ok(LIGHT.dir[0]>0,'the key light still comes from the upper left');
});

test('prompt: a window light replaces "keep the draft\'s lighting" and the mood keeps no light words of its own',()=>{
 const s=studyState(studies.find(st=>st.id==='cherry'),'en'),plain=buildPrompt(s,assetById,scenes);
 assert.match(plain,/Preserve the draft's overall light/);assert.doesNotMatch(plain,/^Light:/m);
 for(const key of LIGHT_KEYS){
  const text=buildPrompt({...s,light:key},assetById,scenes);
  assert.ok(text.includes(LIGHT_PROMPT[key]),key);
  assert.equal((text.match(/^Light: /mg)||[]).length,1,key);
  assert.doesNotMatch(text,/Preserve the draft's overall light/,key);
  for(const mood of ['静寂','侘寂','春意','野趣'])for(const scene of ['paper','night']){
   const m=buildPrompt({...s,light:key,mood,scene},assetById,scenes).match(/Mood: ([^\n]*)/)[1];
   assert.doesNotMatch(m,/\blight\b|morning|evening/,`${key} ${mood} ${scene}: ${m}`);
  }
 }
 assert.match(LIGHT_PROMPT.dusk,/from the left/);assert.match(LIGHT_PROMPT.moon,/from the upper right/);
 const own=buildPrompt({...s,light:'moon',intention:'Under paper lanterns.'},assetById,scenes);
 assert.match(own,/Preserve that light direction unless the creative note describes another light/);
 assert.doesNotMatch(buildPrompt({...s,light:'unknown'},assetById,scenes),/^Light:/m,'an unknown key adds nothing');
 assert.match(buildPrompt(initial(),assetById,scenes),/^Light:/m,'the first-run draft includes morning light');
});

test('app.js keeps s.light only as a known key, counts it as content, and the stage has the light layer and chip',()=>{
 const app=readFileSync(`${dist}app.js`,'utf8'),html=readFileSync(`${dist}index.html`,'utf8');
 assert.match(app,/\.\.\.\(lightOf\(v\.light\)\?\{light:lightOf\(v\.light\)\}:\{\}\)/,'validate() whitelists light through lightOf');
 assert.match(app,/function hasMeaningfulCanvas\(s\)\{[^\n]*!!lightOf\(s\.light\)\}/);
 assert.match(html,/<canvas id="scene-layer"[^>]*>\s*<\/canvas>\s*<canvas id="light-layer"/,'the light layer lies right above the scene');
 for(const key of ['',...LIGHT_KEYS])assert.match(html,new RegExp(`data-light="${key}"[^>]*data-zh="[^"]+" data-en="[^"]+" data-ja="[^"]+"`),`menu entry ${key||'none'} in three languages`);
 assert.equal(initial().light,'morning','the first-run draft starts in morning light');
 for(const study of studies)assert.ok(!studyState(study).light,`${study.id} has no light`);
});
