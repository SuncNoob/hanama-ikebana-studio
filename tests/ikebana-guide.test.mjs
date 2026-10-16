// SPDX-FileCopyrightText: 2026 Marko Sun
// SPDX-License-Identifier: LicenseRef-Hanama-Proprietary
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assetById,vessels,makeItem,dist} from './helpers/catalog.mjs';
import {
 guideRays,guideReading,fitToSlot,insertIndex,slotReach,slotTarget,slotLean,slotState,planSlot,shinCm,SLOTS,SLANTING,GUIDE_SLOTS,
 tipPoint,crownPoint,seatState,headroom,autoFront,isKenzan,stemCm,drawsStem,hashId
} from '../dist/scale.js?v=scale4';
import {stemMaxCm,roleOf} from '../dist/botany.js?v=hn2';
import {vesselGeometry} from '../dist/geometry.js?v=soft2';

const STYLES=['upright','slanting'],HANDS=[1,-1];
const dist2=(p,q)=>Math.hypot(p[0]-q[0],p[1]-q[1]);
const primary=v=>{const g=vesselGeometry(v);return g.openings.find(o=>o.primary)||g.openings[0]};
/** Add stems the way app.js addSpecimen does: planSlot (with the guide's choice), then insertIndex for paint order. */
function arrange(vessel,id,types,guide={}){
 const s={id,vessel:vessel.id,items:[]},plans=[],placed=[];
 for(const type of types){
  const a=assetById[type],plan=planSlot(s,a,assetById,{},guide),{miss,...fit}=plan.fit;
  const item=Object.assign(makeItem(type,{h:plan.h,flip:plan.flip,aboveVessel:plan.front}),fit);
  s.items.splice(insertIndex(s.items,item,assetById),0,item);plans.push(plan);placed.push(item);
 }
 return {s,plans,placed};
}
/** Two arrangement ids whose hashes lean opposite ways. */
const SIDES=(()=>{const ids=[];for(let k=0;ids.length<2;k++){const id=`guide-${k}`;if(!ids.some(i=>(hashId(i)&1)===(hashId(id)&1)))ids.push(id)}return ids})();

test('guide rays over every vessel × style × hand: on the stage, above the rim, frac × the main line, mirrored by the hand',()=>{
 assert.ok(vessels.length>0,'the vessel catalogue is populated');
 let count=0;
 for(const vessel of vessels)for(const style of STYLES)for(const side of HANDS){
  const rays=guideRays(vessel,{style,side}),g=vesselGeometry(vessel),rim=primary(vessel)?.frontRimY??g.insertion[1];count++;
  assert.deepEqual(rays.map(r=>r.key),GUIDE_SLOTS);
  for(const ray of rays){
   const label=`${vessel.id}/${style}/${side}/${ray.key}`,[x,y]=ray.target;
   assert.ok(x>=3&&x<=97&&y>=3&&y<=97,`${label}: target ${x.toFixed(1)},${y.toFixed(1)} off the stage`);
   assert.ok(y<rim&&y<g.insertion[1],`${label}: target ${y.toFixed(1)} not above the rim ${rim.toFixed(1)}`);
   assert.deepEqual(ray.from,g.insertion);
   assert.ok(Math.abs(dist2(ray.from,ray.target)-ray.cm)<1e-9,label);
   const frac=SLOTS.find(s=>s.key===ray.key).frac;
   if(!ray.clamped)assert.ok(Math.abs(ray.cm-frac*shinCm(vessel))<1e-9,`${label}: ${ray.cm} ≠ ${frac}× the main line`);
   assert.equal(Math.sign(x-g.insertion[0]),Math.sign(slotLean(ray.key,style))*side,`${label}: leans the wrong way`);
   // The guide draws exactly where planSlot aims.
   assert.deepEqual(ray.target,slotTarget(vessel,ray.key,side,style));
  }
 }
 assert.equal(count,vessels.length*STYLES.length*HANDS.length);
 assert.deepEqual(SLANTING,{shin:48,soe:14});
 assert.equal(slotLean('shin','slanting'),48);assert.equal(slotLean('soe','slanting'),14);assert.equal(slotLean('hikae','slanting'),-65);
 assert.equal(slotLean('shin'),12);assert.equal(slotLean('jushi-2','slanting'),-25);
});

test('slotReach shortens a ray that would leave the stage and marks it ≈; the upright slots are unchanged',()=>{
 const round=assetById.round,g=vesselGeometry(round);
 for(const s of SLOTS)assert.deepEqual(slotReach(round,s.key,1).target,slotTarget(round,s.key,1));
 // A made-up vessel standing near the right edge: its slanting main line would leave the stage.
 const edge={...round,id:'qa-edge',insertion:[90,66]},ray=slotReach(edge,'shin',1,'slanting'),full=shinCm(edge);
 assert.equal(ray.clamped,true);assert.ok(Math.abs(ray.target[0]-97)<1e-9,`x ${ray.target[0]}`);assert.ok(ray.cm<full);
 assert.ok(Math.abs(Math.atan2(ray.target[0]-90,66-ray.target[1])*180/Math.PI-48)<1e-6,'shortened along its own lean');
 assert.equal(slotReach(edge,'shin',-1,'slanting').clamped,false,'mirrored it fits');
 // A main line the stage top caps (shinCm hit insertion − 8) is marked too.
 const high={...round,id:'qa-high',insertion:[50,24]};
 assert.equal(slotReach(high,'soe',1).clamped,true);assert.equal(shinCm(high),16);
 assert.equal(slotReach(round,'shin',1).clamped,false);assert.equal(g.insertion[1],66);
});

test('planSlot follows the guide while it is shown: the chosen side and the slanting leans',()=>{
 for(const vessel of vessels)for(const style of STYLES)for(const side of HANDS){
  const pine=assetById.pine,s={id:SIDES[0],vessel:vessel.id,items:[]},plan=planSlot(s,pine,assetById,{},{style,side});
  assert.equal(plan.slot,'shin');assert.equal(plan.side,side,`${vessel.id}/${style}: side`);
  const ray=guideRays(vessel,{style,side})[0];
  // Unless the headroom rule had to lower or lean it, the stem's focus lands on the drawn ray's target.
  if(plan.headroom>=3&&plan.target[0]===ray.target[0]&&plan.target[1]===ray.target[1])assert.ok(plan.fit.miss<=1.5,`${vessel.id}/${style}/${side}: miss ${plan.fit.miss}`);
 }
 // Without a guide choice nothing changes: the side of the tallest stem, else the id's hash.
 const round=assetById.round,a=assetById.calla;
 assert.deepEqual(planSlot({id:SIDES[0],vessel:'round',items:[]},a,assetById),planSlot({id:SIDES[0],vessel:'round',items:[]},a,assetById,{},{}));
 assert.equal(slotState({id:SIDES[1],vessel:round,items:[]},assetById,{side:-1}).side,-1);
 assert.equal(slotState({id:SIDES[1],vessel:round,items:[]},assetById).side,hashId(SIDES[1])&1?1:-1);
});

test('guideReading: a stem placed in a slot reads that slot, filled, with its reach and the vessel ratio',()=>{
 let checked=0;
 for(const vid of ['round','celadon-shallow-suiban','book-vessel-turquoise-jug','matte-black-long-neck']){
  const vessel=assetById[vid],{s,plans,placed}=arrange(vessel,SIDES[0],['calla','photo-iris','photo-chrysanthemum']);
  const side=slotState(s,assetById).side,rays=guideRays(vessel,{side}),g=vesselGeometry(vessel),M=Math.max(g.height,g.width);
  placed.forEach((item,k)=>{
   const plan=plans[k],a=assetById[item.type],reading=guideReading(item,a,vessel,rays);
   if(plan.side!==side||plan.fit.miss>1||Math.hypot(plan.target[0]-plan.fit.x,plan.target[1]-plan.fit.y)<1)return;
   if(dist2(plan.target,slotTarget(vessel,plan.key,side))>.01)return;// lowered for headroom: not on the ray
   checked++;
   assert.equal(reading.key,plan.key,`${vid}/${item.type}`);assert.equal(reading.filled,true,`${vid}/${item.type}`);
   assert.ok(Math.abs(reading.reach-reading.target)<=3,`${vid}/${item.type}: ${reading.reach} / ${reading.target}`);
   const point=[tipPoint(item,a),crownPoint(item,a)].sort((p,q)=>dist2(p,plan.target)-dist2(q,plan.target))[0];
   assert.equal(reading.ratio,Math.round(dist2(g.insertion,point)/M*10)/10);
  });
 }
 assert.ok(checked>=8,`only ${checked} stems checked`);
 assert.equal(guideReading(makeItem('pine'),assetById.pine,assetById.round,[]),null);
});

test('fitToSlot puts a stem on a ray in one step: seated stems keep their base, others get a mouth base; cut stems keep their trim',()=>{
 const vessel=assetById.round,rays=guideRays(vessel,{side:1}),g=vesselGeometry(vessel);
 for(const type of ['pine','calla','photo-chrysanthemum','photo-rose','photo-delphinium']){
  const a=assetById[type];
  for(const ray of rays){
   const item=makeItem(type,{x:g.insertion[0]+.5,y:g.insertion[1],angle:-20});
   const fit=fitToSlot(item,a,vessel,ray.target),placed={...item,...fit};
   assert.equal(fit.x,item.x);assert.equal(fit.y,item.y);
   assert.ok(seatState(placed,a,vessel).seated,`${type}/${ray.key}: unseated`);
   if(drawsStem(a))assert.ok(stemCm(placed,a)<=Math.max(stemMaxCm(a),0)+.05,`${type}/${ray.key}: stem over its cap`);
   assert.ok(fit.miss<=3||!drawsStem(a),`${type}/${ray.key}: miss ${fit.miss}`);
  }
  // Out of the vessel: the base goes into the mouth first.
  const away=makeItem(type,{x:20,y:40}),fit=fitToSlot(away,a,vessel,rays[0].target);
  assert.ok(seatState({...away,...fit},a,vessel).seated,`${type}: not put back into the vessel`);
 }
 const cut=makeItem('photo-rose',{x:g.insertion[0],y:g.insertion[1],trim:7,localCuts:[{part:'main'}]}),fit=fitToSlot(cut,assetById['photo-rose'],vessel,rays[2].target);
 assert.equal(fit.trim,undefined,'a stem with cuts is re-aimed with reach, which keeps its trim');
 assert.equal(fit.cropAnchorSourceY,null);
});

test('insertIndex: lines and foliage go in before the first flower of their layer group, flowers on top',()=>{
 const items=[makeItem('pine'),makeItem('photo-rose'),makeItem('photo-chrysanthemum',{aboveVessel:true}),makeItem('photo-gypsophila')];
 assert.equal(roleOf(assetById.calla),'line');
 assert.equal(insertIndex(items,makeItem('calla'),assetById),1,'a line behind the vessel goes before the first bloom behind it');
 assert.equal(insertIndex(items,makeItem('calla',{aboveVessel:true}),assetById),2,'in front of the vessel: before the first bloom in front');
 assert.equal(insertIndex(items,makeItem('photo-peony'),assetById),items.length,'blooms go last');
 const fern=Object.keys(assetById).find(id=>assetById[id].family&&roleOf(assetById[id])==='foliage');
 assert.equal(insertIndex(items,makeItem(fern),assetById),1);
 assert.equal(insertIndex([makeItem('pine')],makeItem('calla'),assetById),1,'no flower in the group: last');
});

test('A12 accept: five stems in five vessels spread their heads, stay on the stage, seated, in front on a kenzan and behind in a neck',()=>{
 for(const vid of ['round','matte-black-long-neck','celadon-shallow-suiban','book-vessel-turquoise-jug','modern-travertine-trough'])for(const id of SIDES){
  const vessel=assetById[vid],{s,plans}=arrange(vessel,id,['pine','calla','photo-chrysanthemum','photo-gypsophila','photo-rose']);
  const crowns=s.items.map(i=>crownPoint(i,assetById[i.type])[1]);
  assert.ok(Math.max(...crowns)-Math.min(...crowns)>=25,`${vid}/${id}: heads within ${(Math.max(...crowns)-Math.min(...crowns)).toFixed(1)} cm`);
  for(const item of s.items){
   const a=assetById[item.type],label=`${vid}/${id}/${item.type}`;
   assert.ok(seatState(item,a,vessel).seated,`${label}: unseated`);
   assert.ok(headroom(item,a)>=3,`${label}: clipped at the top`);
   if(isKenzan(vessel))assert.equal(item.aboveVessel,true,`${label}: kenzan stems stand in front`);
   if(roleOf(a)==='line'&&!autoFront(vessel))assert.equal(item.aboveVessel,false,`${label}: a line in a neck stays behind the rim`);
  }
  assert.deepEqual(plans.slice(0,3).map(p=>p.slot),['shin','soe','hikae'],`${vid}/${id}`);
 }
});

const app=readFileSync(`${dist}app.js`,'utf8'),html=readFileSync(`${dist}index.html`,'utf8');

test('app.js and index.html: no front/back question when adding, honest length slider, the guide and start card in three languages',()=>{
 assert.match(app,/function addSpecimen\(type,placement='auto'\)/);
 assert.doesNotMatch(app,/insert-position|data-insert-position/,'the pose dialog no longer asks 最前层/最后层');
 assert.doesNotMatch(app,/追加位置は最前面か最後面/);
 assert.match(app,/planSlot\(state,a,assetById,\{\},guidePlan\(\)\)/,'adding and the guide share planSlot');
 assert.match(app,/guideRays\(vessel,\{style:guidePrefs\.style,side\}\)/);
 assert.doesNotMatch(app,/MAX_STEM_CM/,'the length slider and arrows stop at the species length (stemCeil), not the hard limit');
 assert.match(app,/const stemCeil=\(i,a\)=>Math\.max\(stemMaxCm\(a\),Math\.round\(stemCm\(i,a\)\)\)/);
 assert.match(app,/try\{const saved=JSON\.parse\(localStorage\.getItem\(GUIDE_STORE\)/);
 assert.match(app,/function saveGuidePrefs\(\)\{try\{localStorage\.setItem\(GUIDE_STORE/);
 assert.match(html,/<svg id="ikebana-guide" class="ikebana-guide" viewBox="0 0 100 100" preserveAspectRatio="none"/);
 for(const id of ['guide-panel','guide-reading','guide-fit','guide-thirds','start-card-wrap','start-line','start-studies','start-help','stem-cap-warning','stem-cap-reset'])assert.ok(html.includes(`id="${id}"`),id);
 // Every static string of the new controls has zh, en and ja.
 const block=(from,to)=>html.slice(html.indexOf(from),html.indexOf(to,html.indexOf(from)));
 for(const part of [block('<div id="guide-panel"','<div class="quick-material-bar"'),block('<div id="start-card-wrap"','</section>'),block('<p id="stem-cap-warning"','</p>')])
  for(const tag of part.match(/<[^>]*data-zh=[^>]*>/g)||[])assert.match(tag,/data-en="[^"]+"[^>]*data-ja="[^"]+"/,tag);
 // New dynamic strings use the three-argument L().
 for(const zh of ['添入${a.bundle?','比一般的${name}长','已恢复自然长度','选中一枝，看看它离哪条线最近。','够不到这条线，已尽量靠近','画布还空着。'])assert.ok(app.includes(zh),zh);
 assert.match(app,/L\(`添入\$\{a\.bundle\?'一组':'一枝'\}\$\{name\} · \$\{slot\}`,`Added \$\{name\} · \$\{slot\}`,`\$\{name\}を加えました · \$\{slot\}`\)/);
});
