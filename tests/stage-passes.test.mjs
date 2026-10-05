// SPDX-FileCopyrightText: 2026 Marko Sun
// SPDX-License-Identifier: LicenseRef-Hanama-Proprietary
import test from 'node:test';
import assert from 'node:assert/strict';
import {assetById,vessels,studies,studyState,makeItem} from './helpers/catalog.mjs';
import {seatClip,seatState,stemWidthCm,vesselFoot,isKenzan,INTERIOR_MIN_RX} from '../dist/scale.js?v=hn2';
import {LIGHT,lightShadow,HORIZON,filterSupported,seatedClips} from '../dist/compositor.js?v=hn2';
import {vesselMetrics} from '../dist/asset-metrics.js?v=hn2';
import {vesselGeometry} from '../dist/geometry.js?v=28';

const NECK='matte-black-long-neck';
const length=clip=>Math.hypot(clip.tip[0]-clip.base[0],clip.tip[1]-clip.base[1]);
const inOpening=(o,[x,y])=>{const r=-(o.rotation||0),px=x-o.center[0],py=y-o.center[1];return ((px*Math.cos(r)-py*Math.sin(r))/o.radius[0])**2+((px*Math.sin(r)+py*Math.cos(r))/o.radius[1])**2<=1};
const stemAt=(vessel,type,options)=>{const g=vesselGeometry(vessel);return makeItem(type,{x:g.insertion[0],y:g.insertion[1],...options})};

test('studies: seated stems behind a wide mouth get an interior pass, front stems under the rim a rim cover, kenzan stems none',()=>{
 const counts={interior:0,rim:0};
 for(const study of studies){
  const s=studyState(study),vessel=assetById[s.vessel],g=vesselGeometry(vessel);
  for(const item of s.items){
   const a=assetById[item.type],clip=seatClip(item,a,vessel),seat=seatState(item,a,vessel);
   if(!seat.seated){assert.equal(clip,null,`${study.id} ${item.type}`);continue}
   const opening=g.openings[seat.opening];
   if(!item.aboveVessel){
    if(opening.radius[0]<INTERIOR_MIN_RX){assert.equal(clip,null,`${study.id} ${item.type}: narrow mouths show nothing inside`);continue}
    assert.equal(clip?.kind,'interior',`${study.id} ${item.type}`);
    assert.ok(Math.abs(length(clip)-15)<1e-9&&clip.radius>=1.2,`${study.id} ${item.type} interior capsule`);
    assert.equal(clip.floor,isKenzan(vessel)?null:opening.center[1]+opening.radius[1]*.5);
    counts.interior++;continue;
   }
   const below=item.y-opening.frontRimY,underLip=item.y>opening.center[1]&&!inOpening(opening,[item.x,item.y]);
   if(below>0||underLip){
    assert.equal(clip?.kind,'rim',`${study.id} ${item.type}`);
    assert.ok(clip.radius>=1&&clip.centerY===g.openings[clip.opening].center[1]);
    // The cover reaches 0.4 cm past the point where the stem first stands over the opening or its centre line.
    const o=g.openings[clip.opening],up=[(clip.tip[0]-clip.base[0])/length(clip),(clip.tip[1]-clip.base[1])/length(clip)],at=t=>[clip.base[0]+up[0]*t,clip.base[1]+up[1]*t];
    const reached=at(length(clip)-.4+1e-6);assert.ok(reached[1]<=o.center[1]||inOpening(o,reached),`${study.id} ${item.type} cover ends over the opening`);
    assert.ok(!(at(length(clip)-.6)[1]<=o.center[1]||inOpening(o,at(length(clip)-.6))),`${study.id} ${item.type} cover not longer than needed`);
    counts.rim++;
   }else assert.equal(clip,null,`${study.id} ${item.type} stands above its rim`);
   if(isKenzan(vessel))assert.equal(clip,null,`${study.id} ${item.type} on the pins`);
  }
 }
 assert.ok(counts.interior>=80&&counts.rim>=18,JSON.stringify(counts));
});

test('rim cover in a narrow neck: upright stems are covered up to the opening, leaning ones up to its centre line',()=>{
 const vessel=assetById[NECK],o=vesselGeometry(vessel).openings[0],a=assetById['photo-tulip'];
 const upright=seatClip(stemAt(vessel,'photo-tulip',{angle:0,aboveVessel:true}),a,vessel);
 assert.equal(upright.kind,'rim');
 assert.ok(Math.abs(upright.tip[0]-upright.base[0])<1e-9&&upright.tip[1]<o.frontRimY);
 assert.ok(upright.tip[1]>o.center[1]-.5,'stops just inside the opening');
 const leaning=seatClip(stemAt(vessel,'photo-tulip',{angle:60,aboveVessel:true}),a,vessel);
 assert.ok(length(leaning)>length(upright)&&leaning.tip[0]>leaning.base[0]);
 assert.ok(Math.abs(leaning.tip[1]-(o.center[1]-.4*Math.cos(Math.PI/3)))<.06,'leaves the opening sideways: covered to its centre line');
 // Behind a narrow neck the stem simply disappears; behind a wide mouth its lowest 15 cm shows inside the opening.
 assert.equal(seatClip(stemAt(vessel,'photo-tulip',{angle:0,aboveVessel:false}),a,vessel),null);
 const wide=assetById['english-cream-pitcher'],back=seatClip(stemAt(wide,'photo-tulip',{angle:0,aboveVessel:false}),a,wide);
 assert.equal(back.kind,'interior');assert.ok(Math.abs(back.tip[1]-(back.base[1]-15))<1e-9&&back.floor>vesselGeometry(wide).openings[0].center[1]);
 // Not seated, detached, or above the front rim: nothing.
 assert.equal(seatClip(stemAt(vessel,'photo-tulip',{angle:0,aboveVessel:true,x:20}),a,vessel),null);
 assert.equal(seatClip(stemAt(vessel,'photo-tulip',{angle:0,aboveVessel:true,localCuts:[{part:'detached',cut:{}}]}),a,vessel),null);
 assert.equal(seatClip(stemAt(vessel,'photo-tulip',{angle:0,aboveVessel:true,y:o.frontRimY-.2}),a,vessel),null);
 assert.equal(seatClip(stemAt(vessel,'photo-tulip',{angle:0,aboveVessel:true}),undefined,vessel),null);
});

test('a measured stem foot moves the cover onto the stem, follows its direction and hugs its width',()=>{
 const vessel=assetById[NECK],g=vesselGeometry(vessel),a=assetById['photo-tulip'],item=stemAt(vessel,'photo-tulip',{angle:0,aboveVessel:true});
 const foot={x:g.insertion[0]+.4,y:g.insertion[1]+.1,width:.6,dir:[.6,-.8],slack:.2};
 const clip=seatClip(item,a,vessel,foot);
 assert.deepEqual(clip.base,[foot.x,foot.y]);
 const d=length(clip);assert.ok(Math.abs((clip.tip[0]-clip.base[0])/d-.6)<1e-9&&Math.abs((clip.tip[1]-clip.base[1])/d+.8)<1e-9);
 assert.equal(clip.radius,Math.max(.55,.3+.3));
 // A foot outside the opening unseats the stem; a foot without a usable direction keeps the stem's own axis.
 assert.equal(seatClip(item,a,vessel,{...foot,x:foot.x+9}),null);
 const plain=seatClip(item,a,vessel,{...foot,dir:[0,1]});assert.ok(Math.abs(plain.tip[0]-plain.base[0])<1e-9);
 assert.equal(seatClip(item,a,vessel,{x:NaN,y:1,width:1}).base[0],item.x,'an unusable foot is ignored');
});

test('stem width estimates stay within 0.25–2.5 cm and drawn bundles are wider than single stems',()=>{
 for(const id of ['photo-tulip','photo-lavender','photo-rose','study-rose-half-open','pine','photo-sakura']){
  const a=assetById[id],w=stemWidthCm(makeItem(id),a);assert.ok(w>=.25&&w<=2.5,`${id} ${w}`);
 }
 const bundle=assetById['photo-lavender'],single=assetById['photo-cosmos'];
 assert.ok(stemWidthCm(makeItem(bundle.id,{length:1.6}),bundle)>stemWidthCm(makeItem(single.id,{length:1.6}),single));
});

test('vessel feet come from the measured footprint, scale with the vessel and fall back to an estimate',()=>{
 for(const v of vessels){
  const foot=vesselFoot(v),g=vesselGeometry(v);
  assert.ok(foot.half>0&&foot.half<=g.width/2+.5&&foot.arc>=0&&foot.bottom<=g.top+g.height+1e-9&&foot.bottom>g.top+g.height-2,v.id);
  if(vesselMetrics[v.id])assert.ok(Math.abs(foot.half-vesselMetrics[v.id].foot.half)<1e-9,`${v.id} measured at its own height`);
 }
 const v=assetById['celadon-shallow-suiban'],taller={...v,height:v.height*1.5,width:v.width},foot=vesselFoot(v),grown=vesselFoot(taller);
 assert.ok(Math.abs(grown.half-foot.half*1.5)<1e-9&&Math.abs(grown.arc-foot.arc*1.5)<1e-9);
 const unknown=vesselFoot({...v,id:'no-such-vessel'});assert.equal(unknown.cx,50);assert.ok(unknown.half>0&&unknown.bottom===vesselGeometry(v).top+vesselGeometry(v).height);
});

test('one light: every shadow falls the same way, stems behind the vessel cast farther and softer than stems in front',()=>{
 const [dx,dy]=LIGHT.dir;assert.ok(dx>0&&dy>0&&Math.abs(Math.hypot(dx,dy)-1)<1e-9);
 const front=lightShadow('front',1000,'paper'),back=lightShadow('back',1000,'paper'),vessel=lightShadow('vessel',1000,'night');
 for(const s of [front,back,vessel])assert.ok(Math.abs(s.x/s.y-dx/dy)<1e-9);
 assert.ok(Math.hypot(back.x,back.y)>=12&&Math.hypot(back.x,back.y)<=16,'back offset 1.2–1.6 cm');
 assert.ok(back.blur>front.blur&&Math.abs(back.blur-20)<1e-9);
 const alpha=c=>parseInt(c.slice(7,9),16)/255;assert.ok(Math.abs(alpha(back.color)-.06)<.01&&alpha(front.color)>alpha(back.color));
 assert.ok(alpha(lightShadow('front',1000,'night').color)>alpha(front.color),'night shadows are darker');
 assert.equal(lightShadow('front',1000,'unknown-scene').color,front.color);
 assert.equal(HORIZON,.795);
});

test('canvas filter support is a pixel test: a canvas that ignores filter reports false, and no canvas at all is not cached',()=>{
 assert.equal(filterSupported(()=>{throw Error('no document')}),false);
 const ignoring=(w,h)=>({width:w,height:h,getContext:()=>({filter:'none',fillStyle:'',fillRect(){},getImageData:()=>({data:new Uint8ClampedArray(4)})})});
 assert.equal(filterSupported(ignoring),false);
 assert.equal(filterSupported(()=>{throw Error('cached already')}),false);
});

test('seatedClips without sprites matches seatClip for every study stem',()=>{
 for(const study of studies.slice(0,12)){
  const s=studyState(study),clips=seatedClips(s,assetById);
  const expected=s.items.map(item=>seatClip(item,assetById[item.type],assetById[s.vessel])).filter(Boolean);
  assert.deepEqual([...clips.interior,...clips.rim].map(c=>c.clip).sort((p,q)=>p.base[0]-q.base[0]||p.kind.localeCompare(q.kind)),expected.sort((p,q)=>p.base[0]-q.base[0]||p.kind.localeCompare(q.kind)));
  assert.ok(clips.interior.every(c=>!c.item.aboveVessel)&&clips.rim.every(c=>c.item.aboveVessel));
 }
});
