// SPDX-FileCopyrightText: 2026 Marko Sun
// SPDX-License-Identifier: LicenseRef-Hanama-Proprietary
import test from 'node:test';
import assert from 'node:assert/strict';
import {assetById,initial} from './helpers/catalog.mjs';
import {editorialScale} from '../dist/real-scale.js?v=scale4';
import {editSizeBounds,sizeBounds,restoreReferenceSize,defaultStemGeometry,planSlot,seatState,tipPoint,solveTo} from '../dist/scale.js?v=scale4';
import {dimensions,sourceToStage,warpY} from '../dist/geometry.js?v=soft2';
import {normalizeStemSplit} from '../dist/stem-length.js';
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
const near=(a,b,msg)=>assert.ok(Math.abs(a-b)<1e-8,msg||`${a} != ${b}`);
const oldItem=(id,h)=>({id:'old',type:id,h,x:48,y:65,angle:24,trim:6,length:.9,flip:true,cropAnchorY:1,cropAnchorSourceY:.94,cuts:[],segments:[],localCuts:[]});

test('editorial reference calibration reduces close-up flower heads while keeping branch and foliage sizes',()=>{
 assert.equal(Object.keys(editorialScale).length,12);
 for(const id of ['rose','camellia','calla','cosmos','iris','chrysanthemum','ranunculus']){
  const a=assetById[`editorial-${id}`];assert.equal(a.height,editorialScale[a.id].cm);assert.ok(a.height<a.designHeight*.7,a.id);
 }
 for(const id of ['sakura','eucalyptus','pine','pampas','maple']){const a=assetById[`editorial-${id}`];assert.equal(a.height,a.designHeight,a.id)}
 assert.equal(assetById['ivory-tall-cylinder'].height,31,'the vessel was not enlarged to hide the flower calibration problem');
});

test('editing bounds include old saved sizes, so a scale-1 move or rotation cannot silently resize them',()=>{
 for(const [id,reference] of Object.entries(editorialScale)){
  const a=assetById[id];
  for(const h of [2,a.height,a.designHeight,95]){
   const [lo,hi]=editSizeBounds(a,h);assert.ok(lo<=h&&hi>=h,id);assert.equal(clamp(h*1,lo,hi),h,id);
  }
  const [lo,hi]=editSizeBounds(a);assert.ok(lo<a.height*.8&&hi>a.height*1.25,id);
  for(const h of [-1,0,1,1000,NaN]){const [min,max]=editSizeBounds(a,h);assert.ok(min>=2&&max<=95&&min<=max,id)}
  assert.deepEqual(sizeBounds(a),[Math.round(reference.cm*.8*10)/10,Math.round(reference.cm*1.25*10)/10],'natural layout limits stay separate');
 }
});

test('reference calibration leaves the geometry of old unmodified and pruned drafts unchanged',()=>{
 for(const id of Object.keys(editorialScale)){
  const a=assetById[id],beforeAsset={...a,height:a.designHeight},item=oldItem(id,a.designHeight),saved=JSON.stringify(item);
  for(const uv of [[.2,.15],[.55,.35],[.5,.7],[.5,.94]])assert.deepEqual(sourceToStage(uv,item,a),sourceToStage(uv,item,beforeAsset),id);
  assert.deepEqual(dimensions(item,a),dimensions(item,beforeAsset));assert.equal(JSON.stringify(item),saved);
  assert.equal(normalizeStemSplit(item.stemSplit,item,a),null,'a loaded old item never gains a new stem split');
  const cut={...item,cuts:[{kind:'brush',radius:.02,points:[[.5,.6]]}]};assert.deepEqual(defaultStemGeometry(a,cut),{});
 }
});

test('new default flowers reach their design positions with a separate lower stem, while their heads stay reference-sized',()=>{
 const s=initial(),vessel=assetById[s.vessel];
 for(const item of s.items){
  const a=assetById[item.type],split=normalizeStemSplit(item.stemSplit,item,a);
  assert.ok(split!==null&&split>a.tip[1]&&split>=a.bendLimit,a.id);
  assert.ok(item.length>=.6&&item.length<=2.4,a.id);assert.ok(seatState(item,a,vessel).seated,a.id);
  // Two points inside the flower have the same separation at either stem-length extreme.
  const y0=a.tip[1],y1=Math.min(split,y0+.1);near((warpY(y1,split,.6)-warpY(y0,split,.6))*item.h,(warpY(y1,split,2.4)-warpY(y0,split,2.4))*item.h,a.id);
 }
 const calla=s.items.find(i=>i.type==='editorial-calla'),second=s.items.filter(i=>i.type==='editorial-calla')[1];
 assert.equal(calla.h,36);assert.equal(second.h,32.4);assert.ok(calla.length>1.5&&second.length>1.2,'length comes from the stem, not an oversized flower');
 const p=planSlot({id:'calibration',vessel:'ivory-tall-cylinder',items:[]},assetById['editorial-calla'],assetById);
 assert.equal(p.fit.miss,0);assert.ok(p.fit.length>1.5);assert.ok(p.headroom>=3);
});

test('explicit size reset preserves the lower stem and root; existing cuts keep their original split',()=>{
 const a=assetById['editorial-calla'],item=oldItem(a.id,44),root=[item.x,item.y],old=structuredClone(item),split=.46;
 const lower=(i,s)=>{const g=dimensions(i,a);return (warpY(g.end,g.split,g.length)-warpY(s,g.split,g.length))*i.h};
 const patch=restoreReferenceSize(item,a);assert.deepEqual(item,old,'the reset helper is pure');Object.assign(item,patch);assert.equal(item.h,a.height);assert.deepEqual([item.x,item.y],root);assert.equal(item.stemSplit,split);near(lower(item,split),lower(old,split));
 for(const kind of ['cuts','segments','localCuts']){
  const cut={...old,[kind]:[{keep:'source coordinates'}]},before=structuredClone(cut);Object.assign(cut,restoreReferenceSize(cut,a));
  assert.deepEqual(cut,{...before,h:a.height},kind);
 }
});

test('the new stretch solver is opt-in: an old editorial item keeps the legacy photographic length band',()=>{
 const a=assetById['editorial-rose'],old=oldItem(a.id,42),base=[50,65],target=[48,30];
 const plain=solveTo(old,a,base,target);assert.ok(plain.length>=.9&&plain.length<=1.15);assert.equal(Object.hasOwn(plain,'stemSplit'),false);
 const fresh={...old,h:a.height,...defaultStemGeometry(a,old)},fit=solveTo(fresh,a,base,target);
 assert.equal(fit.stemSplit,fresh.stemSplit);assert.ok(fit.length>1.15);
 assert.ok(tipPoint({...fresh,...fit},a).every(Number.isFinite));
});
