// SPDX-FileCopyrightText: 2026 Marko Sun
// SPDX-License-Identifier: LicenseRef-Hanama-Proprietary
import test from 'node:test';
import assert from 'node:assert/strict';
import {assetById,vessels,studies,studyState,makeItem,browseSpecimens} from './helpers/catalog.mjs';
import {
 mouthBase,mouthSpan,reach,aim,solveTo,seatState,autoFront,isKenzan,tipPoint,crownPoint,headroom,planSlot,slotState,slotTarget,shinCm,SLOTS,hashId,
 defaultCm,arrangementMetrics,remapSeated,drawsStem,stemCm,lengthBounds,lengthForStem,itemCm,PHOTO_LENGTH,angleCap,sizeBounds,isDetachedPiece
} from '../dist/scale.js?v=hn3';
import {stemMaxCm} from '../dist/botany.js';
import {vesselGeometry} from '../dist/geometry.js?v=28';

const KENZAN=['ink-black-low-bowl','charcoal-square-basin','celadon-shallow-suiban','indigo-oval-suiban','sand-wide-pottery-bowl','french-charcoal-compote','modern-travertine-trough'];
const RECIPES=[['pine','calla','photo-chrysanthemum','photo-gypsophila','photo-rose'],['photo-anemone','photo-ranunculus','photo-tulip','photo-muscari','photo-narcissus']];
const insideFixture=(vessel,[x,y])=>{const f=vesselGeometry(vessel).fixture;return f.centers.some(c=>((x-c[0])/f.radius[0])**2+((y-c[1])/f.radius[1])**2<=1)};
const dist=(p,q)=>Math.hypot(p[0]-q[0],p[1]-q[1]);
/** Two arrangement ids whose hashes lean opposite ways. */
const SIDES=(()=>{const ids=[];for(let k=0;ids.length<2;k++){const id=`side-${k}`;if(!ids.some(i=>(hashId(i)&1)===(hashId(id)&1)))ids.push(id)}return ids})();
/** Add stems one by one exactly as the editor will: plan a slot, then take its size, mirror, depth and solved fit. */
function arrange(vessel,id,types){
 const s={id,vessel:vessel.id,items:[]},plans=[];
 for(const type of types){
  const a=assetById[type],plan=planSlot(s,a,assetById),{miss,...fit}=plan.fit;
  s.items.push(Object.assign(makeItem(type,{h:plan.h,flip:plan.flip,aboveVessel:plan.front}),fit));plans.push(plan);
 }
 return {s,plans};
}

test('kenzan vessels: bases stand on the pins, in front of or behind the holder’s centre; every other vessel keeps its old mouth',()=>{
 assert.deepEqual(vessels.filter(isKenzan).map(v=>v.id).sort(),[...KENZAN].sort());
 for(const vessel of vessels){
  const g=vesselGeometry(vessel);
  for(const x of [-40,0,30,45,50,55,70,140,NaN])for(const front of [false,true]){
   const base=mouthBase(vessel,x,.8,{front});
   assert.ok(base.every(Number.isFinite),`${vessel.id}: base at ${x}`);
   if(isKenzan(vessel)){
    assert.ok(insideFixture(vessel,base),`${vessel.id}: kenzan base ${base} outside the holder`);
    assert.ok(seatState({x:base[0],y:base[1],angle:0},null,vessel).seated,`${vessel.id}: kenzan base unseated`);
   }else{
    // Byte-identical to the rule before kenzans existed: the primary opening's insertion depth, x clamped to the spread.
    const openings=g.openings.length?g.openings:[{center:g.insertion,radius:[2,1]}],primary=openings.find(o=>o.primary)||openings[0];
    const nearest=openings.reduce((b,o)=>Math.abs(o.center[0]-x)<Math.abs(b.center[0]-x)?o:b,openings[0]),cx=nearest===primary?g.insertion[0]:nearest.center[0];
    assert.deepEqual(mouthBase(vessel,x,.8,{front}),mouthBase(vessel,x,.8));
    if(nearest===primary)assert.equal(base[1],g.insertion[1]);
    assert.ok(Math.abs(base[0]-cx)<=nearest.radius[0]*.8+1e-9);
   }
  }
  const [bx,by]=mouthBase(vessel,50,.8,{front:true}),[,backY]=mouthBase(vessel,50,.8);
  if(isKenzan(vessel))assert.ok(by>backY,`${vessel.id}: front stems stand nearer the camera`);
 }
});

test('autoFront: every kenzan draws stems before the vessel; necks whose insertion lies below the rim keep them behind',()=>{
 for(const id of KENZAN)assert.equal(autoFront(assetById[id]),true,id);
 for(const vessel of vessels.filter(v=>v.fixture?.kind==='neck')){
  const g=vesselGeometry(vessel),p=g.openings.find(o=>o.primary)||g.openings[0];
  if(g.insertion[1]>=p.frontRimY-.3)assert.equal(autoFront(vessel),false,vessel.id);
 }
 assert.equal(autoFront(assetById.round),false);
 assert.equal(vessels.filter(autoFront).length>=KENZAN.length,true);
});

test('seatState: the mouth and kenzan bases are seated; far away, sunk below the rim or upside down is not',()=>{
 for(const vessel of vessels){
  const g=vesselGeometry(vessel),a=assetById['photo-rose'],[x,y]=mouthBase(vessel,g.insertion[0]);
  assert.equal(seatState({x,y,angle:20},a,vessel).seated,true,`${vessel.id}: mouth`);
  assert.deepEqual(seatState({x,y,angle:20},a,vessel).gap,0);
  const off=seatState({x:x+g.width,y,angle:0},a,vessel);assert.equal(off.seated,false);assert.ok(off.gap>1);
  assert.equal(seatState({x,y:y+12,angle:0},a,vessel).seated,false,`${vessel.id}: below the rim`);
  assert.equal(seatState({x,y,angle:150},a,vessel).seated,false);
  assert.equal(seatState({x,y:g.top-6,angle:0},a,vessel).seated,false,`${vessel.id}: floating above`);
 }
});

test('aim keeps length, trim and pivot and only turns the stem; reach is unchanged by the shared helper',()=>{
 const a=assetById['photo-rose'],vessel=assetById.round,base=mouthBase(vessel,50),item=makeItem(a.id,{x:base[0],y:base[1]});
 const r=reach(item,a,base,[60,30]);Object.assign(item,r);
 assert.equal(aim(item,a,base,tipPoint(item,a)),item.angle);
 const turned={...item,angle:aim(item,a,base,[40,32])},tip=tipPoint(turned,a);
 assert.ok(Math.abs(Math.atan2(tip[1]-base[1],tip[0]-base[0])-Math.atan2(32-base[1],40-base[0]))<.01,'aimed along the line to the target');
 const pine=assetById['pine-green-sparse'],p=makeItem(pine.id,{x:base[0],y:base[1]});
 assert.deepEqual(Object.keys(reach(p,pine,base,[45,25])),['x','y','length','angle','cropAnchorY']);
 assert.equal(reach(p,pine,base,[50,base[1]-2]).length,lengthBounds(pine)[0],'reach still squashes to its floor (validate/legacy behaviour)');
});

test('solveTo: photographed stems are cut, never squashed, and only slightly stretched; drawn stems grow within the species cap',()=>{
 const vessel=assetById.round,base=mouthBase(vessel,50);
 for(const a of browseSpecimens){
  for(const rise of [6,14,30,52]){
   const item=makeItem(a.id,{x:base[0],y:base[1]}),fit=solveTo(item,a,base,[base[0]+rise*.3,base[1]-rise]);
   assert.ok(Number.isFinite(fit.angle)&&Number.isFinite(fit.length)&&Number.isFinite(fit.miss),`${a.id}: unsolved`);
   assert.deepEqual([fit.x,fit.y],base);assert.equal(fit.cropAnchorY,1);assert.equal(fit.cropAnchorSourceY,null);
   const placed={...item,...fit},tip=tipPoint(placed,a);
   assert.ok(Math.abs(dist(tip,[base[0]+rise*.3,base[1]-rise])-fit.miss)<.06,`${a.id}: miss is the focus error`);
   if(drawsStem(a)){
    assert.equal(fit.trim,0,`${a.id}: drawn stems are never trimmed`);
    assert.ok(fit.length>=1-1e-9,`${a.id}: the photographed head is never squashed`);
    assert.ok(stemCm(placed,a)<=stemMaxCm(a)+.05,`${a.id}: ${stemCm(placed,a).toFixed(1)} cm drawn stem over its cap`);
   }else{
    assert.ok(fit.length>=PHOTO_LENGTH[0]-1e-9&&fit.length<=PHOTO_LENGTH[1]+1e-9,`${a.id}: length ${fit.length}`);
    assert.ok(Number.isInteger(fit.trim)&&fit.trim>=0&&fit.trim<=60,`${a.id}: trim ${fit.trim}`);
    if(fit.trim>0){
     // Cut only as deep as needed: one percent less would still be too long at the shortest allowed length.
     const shallower=tipPoint({...placed,trim:fit.trim-1,length:PHOTO_LENGTH[0]},a);
     assert.ok(dist(shallower,base)>=rise*Math.hypot(.3,1)-.05||fit.trim===60,`${a.id}: cut ${fit.trim}% deeper than needed`);
    }
    assert.ok(1-fit.trim/100>(a.tip?.[1]??.2),`${a.id}: the cut stays below the focus`);
   }
  }
 }
 // An existing cut is never undone, and a stem that is too short stays short instead of stretching.
 const pine=assetById['pine-green-sparse'],cut=makeItem(pine.id,{trim:20});
 assert.ok(solveTo(cut,pine,base,[50,base[1]-60]).trim>=20);
 const shortFit=solveTo(makeItem(pine.id),pine,base,[50,2]);assert.equal(shortFit.length,PHOTO_LENGTH[1]);assert.ok(shortFit.miss>5);
 // A drawn stem asked to reach far stops at its species cap.
 const muscari=assetById['photo-muscari'],m=makeItem(muscari.id),far=solveTo(m,muscari,base,[50,5]);
 assert.ok(Math.abs(stemCm({...m,...far},muscari)-stemMaxCm(muscari))<.05);assert.ok(far.miss>10);
 assert.ok(Math.abs(lengthForStem(m,muscari,stemMaxCm(muscari))-far.length)<.002);
});

test('slots: the main line is 1.5× (Japanese, modern) or 1.25× the vessel’s larger side; slots mirror with the side',()=>{
 for(const vessel of vessels){
  const g=vesselGeometry(vessel),M=Math.max(g.height,g.width),f=['japanese','modern'].includes(vessel.style)?1.5:1.25;
  assert.ok(Math.abs(shinCm(vessel)-Math.min(Math.max(f*M,M),g.insertion[1]-8))<1e-9,vessel.id);
  for(const s of SLOTS){
   const r=slotTarget(vessel,s.key,1),l=slotTarget(vessel,s.key,-1);
   assert.ok(Math.abs(r[0]-g.insertion[0]+(l[0]-g.insertion[0]))<1e-9&&Math.abs(r[1]-l[1])<1e-9,`${vessel.id}/${s.key}`);
   assert.ok(Math.abs(dist(r,g.insertion)-s.frac*shinCm(vessel))<1e-9);
  }
 }
 assert.deepEqual(SLOTS.map(s=>[s.key,s.lean,s.frac]),[['shin',12,1],['soe',42,.75],['hikae',-65,.56],['jushi-1',20,.45],['jushi-2',-25,.38],['jushi-3',35,.3],['jushi-4',-15,.25]]);
 assert.notEqual(hashId(SIDES[0])&1,hashId(SIDES[1])&1);
 assert.equal(hashId('abc'),hashId('abc'));
});

test('planSlot over 31 vessels × 2 sides × two recipes: seated, on stage, apart, honest lengths',()=>{
 let count=0;
 for(const types of RECIPES)for(const vessel of vessels)for(const id of SIDES){
  const {s,plans}=arrange(vessel,id,types);count++;
  assert.equal(plans[0].slot,'shin',`${vessel.id}: the first stem takes the main line`);
  assert.notEqual(plans[0].fit.angle,0,`${vessel.id}: the first stem leans`);
  assert.equal(new Set(plans.map(p=>p.key)).size,plans.length,`${vessel.id}/${id}: two stems share a slot (${plans.map(p=>p.key)})`);
  const tips=s.items.map(i=>tipPoint(i,assetById[i.type]));
  for(let i=0;i<tips.length;i++)for(let j=i+1;j<tips.length;j++)assert.ok(dist(tips[i],tips[j])>=5,`${vessel.id}/${id}: ${s.items[i].type} and ${s.items[j].type} focus ${dist(tips[i],tips[j]).toFixed(1)} cm apart`);
  s.items.forEach((item,k)=>{
   const a=assetById[item.type],label=`${vessel.id}/${id}/${item.type}`;
   assert.ok(seatState(item,a,vessel).seated,`${label}: unseated`);
   assert.ok(crownPoint(item,a).every(v=>v>=3&&v<=97),`${label}: crown ${crownPoint(item,a).map(v=>v.toFixed(1))}`);
   assert.ok(headroom(item,a)>=3,`${label}: headroom ${headroom(item,a).toFixed(1)}`);
   assert.equal(item.aboveVessel,plans[k].front);
   if(autoFront(vessel))assert.equal(item.aboveVessel,true,`${label}: kenzan stems stand before the vessel`);
   if(!drawsStem(a))assert.ok(item.length>=.85&&item.length<=1.2&&item.trim>=0&&item.trim<=60,`${label}: length ${item.length} trim ${item.trim}`);
   else assert.ok(stemCm(item,a)<=stemMaxCm(a)+.05,`${label}: drawn stem over its cap`);
   const [minH,maxH]=sizeBounds(a);assert.ok(item.h>=minH-.05&&item.h<=maxH+.05,`${label}: size`);
  });
  const {taken}=slotState(s,assetById);
  for(const p of plans)assert.equal(taken[p.key],true,`${vessel.id}/${id}: ${p.key} not seen as taken after placing it`);
 }
 assert.equal(count,124);
});

test('planSlot roles: line → main and second lines, focal → accent once a line stands, fillers → low; low blooms go in front',()=>{
 const vessel=assetById.round,{plans}=arrange(vessel,SIDES[0],['pine','calla','photo-chrysanthemum','photo-gypsophila']);
 assert.deepEqual(plans.map(p=>p.slot),['shin','soe','hikae','jushi']);
 assert.deepEqual(plans.map(p=>p.front),[false,false,true,false]);
 assert.equal(plans[3].key,'jushi-4');
 // On an empty canvas a focal flower takes the main line, but its drawn stem stays within the species' length.
 const anemone=assetById['photo-anemone'],first=planSlot({id:SIDES[0],vessel:'round',items:[]},anemone,assetById);
 assert.equal(first.slot,'shin');assert.ok(stemCm({...makeItem(anemone.id,{h:first.h}),...first.fit},anemone)<=stemMaxCm(anemone)+.05);
 // The arrangement keeps the side of its tallest stem.
 const s={id:SIDES[1],vessel:'round',items:[]};const {s:left}=arrange(vessel,SIDES[0],['pine']),lean=Math.sign(tipPoint(left.items[0],assetById.pine)[0]-50);
 assert.equal(slotState({...left,id:SIDES[1]},assetById).side,lean);assert.equal(slotState(s,assetById).side,hashId(SIDES[1])&1?1:-1);
});

test('planSlot keeps tall branches below the top of the stage in tall vessels',()=>{
 for(const vessel of vessels)for(const type of ['quince-red-upright','pampas','willow-green-arch','photo-delphinium','photo-foxglove','pose-amaranthus-alternate'].filter(t=>assetById[t])){
  const a=assetById[type],plan=planSlot({id:SIDES[0],vessel:vessel.id,items:[]},a,assetById),item={...makeItem(type,{h:plan.h,flip:plan.flip}),...plan.fit};
  assert.ok(headroom(item,a)>=3,`${vessel.id}/${type}: headroom ${headroom(item,a).toFixed(1)}`);
  assert.equal(plan.headroom,Math.round(headroom(item,a)*10)/10);
 }
});

test('defaultCm is the whole stem a material gets as the first stem, and arrangementMetrics measures to crowns',()=>{
 const round=assetById.round;
 for(const a of browseSpecimens){
  const cm=defaultCm(a,round),plan=planSlot({items:[],vessel:round,id:'default'},a,{});
  assert.ok(cm>0&&cm<100,`${a.id}: ${cm}`);
  assert.equal(cm,Math.round(itemCm({...makeItem(a.id,{h:plan.h,flip:plan.flip}),...plan.fit},a)*10)/10);
 }
 const s=studyState(studies.find(st=>st.id==='cherry')),m=arrangementMetrics(s,assetById),g=vesselGeometry(assetById[s.vessel]);
 const crowns=s.items.map(i=>crownPoint(i,assetById[i.type])),top=Math.min(...crowns.map(c=>c[1]));
 assert.equal(m.vesselCm,Math.round(g.height*10)/10);
 assert.equal(m.tallest.cmAboveTable,Math.round((86-top)*10)/10);
 assert.equal(m.tallest.family,'sakura');
 assert.ok(m.tallest.ratio>1&&m.tallest.ratio<3);
 assert.ok(m.spreadCm>10&&m.spreadCm<80);
 assert.ok(Math.abs(m.tallest.lean)<45);
 assert.deepEqual(arrangementMetrics({vessel:'round',items:[]},assetById),{tallest:null,spreadCm:0,vesselCm:Math.round(vesselGeometry(round).height*10)/10});
});

test('remapSeated over every study × every vessel: no stem that stood in the old vessel is left outside the new one',()=>{
 let switches=0,moved=0;
 for(const study of studies){
  const s=studyState(study),from=assetById[s.vessel];
  for(const to of vessels){
   if(to.id===from.id)continue;switches++;
   const out=remapSeated(s.items,from,to,assetById);
   assert.equal(out.length,s.items.length);
   out.forEach((item,k)=>{
    const before=s.items[k],a=assetById[item.type];
    assert.notEqual(item,before,'items are copied, never mutated');
    if(seatState(before,a,from).seated)assert.ok(seatState(item,a,to).seated,`${study.id} → ${to.id}: ${item.type} left the vessel`);
    if(isKenzan(to)&&seatState(before,a,from).seated)assert.ok(insideFixture(to,[item.x,item.y]),`${study.id} → ${to.id}: ${item.type} off the kenzan`);
    if(item.x!==before.x)moved++;
   });
   assert.deepEqual(s.items.map(i=>i.x),studyState(study).items.map(i=>i.x),'input untouched');
  }
 }
 assert.equal(switches,50*30);assert.ok(moved>0);
 // Detached cut pieces and stems that were already off the mouth only move with the vessel.
 const round=assetById.round,bottle=assetById.bottle,a=assetById['photo-rose'];
 const piece=makeItem(a.id,{x:30,y:40,localCuts:[{part:'detached',cut:{}}]}),loose=makeItem(a.id,{x:20,y:30});
 assert.ok(isDetachedPiece(piece));assert.equal(isDetachedPiece(loose),false);
 const d=vesselGeometry(bottle).insertion.map((v,i)=>v-vesselGeometry(round).insertion[i]);
 for(const [item,out] of [piece,loose].map(i=>[i,remapSeated([i],round,bottle,assetById)[0]]))assert.deepEqual([out.x,out.y,out.angle],[item.x+d[0],item.y+d[1],item.angle]);
});

test('the cherry study\'s low front sakura enters the pitcher mouth instead of standing on its lip',()=>{
 const s=studyState(studies.find(st=>st.id==='cherry')),v=assetById[s.vessel],sakura=s.items.find(i=>i.type==='photo-sakura');
 const span=mouthSpan(v,sakura.x,.55,{front:true});
 assert.ok(sakura.aboveVessel&&sakura.x>=span.lo&&sakura.x<=span.hi,`base x ${sakura.x} outside ${span.lo}–${span.hi}`);
});
