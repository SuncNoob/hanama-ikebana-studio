// SPDX-FileCopyrightText: 2026 Marko Sun
// SPDX-License-Identifier: LicenseRef-Hanama-Proprietary
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assetById,studies,studyState,initial,specimenOrder,vesselOrder,dist} from './helpers/catalog.mjs';
import {legacyFlowers,legacyVessels,scenes,saturationTune} from '../dist/legacy-catalog.js?v=hn2';
import {createItem,buildStudyItems,buildDemoItems,placeSpecs,demoSpecs,demoVessel} from '../dist/study-state.js?v=hn3';
import {sizeBounds,mouthBase,tipPoint,crownPoint,drawsStem,stemCm,isKenzan,autoFront,seatState,baseOffset,angleCap,slotState,PHOTO_LENGTH} from '../dist/scale.js?v=hn3';
import {vesselGeometry,sourceToStage} from '../dist/geometry.js?v=28';
import {specimenMetrics} from '../dist/asset-metrics.js?v=hn2';
import {stemMaxCm} from '../dist/botany.js';

const appSource=readFileSync(`${dist}app.js`,'utf8');

test('app.js builds its asset map from the moved modules in the same order the dev catalog uses',()=>{
 const spread=name=>appSource.match(new RegExp(`const ${name}=\\[([^\\]]*)\\];`))?.[1].split(',').map(part=>part.replace('...','').trim());
 assert.deepEqual(spread('specimens'),specimenOrder);
 assert.deepEqual(spread('vessels'),vesselOrder);
 assert.match(appSource,/from '\.\/legacy-catalog\.js\?v=hn2'/);
 assert.match(appSource,/from '\.\/study-state\.js\?v=hn3'/);
 assert.doesNotMatch(appSource,/const (legacyFlowers|scenes|saturation)=/,'legacy literals must live only in legacy-catalog.js');
});

test('legacy catalogue keeps its six flowers, two vessels, three scenes and twelve tone corrections',()=>{
 assert.deepEqual(legacyFlowers.map(a=>a.id),['sakura','calla','chrysanthemum','pine','maple','pampas']);
 assert.deepEqual(legacyVessels.map(a=>a.id),['round','bottle']);
 assert.deepEqual(Object.keys(scenes),['paper','stone','night']);
 for(const scene of Object.values(scenes))assert.equal(scene.length,4);
 assert.equal(Object.keys(saturationTune).length,12);
 for(const [id,tone] of Object.entries(saturationTune)){assert.ok(assetById[id],`${id} is not an asset`);assert.equal(assetById[id].saturation,tone)}
});

test('createItem has every field validate() rebuilds, and options override them',()=>{
 const item=createItem({height:30,stemLength:1.2},'photo-rose','x1',{h:28,aboveVessel:true});
 assert.deepEqual(Object.keys(item),['id','type','x','y','h','angle','trim','flip','length','cuts','segments','localCuts','pieceLabel','aboveVessel','cropAnchorY','cropAnchorSourceY','sv']);
 assert.equal(item.h,28);assert.equal(item.length,1.2);assert.equal(item.aboveVessel,true);assert.equal(item.sv,2,'new items draw stems with renderer v2');
 assert.equal(createItem({},'x','x2').h,48);
});

/** Study items allowed to miss their `to` focus by more than 8 cm (none today; at most five may ever be listed). */
const MISS_ALLOWED=new Set([]);
const insideFixture=(vessel,[x,y])=>{const f=vesselGeometry(vessel).fixture;return f.centers.some(c=>((x-c[0])/f.radius[0])**2+((y-c[1])/f.radius[1])**2<=1)};

test('all 50 studies build from the pure core: known materials, natural size, seated bases, honest stems, on stage',t=>{
 assert.equal(studies.length,50);assert.ok(MISS_ALLOWED.size<=5);
 let count=0,kenzanStems=0;const tips=[],crowns=[],misses=[];
 for(const study of studies){
  const vessel=assetById[study.vessel];assert.ok(vessel,`${study.id}: unknown vessel ${study.vessel}`);
  const s=studyState(study,'en');
  assert.equal(s.title,study.title[1]);assert.equal(s.vessel,study.vessel);assert.equal(s.scene,study.scene);assert.equal(s.mood,study.mood);assert.equal(s.intention,'');
  assert.ok(Object.hasOwn(scenes,s.scene),`${study.id}: unknown scene`);
  assert.equal(s.items.length,study.items.length);assert.equal(new Set(s.items.map(i=>i.id)).size,s.items.length);
  const insertion=vesselGeometry(vessel).insertion;
  s.items.forEach((item,index)=>{
   const spec=study.items[index],a=assetById[spec.type],label=`${study.id}/${spec.type}`,to=spec.to??[0,20];count++;
   assert.ok(a,`${study.id}: unknown material ${spec.type}`);
   const [min,max]=sizeBounds(a);assert.ok(item.h>=min-.05&&item.h<=max+.05,`${label}: h ${item.h} outside ${min}–${max}`);
   const front=spec.front??isKenzan(vessel);
   assert.equal(item.aboveVessel,front,`${label}: front`);assert.equal(item.flip,!!spec.flip);
   assert.deepEqual([item.x,item.y],mouthBase(vessel,insertion[0]+(spec.base??baseOffset(to[0],to[1])),.8,{front}),`${label}: base`);
   assert.ok(seatState(item,a,vessel).seated,`${label}: base not seated`);
   if(isKenzan(vessel)){kenzanStems++;assert.ok(insideFixture(vessel,[item.x,item.y]),`${label}: base off the kenzan`)}
   assert.ok(Number.isFinite(item.angle)&&Number.isFinite(item.length),`${label}: unsolved`);
   assert.ok(item.length!==.6&&item.length!==2.4,`${label}: length at the old squash/stretch limit (${item.length})`);
   if(drawsStem(a)){
    assert.ok(Math.abs(item.angle)<=60&&Math.abs(item.angle)<=angleCap(a),`${label}: drawn stem tipped ${item.angle}°`);
    assert.ok(item.length>=1&&item.trim===0,`${label}: drawn-stem head squashed or trimmed`);
    assert.ok(stemCm(item,a)<=stemMaxCm(a)+.05,`${label}: drawn stem over its cap`);
   }else{
    assert.ok(item.length>=.85&&item.length<=1.2&&item.length>=PHOTO_LENGTH[0]&&item.length<=PHOTO_LENGTH[1],`${label}: photo stem length ${item.length}`);
    assert.ok(item.trim>=0&&item.trim<=60,`${label}: trim ${item.trim}`);
   }
   const tip=tipPoint(item,a),crown=crownPoint(item,a),miss=Math.hypot(tip[0]-insertion[0]-to[0],tip[1]-insertion[1]+to[1]);
   assert.deepEqual(crown,specimenMetrics[a.id]?.crown?sourceToStage(specimenMetrics[a.id].crown,item,a).map(v=>v*100):tip);
   tips.push(tip);crowns.push(crown);misses.push(miss);
   assert.ok(miss<=8||MISS_ALLOWED.has(label),`${label}: focus misses its target by ${miss.toFixed(1)} cm`);
   assert.ok(crown.every(v=>v>=0&&v<=100),`${label}: crown ${crown.map(v=>v.toFixed(1))} outside the stage`);
  });
 }
 assert.equal(count,241);assert.ok(kenzanStems>60);
 const bounds=points=>[0,1].map(k=>`${Math.min(...points.map(p=>p[k])).toFixed(1)}…${Math.max(...points.map(p=>p[k])).toFixed(1)}`).join(' / ');
 t.diagnostic(`${count} stems; tips x/y ${bounds(tips)}; crowns x/y ${bounds(crowns)}; worst focus miss ${Math.max(...misses).toFixed(1)} cm`);
});

test('kenzan studies stand their stems on the pins in front of the basin unless a stem says otherwise',()=>{
 const kenzan=studies.filter(st=>isKenzan(assetById[st.vessel]));
 assert.equal(kenzan.length,16);
 assert.equal(studies.flatMap(st=>st.items).filter(i=>i.front===false).length,0,'no study sets front:false');
 for(const study of kenzan)for(const item of studyState(study).items)assert.equal(item.aboveVessel,true,study.id);
});

test('the first-run draft is a small study in the round vase: pine, calla and a low red camellia, true size, seated, three slots',()=>{
 const s=initial(),vessel=assetById[s.vessel];
 assert.equal(s.vessel,'round');assert.equal(s.scene,'paper');assert.equal(demoVessel,'round');
 assert.deepEqual(s.items.map(i=>i.type),['pine-green-sparse','calla-ivory-front','camellia-red-front']);
 assert.deepEqual(demoSpecs.map(d=>d.family),['pine','calla','camellia']);
 const insertion=vesselGeometry(vessel).insertion;
 s.items.forEach((item,k)=>{
  const a=assetById[item.type],ratio=item.h/a.height,to=demoSpecs[k].to,tip=tipPoint(item,a);
  assert.ok(ratio>=.8&&ratio<=1.25,`${item.type}: ${Math.round(ratio*100)}% of true size`);
  assert.ok(seatState(item,a,vessel).seated,`${item.type}: unseated`);
  assert.equal(item.aboveVessel,autoFront(vessel));assert.equal(item.aboveVessel,false);
  assert.ok(Math.hypot(tip[0]-insertion[0]-to[0],tip[1]-insertion[1]+to[1])<=3,`${item.type}: focus off its place`);
  assert.ok(crownPoint(item,a).every(v=>v>=3&&v<=97));
 });
 assert.equal(s.items[2].h,Math.round(assetById['camellia-red-front'].height*1*10)/10);
 assert.ok(seatState(s.items[2],assetById['camellia-red-front'],vessel).seated,'the low camellia is seated in the vase');
 const {taken}=slotState(s,assetById);
 for(const slot of ['shin','soe','hikae'])assert.equal(taken[slot],true,`${slot} not filled`);
 const specimenFor=family=>({pine:{id:'pine'},calla:{id:'calla'},chrysanthemum:{id:'chrysanthemum'}})[family];
 assert.deepEqual(buildDemoItems({assetById,makeItem:(type,options)=>({type,...createItem(assetById[type],type,'x',options)}),specimenFor}).map(i=>i.type),['pine','calla','camellia-red-front']);
});

test('app.js opens the first-run demo with nothing selected and swaps poses within the natural size range',()=>{
 assert.match(appSource,/selected=fromInitial\?null:/);
 assert.match(appSource,/buildDemoItems\(\{assetById,makeItem,specimenFor\}\)/);
 assert.doesNotMatch(appSource,/,\.8,1\.25\)/,'no hard-coded size range: use sizeBounds / sizeRatioBounds');
 assert.match(appSource,/sizeRatioBounds\(after\)/,'a pose swap keeps the size ratio within the new pose’s natural range');
});

test('placeSpecs uses the caller’s factory, keeps explicit bases and front flags, and clamps s to the natural range',()=>{
 const vessel=assetById.round,insertion=vesselGeometry(vessel).insertion;
 const [huge,tiny,fixed]=placeSpecs(vessel,[{type:'photo-rose',s:3},{type:'photo-rose',s:.1,front:true},{type:'photo-rose',to:[10,10],base:-1.5}],{assetById,makeItem:(type,options)=>createItem(assetById[type],type,'p',options)});
 const [min,max]=sizeBounds(assetById['photo-rose']);
 assert.equal(huge.h,max);assert.equal(tiny.h,min);assert.equal(tiny.aboveVessel,true);assert.equal(huge.aboveVessel,false);
 assert.deepEqual([fixed.x,fixed.y],mouthBase(vessel,insertion[0]-1.5,.8));
});

test('drawn stems in studies stay a solved length, and buildStudyItems uses the caller’s item factory',()=>{
 const ids=[];const items=buildStudyItems(studies[0],{assetById,makeItem:(type,options)=>{const item=createItem(assetById[type],type,`k${ids.length}`,options);ids.push(item.id);return item}});
 assert.deepEqual(items.map(i=>i.id),ids);
 for(const item of items){const a=assetById[item.type];if(drawsStem(a))assert.ok(stemCm(item,a)>=0)}
});
