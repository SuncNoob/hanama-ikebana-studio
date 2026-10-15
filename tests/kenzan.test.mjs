// SPDX-FileCopyrightText: 2026 Marko Sun
// SPDX-License-Identifier: LicenseRef-Hanama-Proprietary
import test from 'node:test';
import assert from 'node:assert/strict';
import {assetById,vessels,studies,studyState,makeItem} from './helpers/catalog.mjs';
import {isKenzan,mouthBase,KENZAN,kenzanHolders,kenzanPins,onHolder} from '../dist/scale.js?v=hn3';
import {kenzanSeats,paintInsertedPass,paintKenzanPass,paintFixture} from '../dist/compositor.js?v=organic3';
import {vesselGeometry} from '../dist/geometry.js?v=organic3';

const KENZAN_VESSELS=['ink-black-low-bowl','charcoal-square-basin','celadon-shallow-suiban','indigo-oval-suiban','sand-wide-pottery-bowl','french-charcoal-compote','modern-travertine-trough'];
const close=(a,b,eps=1e-9)=>Math.abs(a-b)<=eps;
/** A 2D context stand-in that records every call in order (gradients are inert). */
function recorder(){
 const calls=[],gradient={addColorStop(){}};
 const ctx=new Proxy({},{get(target,key){
  if(key in target)return target[key];
  if(key==='calls')return calls;
  return (...args)=>{calls.push([key,...args]);return key.startsWith('create')?gradient:undefined};
 },set(target,key,value){target[key]=value;calls.push(['set',key,value]);return true}});
 return ctx;
}

test('the seven visible kenzan vessels hold water, and only they do',()=>{
 assert.deepEqual(vessels.filter(isKenzan).map(v=>v.id).sort(),[...KENZAN_VESSELS].sort());
 for(const v of vessels)assert.equal(!!v.fixture?.water,KENZAN_VESSELS.includes(v.id),`${v.id}: water`);
});

test('holders are round and foreshortened like the opening they stand in',()=>{
 for(const id of KENZAN_VESSELS){
  const vessel=assetById[id],g=vesselGeometry(vessel),holders=kenzanHolders(vessel);
  assert.equal(holders.length,g.fixture.centers.length,id);
  for(const h of holders){
   const o=g.openings[h.opening],open=o.radius[1]/o.radius[0],data=g.fixture.radius[1]/g.fixture.radius[0];
   assert.ok(close(h.ratio,o.shape==='rect'?Math.max(open,data):open),`${id}: ratio ${h.ratio}`);
   assert.ok(close(h.ry,h.rx*h.ratio)&&h.rx===g.fixture.radius[0],id);
   assert.equal(h.water,true);assert.equal(h.deep,vessel.fixture.visibility==='partial');
   const [x,y]=h.center;assert.ok(Math.abs(x-o.center[0])<o.radius[0]&&Math.abs(y-o.center[1])<o.radius[1]+1,`${id}: holder inside its opening`);
  }
 }
 assert.deepEqual(kenzanHolders(assetById['matte-black-long-neck']),[]);
 assert.deepEqual(kenzanHolders(assetById['english-pewter-compote']),[],'a wire mesh is not a kenzan');
});

test('pins stand on a staggered grid at the kenzan pitch, inside the clear rim, back rows first',()=>{
 for(const id of KENZAN_VESSELS){
  const h=kenzanHolders(assetById[id])[0],pins=kenzanPins(h),R=h.rx-KENZAN.margin;
  assert.equal(kenzanPins(h),pins,'cached per radius');
  assert.ok(pins.every(p=>Math.hypot(p.u,p.v)<=R+1e-6),`${id}: pins inside the rim`);
  for(let i=1;i<pins.length;i++)assert.ok(pins[i].v>=pins[i-1].v,`${id}: back to front`);
  const rows=[...new Set(pins.map(p=>p.v))];
  assert.ok(rows.slice(1).every((v,i)=>close(v-rows[i],KENZAN.pitch*Math.sqrt(3)/2,1e-3)),`${id}: row spacing`);
  for(const v of rows){const us=pins.filter(p=>p.v===v).map(p=>p.u);us.slice(1).forEach((u,i)=>assert.ok(close(u-us[i],KENZAN.pitch,1e-3),`${id}: pitch`))}
  const middle=rows.reduce((best,v)=>Math.abs(v)<Math.abs(best)?v:best),next=rows[rows.indexOf(middle)+1];
  const offset=(v)=>{const u=pins.find(p=>p.v===v).u;return ((u%KENZAN.pitch)+KENZAN.pitch)%KENZAN.pitch};
  assert.ok(close(Math.abs(offset(middle)-offset(next)),KENZAN.pitch/2,1e-3),`${id}: rows staggered by half a pitch`);
  const expected=Math.PI*R*R/(KENZAN.pitch*KENZAN.pitch*Math.sqrt(3)/2);
  assert.ok(Math.abs(pins.length/expected-1)<.15,`${id}: ${pins.length} pins for ${Math.round(expected)}`);
 }
});

test('onHolder measures a point on the foreshortened top face',()=>{
 const h=kenzanHolders(assetById['celadon-shallow-suiban'])[0];
 assert.deepEqual(onHolder(h,h.center),{u:0,v:0,on:true});
 assert.equal(onHolder(h,[h.center[0]+h.rx-.05,h.center[1]]).on,true);
 assert.equal(onHolder(h,[h.center[0]+h.rx+.05,h.center[1]]).on,false);
 const front=onHolder(h,[h.center[0],h.center[1]+h.ry*.5]);
 assert.ok(close(front.v,h.rx*.5)&&front.on);
});

test('every stem of the kenzan studies stands on a holder, in water, with its waterline above the base',()=>{
 let count=0;
 for(const study of studies.filter(study=>isKenzan(assetById[study.vessel]))){
  const s=studyState(study),seats=kenzanSeats(s,assetById);
  assert.equal(seats.back.length,0,`${study.id}: kenzan studies are all in front`);
  for(const seat of seats.front){
   assert.ok(seat.holder,`${study.id} ${seat.item.type}: on the pins`);
   assert.equal(seat.water,true);
   assert.ok(close(seat.base[1]-seat.waterline[1],KENZAN.water),`${study.id}: waterline`);
   assert.ok(seat.up[1]<0&&seat.width>=.25&&seat.width<=2.5);
   count++;
  }
  assert.equal(seats.front.length,s.items.filter(i=>i.aboveVessel).length,`${study.id}: every stem is seated`);
 }
 assert.ok(count>=60,`${count} seated kenzan stems`);
 // Other vessels have no kenzan seats; a stem lying down does not stand in the water.
 assert.deepEqual(kenzanSeats(studyState(studies.find(study=>!isKenzan(assetById[study.vessel]))),assetById),{front:[],back:[]});
 const vessel=assetById['celadon-shallow-suiban'],[x,y]=mouthBase(vessel,50,.55,{front:true});
 const lying=makeItem('photo-tulip',{x,y,angle:95,aboveVessel:true});
 assert.equal(kenzanSeats({vessel:vessel.id,items:[lying]},assetById).front.length,0);
});

test('on a kenzan the holder is painted before the stems behind the vessel, and their front pins after them',()=>{
 const vessel=assetById['celadon-shallow-suiban'],[x,y]=mouthBase(vessel,50,.55,{front:false});
 const item=makeItem('photo-tulip',{x,y,angle:0,aboveVessel:false}),sprite={width:40,height:120},vesselImage={width:400,height:200};
 const s={vessel:vessel.id,scene:'paper',items:[item]},seats=kenzanSeats(s,assetById);
 assert.equal(seats.back.length,1);assert.ok(seats.back[0].holder);
 const ctx=recorder();
 paintInsertedPass(ctx,1000,s,assetById,{[vessel.id]:vesselImage},()=>sprite,{seats});
 const calls=ctx.calls,first=(test,from=0)=>calls.findIndex((c,i)=>i>=from&&test(c));
 const stem=first(c=>c[0]==='drawImage'&&c[1]===sprite),face=first(c=>c[0]==='ellipse');
 assert.ok(face>=0&&stem>face,'holder first, then the stem standing on it');
 assert.ok(first(c=>c[0]==='arc',stem)>stem,'pins in front of the base are painted over the stem');
 assert.ok(first(c=>c[0]==='drawImage'&&c[1]===vesselImage,stem)>stem,'its submerged part is veiled');
 // The front pass touches only stems in front; a vessel without a kenzan paints nothing.
 assert.equal(paintKenzanPass(recorder(),1000,s,assetById,{},{seats,side:'front'}),0);
 assert.equal(paintKenzanPass(recorder(),1000,{...s,vessel:'english-cream-pitcher'},assetById,{}),0);
});

test('a wire support is still painted over the inserted stems',()=>{
 const vessel=assetById['english-pewter-compote'],g=vesselGeometry(vessel),o=g.openings[0];
 const item=makeItem('photo-tulip',{x:o.center[0],y:o.center[1],angle:0,aboveVessel:false}),sprite={width:40,height:120};
 const ctx=recorder();paintInsertedPass(ctx,1000,{vessel:vessel.id,scene:'paper',items:[item]},assetById,{},()=>sprite);
 const stem=ctx.calls.findIndex(c=>c[0]==='drawImage'&&c[1]===sprite),wire=ctx.calls.findIndex((c,i)=>i>stem&&c[0]==='stroke');
 assert.ok(stem>=0&&wire>stem);
 const fixture=recorder();paintFixture(fixture,1000,vessel);assert.ok(fixture.calls.some(c=>c[0]==='stroke'));
});

test('a holder deeper than the inner front edge is hidden below it by the front wall',()=>{
 for(const id of KENZAN_VESSELS){
  const vessel=assetById[id],g=vesselGeometry(vessel);
  for(const h of kenzanHolders(vessel)){
   if(h.lip===null)continue;
   const o=g.openings[h.opening];
   // The edge lies at or below the holder's top face and inside the opening, so the face (and the pins) stay visible.
   assert.ok(h.lip>=h.center[1]+h.ry-.05&&h.lip<o.center[1]+o.radius[1],`${id}: lip ${h.lip}`);
  }
 }
 for(const id of ['french-charcoal-compote','modern-travertine-trough'])assert.ok(kenzanHolders(assetById[id]).every(h=>Number.isFinite(h.lip)),id);
 const ctx=recorder();paintFixture(ctx,1000,assetById['modern-travertine-trough']);
 const lip=kenzanHolders(assetById['modern-travertine-trough'])[0].lip*10,at=ctx.calls.findIndex(c=>c[0]==='rect'&&close(c[4],lip,1e-6));
 assert.ok(at>0&&ctx.calls[at+1]?.[0]==='clip','clipped at the lip before the holder is drawn');
});
